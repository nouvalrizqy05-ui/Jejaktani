import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, uid } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QR_DIR = path.join(__dirname, '..', 'data', 'qrcodes');
if (!fs.existsSync(QR_DIR)) fs.mkdirSync(QR_DIR, { recursive: true });

function clearAll() {
  const tables = [
    'rating', 'pengiriman', 'pesanan', 'kontrak_b2b', 'traceability_log',
    'gudang_stok', 'produk', 'lahan', 'petani', 'buyer', 'gudang', 'armada',
    'harga_referensi', 'users'
  ];
  for (const t of tables) db.exec(`DELETE FROM ${t};`);
}

function hash(pw) {
  return bcrypt.hashSync(pw, 10);
}

async function makeQR(produkId) {
  const url = `https://jejaktani.id/trace/${produkId}`;
  const filePath = path.join(QR_DIR, `${produkId}.png`);
  await QRCode.toFile(filePath, url, { width: 400, margin: 1, color: { dark: '#115e59', light: '#ffffff' } });
  return url;
}

// ── Unsplash image helper ──
const IMG = (id, w = 400) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=${w}`;

async function seed() {
  clearAll();
  console.log('🌱 Seeding Jejak Tani marketplace data (50+ produk, gambar nyata)...');

  // ═══════════════════════════════════════════════════════
  // USERS & PETANI  (4 petani dari berbagai daerah Indonesia)
  // ═══════════════════════════════════════════════════════
  const petaniSeedData = [
    { nama: 'Pak Slamet Wiyono',   desa: 'Desa Sukamaju, Cianjur',     komoditas: 'Beras',         luas: 1.2, gps: '-6.8200 107.1400' },
    { nama: 'Bu Aminah Sari',      desa: 'Desa Tirtajaya, Garut',      komoditas: 'Cabai & Sayur', luas: 0.8, gps: '-7.2100 107.9000' },
    { nama: 'Pak Wayan Sudarma',   desa: 'Desa Baturiti, Tabanan',     komoditas: 'Kopi & Buah',   luas: 2.0, gps: '-8.3700 115.1600' },
    { nama: 'Bu Siti Nurjanah',    desa: 'Desa Pandanwangi, Subang',   komoditas: 'Ikan & Unggas', luas: 0.5, gps: '-6.5700 107.7600' },
  ];

  const petaniIds = [];
  for (let i = 0; i < petaniSeedData.length; i++) {
    const p = petaniSeedData[i];
    const userId = uid('usr');
    db.prepare(`INSERT INTO users (id,email,password_hash,role,nama,no_hp) VALUES (?,?,?,?,?,?)`)
      .run(userId, `petani${i + 1}@jejaktani.id`, hash('petani123'), 'petani', p.nama, `08${1000000000 + i}`);
    const petaniId = uid('tani');
    db.prepare(`INSERT INTO petani (id,user_id,nik,alamat,desa) VALUES (?,?,?,?,?)`)
      .run(petaniId, userId, `32010${1000000 + i}`, p.desa, p.desa);
    const lahanId = uid('lhn');
    db.prepare(`INSERT INTO lahan (id,petani_id,luas_ha,lokasi_gps,komoditas) VALUES (?,?,?,?,?)`)
      .run(lahanId, petaniId, p.luas, p.gps, p.komoditas);
    petaniIds.push({ petaniId, lahanId, userId, komoditas: p.komoditas, nama: p.nama, desa: p.desa });
  }

  // ═══════════════════════════════════════════════════════
  // GUDANG & ARMADA
  // ═══════════════════════════════════════════════════════
  const gudangCianjur = uid('gdg');
  const gudangTabanan = uid('gdg');
  const gudangSubang  = uid('gdg');
  db.prepare(`INSERT INTO gudang (id,nama,lokasi,lokasi_gps,kapasitas_ton,kapasitas_terpakai_ton,tipe,suhu_target) VALUES (?,?,?,?,?,?,?,?)`)
    .run(gudangCianjur, 'Gudang Agregasi Cianjur', 'Cianjur, Jawa Barat', '-6.8167, 107.1333', 50, 18.5, 'normal', null);
  db.prepare(`INSERT INTO gudang (id,nama,lokasi,lokasi_gps,kapasitas_ton,kapasitas_terpakai_ton,tipe,suhu_target) VALUES (?,?,?,?,?,?,?,?)`)
    .run(gudangTabanan, 'Gudang Cold Storage Tabanan', 'Tabanan, Bali', '-8.3694, 115.1628', 30, 9.2, 'cold_storage', 5.0);
  db.prepare(`INSERT INTO gudang (id,nama,lokasi,lokasi_gps,kapasitas_ton,kapasitas_terpakai_ton,tipe,suhu_target) VALUES (?,?,?,?,?,?,?,?)`)
    .run(gudangSubang, 'Gudang Agregasi Subang', 'Subang, Jawa Barat', '-6.5700, 107.7600', 40, 12.0, 'cold_storage', 4.0);

  const armadaIds = [];
  const armadaSeed = [
    ['Motor roda tiga', 'D 1234 ABC'],
    ['Truk engkel', 'D 5678 XYZ'],
    ['Truk box pendingin', 'DK 4321 QQ'],
    ['Pickup tertutup', 'T 9012 DEF'],
    ['Van pendingin', 'D 3456 GHI'],
  ];
  for (const [jenis, plat] of armadaSeed) {
    const id = uid('arm');
    db.prepare(`INSERT INTO armada (id,jenis_kendaraan,plat_nomor,status) VALUES (?,?,?,?)`)
      .run(id, jenis, plat, 'tersedia');
    armadaIds.push(id);
  }

  // ═══════════════════════════════════════════════════════
  // HARGA REFERENSI (PIHPS Bank Indonesia)
  // ═══════════════════════════════════════════════════════
  const hargaJsonPath = path.join(__dirname, '..', 'data', 'harga_pihps.json');
  if (fs.existsSync(hargaJsonPath)) {
    const hargaData = JSON.parse(fs.readFileSync(hargaJsonPath, 'utf-8'));
    console.log(`  📊 Memuat ${hargaData.length} data harga PIHPS (Bank Indonesia)...`);
    const insertHarga = db.prepare(
      `INSERT INTO harga_referensi (id,komoditas,harga_per_kg,tanggal,sumber) VALUES (?,?,?,?,?)`
    );
    db.exec('BEGIN TRANSACTION;');
    for (const h of hargaData) {
      insertHarga.run(uid('hrg'), h.komoditas, h.harga_per_kg, h.tanggal, h.sumber);
    }
    db.exec('COMMIT;');
    console.log('  ✅ Data harga PIHPS berhasil dimuat!');
  } else {
    console.warn('  ⚠️ File harga_pihps.json tidak ditemukan. Menggunakan data simulasi...');
    const hargaSeed = [
      ['Beras', 12500], ['Cabai Merah', 38000], ['Cabai Rawit', 45000],
      ['Bawang Merah', 42000], ['Bawang Putih', 38000], ['Daging Ayam', 35000],
      ['Daging Sapi', 130000], ['Telur Ayam', 28000], ['Minyak Goreng', 20000],
      ['Gula Pasir', 18000],
    ];
    for (const [komoditas, basePrice] of hargaSeed) {
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().slice(0, 10);
        const fluctuation = basePrice * (Math.random() * 0.1 - 0.05);
        const finalPrice = Math.round((basePrice + fluctuation) / 100) * 100;
        db.prepare(`INSERT INTO harga_referensi (id,komoditas,harga_per_kg,tanggal,sumber) VALUES (?,?,?,?,?)`)
          .run(uid('hrg'), komoditas, finalPrice, dateString, 'Panel Harga Pangan Nasional (simulasi)');
      }
    }
  }

  // ═══════════════════════════════════════════════════════
  // PRODUK MASSAL — 50+ item, gambar Unsplash, semua kategori
  // idx = petani index (0-3), distribusi merata
  // ═══════════════════════════════════════════════════════
  const today = new Date().toISOString().slice(0, 10);
  const gudangMap = [gudangCianjur, gudangCianjur, gudangTabanan, gudangSubang];

  const produkSeed = [
    // ── BERAS & SEMBAKO (Pak Slamet - idx 0) ──
    { idx: 0, nama: 'Beras Pandanwangi Premium',       kategori: 'Sembako',  grade: 'A', kg: 800, harga: 13500, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/20201102.Hengnan.Hybrid_rice_Sanyou-1.6.jpg/500px-20201102.Hengnan.Hybrid_rice_Sanyou-1.6.jpg', status: 'dipasarkan' },
    { idx: 0, nama: 'Beras Merah Organik',             kategori: 'Sembako',  grade: 'A', kg: 300, harga: 18000, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Reis_-_Sorte_C_voll.jpg/500px-Reis_-_Sorte_C_voll.jpg', status: 'dipasarkan' },
    { idx: 0, nama: 'Beras Hitam Cianjur',             kategori: 'Sembako',  grade: 'B', kg: 200, harga: 22000, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Black_Rice.jpg/500px-Black_Rice.jpg', status: 'dipasarkan' },
    { idx: 0, nama: 'Beras Ketan Putih',               kategori: 'Sembako',  grade: 'B', kg: 150, harga: 16000, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Chapssal_%28glutinous_rice%29.jpg/500px-Chapssal_%28glutinous_rice%29.jpg', status: 'dipasarkan' },
    { idx: 0, nama: 'Gula Aren Murni',                 kategori: 'Sembako',  grade: 'A', kg: 100, harga: 35000, img: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400&h=400&fit=crop', status: 'dipasarkan' },
    { idx: 0, nama: 'Minyak Kelapa Murni (VCO)',       kategori: 'Sembako',  grade: 'A', kg: 80,  harga: 65000, img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop', status: 'dipasarkan' },
    { idx: 0, nama: 'Tepung Beras',                    kategori: 'Sembako',  grade: 'B', kg: 250, harga: 9000,  img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=400&fit=crop', status: 'dipasarkan' },
    { idx: 0, nama: 'Gula Pasir Lokal',                kategori: 'Sembako',  grade: 'B', kg: 400, harga: 14500, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Sucre_blanc_cassonade_complet_rapadura.jpg/500px-Sucre_blanc_cassonade_complet_rapadura.jpg', status: 'dipasarkan' },

    // ── SAYUR & BUMBU (Bu Aminah - idx 1) ──
    { idx: 1, nama: 'Cabai Merah Keriting',            kategori: 'Sayur',    grade: 'A', kg: 200, harga: 42000, img: 'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=400&h=400&fit=crop', status: 'dipasarkan' },
    { idx: 1, nama: 'Cabai Rawit Domba',               kategori: 'Sayur',    grade: 'A', kg: 120, harga: 55000, img: 'https://images.unsplash.com/photo-1526346698789-22fd84314424?w=400&h=400&fit=crop', status: 'dipasarkan' },
    { idx: 1, nama: 'Bawang Merah Brebes',             kategori: 'Bumbu masak', grade: 'A', kg: 350, harga: 38000, img: 'https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?w=400&h=400&fit=crop', status: 'dipasarkan' },
    { idx: 1, nama: 'Bawang Putih Kating',             kategori: 'Bumbu masak', grade: 'B', kg: 300, harga: 32000, img: 'https://upload.wikimedia.org/wikipedia/commons/3/39/Allium_sativum_Woodwill_1793.jpg', status: 'dipasarkan' },
    { idx: 1, nama: 'Tomat Merah Segar',               kategori: 'Sayur',    grade: 'A', kg: 250, harga: 12000, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Tomato_je.jpg/500px-Tomato_je.jpg', status: 'dipasarkan' },
    { idx: 1, nama: 'Kentang Dieng Premium',           kategori: 'Sayur',    grade: 'A', kg: 400, harga: 15000, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Patates.jpg/500px-Patates.jpg', status: 'dipasarkan' },
    { idx: 1, nama: 'Wortel Segar Panen Pagi',         kategori: 'Sayur',    grade: 'A', kg: 180, harga: 11000, img: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&h=400&fit=crop', status: 'dipasarkan' },
    { idx: 1, nama: 'Brokoli Hijau Segar',             kategori: 'Sayur',    grade: 'A', kg: 100, harga: 25000, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Broccoli_and_cross_section_edit.jpg/500px-Broccoli_and_cross_section_edit.jpg', status: 'dipasarkan' },
    { idx: 1, nama: 'Kangkung Segar Petik',            kategori: 'Sayur',    grade: 'B', kg: 150, harga: 5000,  img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=400&fit=crop', status: 'dipasarkan' },
    { idx: 1, nama: 'Bayam Merah Organik',             kategori: 'Organik',  grade: 'A', kg: 120, harga: 8000,  img: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=400&fit=crop', status: 'dipasarkan' },
    { idx: 1, nama: 'Sawi Hijau Pakcoy',               kategori: 'Sayur',    grade: 'B', kg: 200, harga: 7000,  img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=400&fit=crop', status: 'dipasarkan' },
    { idx: 1, nama: 'Terong Ungu Segar',               kategori: 'Sayur',    grade: 'B', kg: 180, harga: 9000,  img: 'https://images.unsplash.com/photo-1613743983303-b3e89f8a2b80?w=400&h=400&fit=crop', status: 'dipasarkan' },
    { idx: 1, nama: 'Jahe Merah Emprit',               kategori: 'Bumbu masak', grade: 'A', kg: 100, harga: 28000, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Koeh-146-no_text.jpg/500px-Koeh-146-no_text.jpg', status: 'dipasarkan' },
    { idx: 1, nama: 'Kunyit Segar',                    kategori: 'Bumbu masak', grade: 'B', kg: 80,  harga: 18000, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Turmeric_inflorescence.jpg/500px-Turmeric_inflorescence.jpg', status: 'dipasarkan' },
    { idx: 1, nama: 'Lengkuas Segar',                  kategori: 'Bumbu masak', grade: 'B', kg: 90,  harga: 12000, img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop', status: 'dipasarkan' },
    { idx: 1, nama: 'Daun Bawang Segar',               kategori: 'Bumbu masak', grade: 'B', kg: 60,  harga: 15000, img: 'https://images.unsplash.com/photo-1591261730799-ee4e6c2d16d7?w=400&h=400&fit=crop', status: 'dipasarkan' },

    // ── BUAH & KOPI (Pak Wayan - idx 2) ──
    { idx: 2, nama: 'Kopi Arabika Kintamani',          kategori: 'Kopi',     grade: 'A', kg: 80,  harga: 105000, img: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=400&h=400&fit=crop', status: 'dipasarkan' },
    { idx: 2, nama: 'Kopi Robusta Bali',               kategori: 'Kopi',     grade: 'B', kg: 100, harga: 65000,  img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop', status: 'dipasarkan' },
    { idx: 2, nama: 'Mangga Harumanis',                kategori: 'Buah',     grade: 'A', kg: 300, harga: 18000,  img: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&h=400&fit=crop', status: 'dipasarkan' },
    { idx: 2, nama: 'Pisang Cavendish',                kategori: 'Buah',     grade: 'A', kg: 400, harga: 12000,  img: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop', status: 'dipasarkan' },
    { idx: 2, nama: 'Jeruk Bali Madu',                 kategori: 'Buah',     grade: 'A', kg: 250, harga: 15000,  img: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=400&h=400&fit=crop', status: 'dipasarkan' },
    { idx: 2, nama: 'Semangka Merah',                  kategori: 'Buah',     grade: 'B', kg: 500, harga: 7000,   img: 'https://images.unsplash.com/photo-1563114773-84221bd62daa?w=400&h=400&fit=crop', status: 'dipasarkan' },
    { idx: 2, nama: 'Pepaya California',               kategori: 'Buah',     grade: 'A', kg: 200, harga: 9000,   img: 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=400&h=400&fit=crop', status: 'dipasarkan' },
    { idx: 2, nama: 'Alpukat Mentega',                 kategori: 'Buah',     grade: 'A', kg: 150, harga: 22000,  img: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&h=400&fit=crop', status: 'dipasarkan' },
    { idx: 2, nama: 'Nanas Madu Subang',               kategori: 'Buah',     grade: 'B', kg: 300, harga: 8000,   img: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400&h=400&fit=crop', status: 'dipasarkan' },
    { idx: 2, nama: 'Salak Pondoh Sleman',             kategori: 'Buah',     grade: 'A', kg: 200, harga: 16000,  img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Salak_%28Salacca_zalacca%29%2C_2015-05-17.jpg/500px-Salak_%28Salacca_zalacca%29%2C_2015-05-17.jpg', status: 'dipasarkan' },
    { idx: 2, nama: 'Kelapa Muda Hijau',               kategori: 'Buah',     grade: 'B', kg: 250, harga: 6000,   img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Cocos_nucifera_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-187.jpg/500px-Cocos_nucifera_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-187.jpg', status: 'dipasarkan' },
    { idx: 2, nama: 'Durian Montong',                  kategori: 'Buah',     grade: 'A', kg: 100, harga: 55000,  img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Durian_in_black.jpg/500px-Durian_in_black.jpg', status: 'dipasarkan' },
    { idx: 2, nama: 'Strawberry Lembang',              kategori: 'Buah',     grade: 'A', kg: 50,  harga: 45000,  img: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&h=400&fit=crop', status: 'dipasarkan' },
    { idx: 2, nama: 'Melon Golden',                    kategori: 'Buah',     grade: 'A', kg: 200, harga: 18000,  img: 'https://picsum.photos/seed/Melon%20Golden/400/400', status: 'dipasarkan' },

    // ── TELUR, UNGGAS, IKAN, DAGING (Bu Siti - idx 3) ──
    { idx: 3, nama: 'Telur Ayam Kampung',              kategori: 'Telur & Unggas', grade: 'A', kg: 200, harga: 32000, img: 'https://images.unsplash.com/photo-1498654077810-12c21d4d6dc3?w=400&h=400&fit=crop', status: 'dipasarkan' },
    { idx: 3, nama: 'Telur Bebek Asin',                kategori: 'Telur & Unggas', grade: 'B', kg: 100, harga: 28000, img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop', status: 'dipasarkan' },
    { idx: 3, nama: 'Ayam Kampung Segar',              kategori: 'Telur & Unggas', grade: 'A', kg: 150, harga: 45000, img: 'https://images.unsplash.com/photo-1501200291289-c5a76c232e5f?w=400&h=400&fit=crop', status: 'dipasarkan' },
    { idx: 3, nama: 'Daging Ayam Broiler',             kategori: 'Daging',   grade: 'B', kg: 300, harga: 35000,  img: 'https://picsum.photos/seed/Daging%20Ayam%20Broiler/400/400', status: 'dipasarkan' },
    { idx: 3, nama: 'Daging Sapi Has Dalam',           kategori: 'Daging',   grade: 'A', kg: 80,  harga: 135000, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Standing-rib-roast.jpg/500px-Standing-rib-roast.jpg', status: 'dipasarkan' },
    { idx: 3, nama: 'Daging Sapi Rendang',             kategori: 'Daging',   grade: 'B', kg: 120, harga: 120000, img: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&h=400&fit=crop', status: 'dipasarkan' },
    { idx: 3, nama: 'Ikan Lele Segar',                 kategori: 'Ikan',     grade: 'A', kg: 250, harga: 22000,  img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop', status: 'dipasarkan' },
    { idx: 3, nama: 'Ikan Nila Segar',                 kategori: 'Ikan',     grade: 'A', kg: 200, harga: 28000,  img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Til%C3%A1pia_ou_Sarotherodon_niloticus_2.jpg/500px-Til%C3%A1pia_ou_Sarotherodon_niloticus_2.jpg', status: 'dipasarkan' },
    { idx: 3, nama: 'Ikan Gurame Hidup',               kategori: 'Ikan',     grade: 'A', kg: 100, harga: 42000,  img: 'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=400&h=400&fit=crop', status: 'dipasarkan' },
    { idx: 3, nama: 'Udang Vaname Segar',              kategori: 'Ikan',     grade: 'A', kg: 80,  harga: 68000,  img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Litopenaeus_vannamei_specimen.jpg/500px-Litopenaeus_vannamei_specimen.jpg', status: 'dipasarkan' },
    { idx: 3, nama: 'Ikan Bandeng Presto',             kategori: 'Ikan',     grade: 'B', kg: 150, harga: 32000,  img: 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=400&h=400&fit=crop', status: 'dipasarkan' },
    { idx: 3, nama: 'Ikan Tongkol Segar',              kategori: 'Ikan',     grade: 'B', kg: 180, harga: 25000,  img: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=400&fit=crop', status: 'dipasarkan' },
    { idx: 3, nama: 'Bebek Peking Utuh',               kategori: 'Daging',   grade: 'A', kg: 60,  harga: 55000,  img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop', status: 'dipasarkan' },
    { idx: 3, nama: 'Telur Puyuh Segar',               kategori: 'Telur & Unggas', grade: 'B', kg: 80, harga: 35000, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Potato_galettes_with_quail_eggs.jpg/500px-Potato_galettes_with_quail_eggs.jpg', status: 'dipasarkan' },
  ];

  console.log(`  🛒 Memasukkan ${produkSeed.length} produk dengan gambar nyata...`);

  const produkIds = [];
  const insertProduk = db.prepare(`INSERT INTO produk
    (id,lahan_id,nama,kategori,grade,jumlah_kg,jumlah_terjual_kg,harga_per_kg,tanggal_panen,qr_code,status,deskripsi,foto_emoji,batch_no,tanggal_masuk_gudang,tanggal_kadaluarsa,gudang_id)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const insertStok = db.prepare(`INSERT INTO gudang_stok (id,gudang_id,produk_id,jumlah_kg,batch_no,tanggal_masuk,tanggal_kadaluarsa) VALUES (?,?,?,?,?,?,?)`);
  const insertTrace = db.prepare(`INSERT INTO traceability_log (id,produk_id,tahap,lokasi,catatan,suhu_celcius,cuaca,kondisi_cold_chain) VALUES (?,?,?,?,?,?,?,?)`);

  db.exec('BEGIN TRANSACTION;');

  for (const p of produkSeed) {
    const petani = petaniIds[p.idx];
    const produkId = uid('prd');
    const qrUrl = await makeQR(produkId);
    const batchNo = `BCH-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const shelfDays = p.kategori === 'Sembako' || p.kategori === 'Kopi' ? 180 : p.kategori === 'Buah' ? 14 : p.kategori === 'Bumbu masak' ? 30 : 7;
    const tglKadaluarsa = new Date(Date.now() + shelfDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const gudangId = gudangMap[p.idx];
    const sold = Math.round(p.kg * (0.15 + Math.random() * 0.35));

    // Deskripsi otomatis berdasarkan kategori
    const descs = [
      `Hasil panen langsung dari ${petani.nama}, ${petani.desa}. Kualitas terjamin grade ${p.grade} dengan sistem traceability penuh dari ladang ke meja makan.`,
      `Produk segar pilihan dari mitra petani ${petani.nama}. Dipanen dan dikirim dengan standar kebersihan tinggi untuk menjaga kesegaran optimal.`,
      `Dukung petani lokal! ${p.nama} langsung dari ${petani.desa}, tanpa melalui tengkulak. Harga transparan, kualitas terjaga.`,
    ];
    const desc = descs[Math.floor(Math.random() * descs.length)];

    insertProduk.run(
      produkId, petani.lahanId, p.nama, p.kategori, p.grade,
      p.kg, sold, p.harga, today, qrUrl, p.status, desc,
      p.img, batchNo, today, tglKadaluarsa, gudangId
    );

    insertStok.run(uid('gst'), gudangId, produkId, p.kg - sold, batchNo, today, tglKadaluarsa);

    // Traceability log
    const coldTemp = p.kategori === 'Ikan' || p.kategori === 'Daging' || p.kategori === 'Telur & Unggas' ? 2.5 : p.kategori === 'Buah' || p.kategori === 'Sayur' ? 8.0 : null;
    const stages = [
      ['panen',       petani.desa,            `Dipanen oleh ${petani.nama} dan dicatat di sistem`,            28.5, 'Cerah, 28°C',           'Optimal — Suhu lingkungan normal'],
      ['grading',     petani.desa,            `Lolos grading kualitas ${p.grade} oleh petugas lapangan`,      26.2, 'Berawan, 26°C',          'Optimal — Suhu terjaga'],
      ['gudang',      gudangId === gudangTabanan ? 'Gudang Cold Storage Tabanan' : gudangId === gudangSubang ? 'Gudang Agregasi Subang' : 'Gudang Agregasi Cianjur',
                                                'Diterima dan disimpan di gudang agregasi',                   coldTemp || 22,   coldTemp ? 'Gudang Berpendingin' : 'Gudang Normal',  coldTemp ? `Optimal — Cold storage aktif ${coldTemp}°C` : 'Optimal — Suhu ruang terjaga'],
      ['dipasarkan',  'Marketplace Jejak Tani', 'Produk tayang di marketplace untuk konsumen',                coldTemp || 22,   coldTemp ? 'Kontainer Pendingin' : 'Ruang Display', coldTemp ? `Optimal — Rantai dingin terjaga ${coldTemp}°C` : 'Optimal — Suhu display terjaga'],
    ];
    for (const [tahap, lokasi, catatan, suhu, cuaca, kondisi] of stages) {
      insertTrace.run(uid('trc'), produkId, tahap, lokasi, catatan, suhu, cuaca, kondisi);
    }
    produkIds.push(produkId);
  }

  db.exec('COMMIT;');
  console.log(`  ✅ ${produkSeed.length} produk berhasil dimasukkan!`);

  // ═══════════════════════════════════════════════════════
  // BUYERS (tetap 1 B2C + 1 B2B)
  // ═══════════════════════════════════════════════════════
  const buyerUserB2C = uid('usr');
  db.prepare(`INSERT INTO users (id,email,password_hash,role,nama,no_hp) VALUES (?,?,?,?,?,?)`)
    .run(buyerUserB2C, 'buyer.rumahtangga@jejaktani.id', hash('buyer123'), 'buyer', 'Rina Marlina', '081234567890');
  const buyerB2C = uid('byr');
  db.prepare(`INSERT INTO buyer (id,user_id,tipe,nama_usaha,alamat) VALUES (?,?,?,?,?)`)
    .run(buyerB2C, buyerUserB2C, 'b2c', null, 'Jl. Merdeka No. 10, Bandung');

  const buyerUserB2B = uid('usr');
  db.prepare(`INSERT INTO users (id,email,password_hash,role,nama,no_hp) VALUES (?,?,?,?,?,?)`)
    .run(buyerUserB2B, 'buyer.resto@jejaktani.id', hash('buyer123'), 'buyer', 'Chef Andika (Warung Nusantara)', '081298765432');
  const buyerB2B = uid('byr');
  db.prepare(`INSERT INTO buyer (id,user_id,tipe,nama_usaha,npwp,alamat) VALUES (?,?,?,?,?,?)`)
    .run(buyerB2B, buyerUserB2B, 'b2b', 'Restoran Warung Nusantara', '01.234.567.8-901.000', 'Jl. Braga No. 5, Bandung');

  // ═══════════════════════════════════════════════════════
  // ADMIN (tetap 1)
  // ═══════════════════════════════════════════════════════
  const adminId = uid('usr');
  db.prepare(`INSERT INTO users (id,email,password_hash,role,nama) VALUES (?,?,?,?,?)`)
    .run(adminId, 'admin@jejaktani.id', hash('admin123'), 'admin', 'Admin Operasional');

  // ═══════════════════════════════════════════════════════
  // CONTOH KONTRAK B2B
  // ═══════════════════════════════════════════════════════
  db.prepare(`INSERT INTO kontrak_b2b (id,buyer_id,komoditas,volume_rutin_kg,frekuensi,harga_terkunci_per_kg,termin_hari,status)
    VALUES (?,?,?,?,?,?,?,?)`)
    .run(uid('ktr'), buyerB2B, 'Beras', 100, 'mingguan', 13000, 14, 'aktif');
  db.prepare(`INSERT INTO kontrak_b2b (id,buyer_id,komoditas,volume_rutin_kg,frekuensi,harga_terkunci_per_kg,termin_hari,status)
    VALUES (?,?,?,?,?,?,?,?)`)
    .run(uid('ktr'), buyerB2B, 'Daging Ayam', 50, 'mingguan', 34000, 7, 'aktif');

  // ═══════════════════════════════════════════════════════
  // CONTOH PESANAN + RATING (beberapa pesanan untuk kesan ramai)
  // ═══════════════════════════════════════════════════════
  const orderSamples = [
    { prodIdx: 0, qty: 5,  rating: 5, komentar: 'Berasnya wangi dan pulen, pengiriman cepat! Sesuai yang ada di jejak QR.' },
    { prodIdx: 8, qty: 2,  rating: 4, komentar: 'Cabai segar dan merah merata. Akan pesan lagi.' },
    { prodIdx: 26, qty: 3, rating: 5, komentar: 'Mangga manis sekali, matang sempurna. Recommended!' },
    { prodIdx: 38, qty: 1, rating: 5, komentar: 'Telur kampung kuningnya pekat, jelas beda dengan telur biasa.' },
    { prodIdx: 24, qty: 2, rating: 4, komentar: 'Kopi arabika Kintamani aroma luar biasa. Worth the price!' },
  ];

  for (const order of orderSamples) {
    if (!produkIds[order.prodIdx]) continue;
    const pesananId = uid('psn');
    const produk = produkSeed[order.prodIdx];
    db.prepare(`INSERT INTO pesanan (id,produk_id,buyer_id,jumlah_kg,harga_total,status,tipe_pengiriman,tanggal_pesan)
      VALUES (?,?,?,?,?,?,?,datetime('now','-${Math.floor(Math.random() * 10) + 1} day'))`)
      .run(pesananId, produkIds[order.prodIdx], buyerB2C, order.qty, order.qty * produk.harga, 'selesai', 'reguler');
    db.prepare(`INSERT INTO pengiriman (id,pesanan_id,gudang_id,armada_id,status,estimasi_tiba)
      VALUES (?,?,?,?,?,datetime('now','-${Math.floor(Math.random() * 5) + 1} day'))`)
      .run(uid('pgr'), pesananId, gudangMap[produk.idx], armadaIds[Math.floor(Math.random() * armadaIds.length)], 'tiba');
    db.prepare(`INSERT INTO rating (id,pesanan_id,dari_user_id,untuk_user_id,skor,komentar) VALUES (?,?,?,?,?,?)`)
      .run(uid('rtg'), pesananId, buyerUserB2C, petaniIds[produk.idx].userId, order.rating, order.komentar);
  }

  console.log('\n🎉 Seed selesai! Marketplace Jejak Tani siap dengan 50+ produk.');
  console.log('─────────────────────────────────────────');
  console.log('Login demo:');
  console.log('  Petani  : petani1@jejaktani.id / petani123 (lihat juga petani2-4)');
  console.log('  Buyer B2C: buyer.rumahtangga@jejaktani.id / buyer123');
  console.log('  Buyer B2B: buyer.resto@jejaktani.id / buyer123');
  console.log('  Admin   : admin@jejaktani.id / admin123');
  console.log('─────────────────────────────────────────');
}

seed().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
