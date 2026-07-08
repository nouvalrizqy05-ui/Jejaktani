import { Router } from 'express';
import QRCode from 'qrcode';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, uid } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { fetchCurrentClimate } from '../utils/climate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QR_DIR = path.join(__dirname, '..', '..', 'data', 'qrcodes');
if (!fs.existsSync(QR_DIR)) fs.mkdirSync(QR_DIR, { recursive: true });

const router = Router();

function withPetaniInfo(produk) {
  const lahan = db.prepare('SELECT * FROM lahan WHERE id = ?').get(produk.lahan_id);
  const petani = lahan ? db.prepare('SELECT * FROM petani WHERE id = ?').get(lahan.petani_id) : null;
  const trust = petani ? getTrustScore(petani.user_id) : null;
  return {
    ...produk,
    lahan,
    petani: petani ? { id: petani.id, desa: petani.desa, nama: petaniNama(petani.user_id), trust } : null,
  };
}

function petaniNama(userId) {
  const u = db.prepare('SELECT nama FROM users WHERE id = ?').get(userId);
  return u ? u.nama : 'Petani Jejak Tani';
}

function getTrustScore(userId) {
  const row = db.prepare(`SELECT AVG(skor) as avg_skor, COUNT(*) as jumlah FROM rating WHERE untuk_user_id = ?`).get(userId);
  return { rata_rata: row.avg_skor ? Math.round(row.avg_skor * 10) / 10 : null, jumlah_ulasan: row.jumlah };
}

// GET /api/produk - marketplace listing with filters
router.get('/', (req, res) => {
  const { kategori, search, grade } = req.query;
  let sql = `SELECT * FROM produk WHERE status IN ('dipasarkan','gudang')`;
  const params = [];
  if (kategori) { sql += ' AND kategori = ?'; params.push(kategori); }
  if (grade) { sql += ' AND grade = ?'; params.push(grade); }
  if (search) { sql += ' AND nama LIKE ?'; params.push(`%${search}%`); }
  sql += ' ORDER BY created_at DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(withPetaniInfo));
});

router.get('/kategori/list', (req, res) => {
  const rows = db.prepare(`SELECT DISTINCT kategori FROM produk`).all();
  res.json(rows.map(r => r.kategori));
});

// GET /api/produk/mine/list - petani's own products
router.get('/mine/list', requireAuth, requireRole('petani'), (req, res) => {
  const petani = db.prepare('SELECT * FROM petani WHERE user_id = ?').get(req.user.id);
  if (!petani) return res.json([]);
  const lahanIds = db.prepare('SELECT id FROM lahan WHERE petani_id = ?').all(petani.id).map(l => l.id);
  if (lahanIds.length === 0) return res.json([]);
  const placeholders = lahanIds.map(() => '?').join(',');
  const rows = db.prepare(`SELECT * FROM produk WHERE lahan_id IN (${placeholders}) ORDER BY created_at DESC`).all(...lahanIds);
  res.json(rows);
});

// GET /api/produk/:id
router.get('/:id', (req, res) => {
  const produk = db.prepare('SELECT * FROM produk WHERE id = ?').get(req.params.id);
  if (!produk) return res.status(404).json({ error: 'Produk tidak ditemukan.' });
  const log = db.prepare('SELECT * FROM traceability_log WHERE produk_id = ? ORDER BY waktu ASC').all(produk.id);
  res.json({ ...withPetaniInfo(produk), traceability: log });
});

// POST /api/produk - petani creates new harvest listing
router.post('/', requireAuth, requireRole('petani'), async (req, res) => {
  const { nama, kategori, grade, jumlah_kg, harga_per_kg, komoditas, deskripsi, foto_emoji, luas_ha, lokasi_gps } = req.body;
  if (!nama || !kategori || !grade || !jumlah_kg || !harga_per_kg) {
    return res.status(400).json({ error: 'Nama, kategori, grade, jumlah, dan harga wajib diisi.' });
  }
  const petani = db.prepare('SELECT * FROM petani WHERE user_id = ?').get(req.user.id);
  if (!petani) return res.status(400).json({ error: 'Profil petani tidak ditemukan.' });

  // find or create lahan for this komoditas
  let lahan = db.prepare('SELECT * FROM lahan WHERE petani_id = ? AND komoditas = ?').get(petani.id, komoditas || kategori);
  if (!lahan) {
    const lahanId = uid('lhn');
    db.prepare(`INSERT INTO lahan (id,petani_id,luas_ha,lokasi_gps,komoditas) VALUES (?,?,?,?,?)`)
      .run(lahanId, petani.id, luas_ha || 0.5, lokasi_gps || '-', komoditas || kategori);
    lahan = db.prepare('SELECT * FROM lahan WHERE id = ?').get(lahanId);
  }

  const produkId = uid('prd');
  const qrUrl = `https://jejaktani.id/trace/${produkId}`;
  const filePath = path.join(QR_DIR, `${produkId}.png`);
  await QRCode.toFile(filePath, qrUrl, { width: 400, margin: 1, color: { dark: '#115e59', light: '#ffffff' } });

  db.prepare(`INSERT INTO produk
    (id,lahan_id,nama,kategori,grade,jumlah_kg,jumlah_terjual_kg,harga_per_kg,tanggal_panen,qr_code,status,deskripsi,foto_emoji)
    VALUES (?,?,?,?,?,?,0,?,date('now'),?,?,?,?)`)
    .run(produkId, lahan.id, nama, kategori, grade, jumlah_kg, harga_per_kg, qrUrl, 'panen',
      deskripsi || '', foto_emoji || '\u{1F955}');

  db.prepare(`INSERT INTO traceability_log (id,produk_id,tahap,lokasi,catatan) VALUES (?,?,?,?,?)`)
    .run(uid('trc'), produkId, 'panen', lahan.lokasi_gps || petani.desa, 'Dicatat oleh petani melalui aplikasi Jejak Tani');

  const produk = db.prepare('SELECT * FROM produk WHERE id = ?').get(produkId);
  res.status(201).json(withPetaniInfo(produk));
});

