import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, 'jejaktani.db');

export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('petani','buyer','admin','agen')),
  nama TEXT NOT NULL,
  no_hp TEXT,
  kelompok_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS kelompok_tani (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  desa TEXT,
  kecamatan TEXT,
  kabupaten TEXT,
  ketua_user_id TEXT NOT NULL REFERENCES users(id),
  deskripsi TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS kelompok_anggota (
  id TEXT PRIMARY KEY,
  kelompok_id TEXT NOT NULL REFERENCES kelompok_tani(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  peran TEXT NOT NULL DEFAULT 'anggota' CHECK(peran IN ('ketua','sekretaris','bendahara','anggota')),
  joined_at TEXT DEFAULT (datetime('now')),
  UNIQUE(kelompok_id, user_id)
);

CREATE TABLE IF NOT EXISTS petani (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  nik TEXT,
  alamat TEXT,
  desa TEXT,
  tanggal_daftar TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sertifikasi_produk (
  id TEXT PRIMARY KEY,
  produk_id TEXT NOT NULL,
  jenis TEXT NOT NULL,
  nomor_sertifikat TEXT NOT NULL,
  penerbit TEXT NOT NULL,
  tanggal_terbit TEXT NOT NULL,
  tanggal_kadaluarsa TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  diverifikasi_oleh TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (produk_id) REFERENCES produk (id)
);

CREATE TABLE IF NOT EXISTS lahan (
  id TEXT PRIMARY KEY,
  petani_id TEXT NOT NULL REFERENCES petani(id),
  luas_ha REAL,
  lokasi_gps TEXT,
  komoditas TEXT
);

CREATE TABLE IF NOT EXISTS produk (
  id TEXT PRIMARY KEY,
  lahan_id TEXT NOT NULL REFERENCES lahan(id),
  nama TEXT NOT NULL,
  kategori TEXT NOT NULL,
  grade TEXT NOT NULL CHECK(grade IN ('A','B','C')),
  jumlah_kg REAL NOT NULL,
  jumlah_terjual_kg REAL NOT NULL DEFAULT 0,
  harga_per_kg REAL NOT NULL,
  tanggal_panen TEXT NOT NULL,
  qr_code TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'panen' CHECK(status IN ('panen','grading','gudang','dipasarkan','habis')),
  deskripsi TEXT,
  foto_emoji TEXT DEFAULT '\\u{1F955}',
  batch_no TEXT,
  tanggal_masuk_gudang TEXT,
  tanggal_kadaluarsa TEXT,
  gudang_id TEXT REFERENCES gudang(id),
  ai_grade TEXT,
  ai_confidence REAL,
  ai_reasoning TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS traceability_log (
  id TEXT PRIMARY KEY,
  produk_id TEXT NOT NULL REFERENCES produk(id),
  tahap TEXT NOT NULL,
  lokasi TEXT,
  catatan TEXT,
  suhu_celcius REAL,
  cuaca TEXT,
  kondisi_cold_chain TEXT,
  waktu TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS buyer (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  tipe TEXT NOT NULL CHECK(tipe IN ('b2c','b2b')),
  nama_usaha TEXT,
  npwp TEXT,
  alamat TEXT
);

CREATE TABLE IF NOT EXISTS gudang (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  lokasi TEXT NOT NULL,
  lokasi_gps TEXT,
  kapasitas_ton REAL NOT NULL,
  kapasitas_terpakai_ton REAL NOT NULL DEFAULT 0,
  tipe TEXT NOT NULL DEFAULT 'normal' CHECK(tipe IN ('normal','cold_storage')),
  suhu_target REAL
);

CREATE TABLE IF NOT EXISTS gudang_stok (
  id TEXT PRIMARY KEY,
  gudang_id TEXT NOT NULL REFERENCES gudang(id),
  produk_id TEXT NOT NULL REFERENCES produk(id),
  jumlah_kg REAL NOT NULL DEFAULT 0,
  batch_no TEXT,
  tanggal_masuk TEXT DEFAULT (datetime('now')),
  tanggal_kadaluarsa TEXT,
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(gudang_id, produk_id, batch_no)
);

CREATE TABLE IF NOT EXISTS armada (
  id TEXT PRIMARY KEY,
  jenis_kendaraan TEXT NOT NULL,
  plat_nomor TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'tersedia' CHECK(status IN ('tersedia','bertugas','perbaikan'))
);

CREATE TABLE IF NOT EXISTS pesanan (
  id TEXT PRIMARY KEY,
  produk_id TEXT NOT NULL REFERENCES produk(id),
  buyer_id TEXT NOT NULL REFERENCES buyer(id),
  jumlah_kg REAL NOT NULL,
  harga_total REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'menunggu_pembayaran'
    CHECK(status IN ('menunggu_pembayaran','dibayar','disiapkan','dikirim','selesai','dibatalkan')),
  tipe_pengiriman TEXT DEFAULT 'reguler' CHECK(tipe_pengiriman IN ('same_day','reguler','tanpa_kontak')),
  catatan_alamat TEXT,
  preorder_id TEXT REFERENCES preorder(id),
  gudang_asal_id TEXT REFERENCES gudang(id),
  vendor_logistik TEXT,
  no_resi TEXT,
  tanggal_pesan TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pengiriman (
  id TEXT PRIMARY KEY,
  pesanan_id TEXT NOT NULL REFERENCES pesanan(id),
  gudang_id TEXT REFERENCES gudang(id),
  armada_id TEXT REFERENCES armada(id),
  status TEXT NOT NULL DEFAULT 'menunggu' CHECK(status IN ('menunggu','dalam_perjalanan','tiba')),
  jarak_km REAL,
  durasi_menit REAL,
  rute_geometry TEXT,
  vendor_logistik TEXT,
  no_resi_vendor TEXT,
  estimasi_tiba TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS kontrak_b2b (
  id TEXT PRIMARY KEY,
  buyer_id TEXT NOT NULL REFERENCES buyer(id),
  komoditas TEXT NOT NULL,
  volume_rutin_kg REAL NOT NULL,
  frekuensi TEXT NOT NULL CHECK(frekuensi IN ('mingguan','dwi_mingguan','bulanan')),
  harga_terkunci_per_kg REAL NOT NULL,
  termin_hari INTEGER NOT NULL DEFAULT 14,
  status TEXT NOT NULL DEFAULT 'aktif' CHECK(status IN ('aktif','selesai','dibatalkan')),
  tanggal_mulai TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rating (
  id TEXT PRIMARY KEY,
  pesanan_id TEXT NOT NULL REFERENCES pesanan(id),
  dari_user_id TEXT NOT NULL REFERENCES users(id),
  untuk_user_id TEXT NOT NULL REFERENCES users(id),
  skor INTEGER NOT NULL CHECK(skor BETWEEN 1 AND 5),
  komentar TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS harga_referensi (
  id TEXT PRIMARY KEY,
  komoditas TEXT NOT NULL,
  harga_per_kg REAL NOT NULL,
  tanggal TEXT NOT NULL,
  sumber TEXT NOT NULL DEFAULT 'Panel Harga Pangan Nasional'
);

CREATE TABLE IF NOT EXISTS sengketa (
  id TEXT PRIMARY KEY,
  pesanan_id TEXT NOT NULL REFERENCES pesanan(id),
  diajukan_oleh TEXT NOT NULL REFERENCES users(id),
  alasan TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','selesai')),
  resolusi TEXT,
  admin_id TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  resolved_at TEXT
);

-- Preorder: komoditas musiman dengan harga terkunci dan tanggal kedaluwarsa
CREATE TABLE IF NOT EXISTS preorder (
  id TEXT PRIMARY KEY,
  komoditas TEXT NOT NULL,
  deskripsi TEXT,
  harga_terkunci_per_kg REAL NOT NULL,
  jumlah_min_kg REAL NOT NULL DEFAULT 1,
  jumlah_maks_kg REAL NOT NULL DEFAULT 10000,
  jumlah_dipesan_kg REAL NOT NULL DEFAULT 0,
  tanggal_buka TEXT NOT NULL DEFAULT (datetime('now')),
  tanggal_tutup TEXT NOT NULL,
  tanggal_panen_estimasi TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'buka' CHECK(status IN ('buka','tutup','kedaluwarsa','terpenuhi','batal')),
  petani_id TEXT REFERENCES petani(id),
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS preorder_pesanan (
  id TEXT PRIMARY KEY,
  preorder_id TEXT NOT NULL REFERENCES preorder(id),
  buyer_id TEXT NOT NULL REFERENCES buyer(id),
  jumlah_kg REAL NOT NULL,
  harga_total REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'terkunci' CHECK(status IN ('terkunci','dibayar','dibatalkan','selesai')),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Cold chain monitoring
CREATE TABLE IF NOT EXISTS cold_chain_log (
  id TEXT PRIMARY KEY,
  gudang_id TEXT REFERENCES gudang(id),
  produk_id TEXT REFERENCES produk(id),
  suhu_celcius REAL NOT NULL,
  kelembapan REAL,
  kondisi TEXT NOT NULL DEFAULT 'normal' CHECK(kondisi IN ('normal','peringatan','kritis')),
  sumber TEXT DEFAULT 'sensor',
  catatan TEXT,
  waktu TEXT DEFAULT (datetime('now'))
);

-- Price trend cache
CREATE TABLE IF NOT EXISTS harga_tren (
  id TEXT PRIMARY KEY,
  komoditas TEXT NOT NULL,
  harga_hari_ini REAL NOT NULL,
  harga_7_hari_lalu REAL,
  perubahan_persen REAL,
  arah TEXT CHECK(arah IN ('naik','turun','stabil')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Education content for WhatsApp
CREATE TABLE IF NOT EXISTS edukasi_konten (
  id TEXT PRIMARY KEY,
  judul TEXT NOT NULL,
  kategori TEXT NOT NULL DEFAULT 'umum' CHECK(kategori IN ('umum','budidaya','pascapanen','pemasaran','keuangan')),
  konten TEXT NOT NULL,
  media_url TEXT,
  urutan INTEGER NOT NULL DEFAULT 0,
  aktif INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS edukasi_log (
  id TEXT PRIMARY KEY,
  konten_id TEXT NOT NULL REFERENCES edukasi_konten(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  dikirim_via TEXT NOT NULL DEFAULT 'whatsapp',
  status TEXT NOT NULL DEFAULT 'terkirim',
  waktu TEXT DEFAULT (datetime('now'))
);

-- AI Grading results
CREATE TABLE IF NOT EXISTS grading_ai (
  id TEXT PRIMARY KEY,
  produk_id TEXT REFERENCES produk(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  foto_path TEXT,
  grade_hasil TEXT NOT NULL CHECK(grade_hasil IN ('A','B','C')),
  confidence REAL NOT NULL,
  analisis_warna TEXT,
  analisis_ukuran TEXT,
  analisis_cacat TEXT,
  reasoning TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Third-party logistics vendor
CREATE TABLE IF NOT EXISTS logistik_vendor (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  kode TEXT NOT NULL UNIQUE,
  tipe TEXT NOT NULL DEFAULT 'ekspedisi',
  api_endpoint TEXT,
  aktif INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

export function uid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