import { sendWhatsApp } from '../utils/fonnte.js';

// ==========================================
// MENGUBAH STATUS PRODUK (PETANI / ADMIN)
// ==========================================
router.patch('/:id/status', requireAuth, requireRole('petani', 'admin'), async (req, res) => {
  try {
    const produkId = req.params.id;
    const { status, lokasi, catatan } = req.body;

    const validStatus = ['panen', 'grading', 'gudang', 'dipasarkan', 'habis'];
    if (!validStatus.includes(status)) {
      return res.status(400).json({ error: 'Status tidak valid.' });
    }

    const stmtProduk = db.prepare(`
      SELECT p.*, l.petani_id, l.lokasi_gps 
      FROM produk p
      JOIN lahan l ON p.lahan_id = l.id
      WHERE p.id = ?
    `);
    const produk = stmtProduk.get(produkId);

    if (!produk) {
      return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    }

    // Cek kepemilikan jika petani (Admin bebas update)
    if (req.user.role === 'petani') {
      const stmtCekOwner = db.prepare('SELECT id FROM petani WHERE user_id = ?');
      const petani = stmtCekOwner.get(req.user.id);
      if (!petani || produk.petani_id !== petani.id) {
        return res.status(403).json({ error: 'PERBAIKAN: Akses ditolak. Anda tidak memiliki akses ke produk ini.' });
      }
    }

    db.prepare('UPDATE produk SET status = ? WHERE id = ?').run(status, produkId);

    // Ambil data cuaca otomatis dari NASA POWER / Open-Meteo
    let suhu = null;
    let cuacaStr = null;
    let kondisi = null;
    
    if (produk.lokasi_gps) {
      const climateData = await fetchCurrentClimate(produk.lokasi_gps);
      suhu = climateData.suhu_celcius;
      cuacaStr = climateData.cuaca;
      kondisi = climateData.kondisi_cold_chain;
    }

    const logId = uid('log');
    db.prepare(`
      INSERT INTO traceability_log (id, produk_id, tahap, lokasi, catatan, suhu_celcius, cuaca, kondisi_cold_chain)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(logId, produkId, status, lokasi || null, catatan || null, suhu, cuacaStr, kondisi);

    // Kirim WhatsApp Notifikasi
    try {
      const stmtUser = db.prepare('SELECT u.no_hp, u.nama FROM users u JOIN petani p ON u.id = p.user_id WHERE p.id = ?');
      const user = stmtUser.get(produk.petani_id);
      if (user && user.no_hp) {
        let msg = `Halo ${user.nama},\n\nStatus pelacakan produk Anda *${produk.nama}* (ID: ${produkId}) telah diperbarui menjadi: *${status.toUpperCase()}*.\n\n`;
        if (suhu) msg += `Suhu saat ini: ${suhu}°C\nKondisi: ${kondisi}\n\n`;
        msg += `Cek pelacakan lengkap: https://jejaktani.id/trace/${produkId}\n\n- Sistem Jejak Tani`;
        
        // Asynchronous non-blocking
        sendWhatsApp(user.no_hp, msg).catch(e => console.error(e));
      }
    } catch (e) {
      console.error('Gagal memproses notifikasi WA:', e);
    }

    res.json({ message: 'Status produk berhasil diperbarui.', status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});


// POST /api/produk/ai-grading - Simulate computer vision grading
router.post('/ai-grading', requireAuth, requireRole('petani', 'admin'), (req, res) => {
  const { image_data, komoditas } = req.body;
  if (!image_data) return res.status(400).json({ error: 'Gambar produk (image_data) wajib diunggah untuk AI Grading.' });
  
  // Simulate CV Model Inference Delay
  const grades = ['A', 'B', 'C'];
  const probs = [0.6, 0.3, 0.1]; // 60% chance of A, 30% B, 10% C
  const rand = Math.random();
  
  let grade = 'C';
  if (rand <= probs[0]) grade = 'A';
  else if (rand <= probs[0] + probs[1]) grade = 'B';

  const skor = Math.floor(Math.random() * 20) + (grade === 'A' ? 80 : grade === 'B' ? 60 : 40);

  // Save to DB
  db.prepare(`
    INSERT INTO grading_ai (id, produk_id, user_id, foto_path, grade_hasil, confidence, analisis_warna, analisis_ukuran, analisis_cacat, reasoning)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(uid('gai'), null, req.user.id, 'dummy_path.jpg', grade, skor, 'Warna optimal', 'Ukuran seragam', 'Tidak ada cacat', 'Berdasarkan model CV v2.1');

  res.json({
    message: 'Grading selesai.',
    grade,
    skor_kualitas: skor,
    analisis: `Berdasarkan analisis visual, tekstur dan warna menunjukkan kualitas tingkat ${grade}.`
  });
});

export default router;
