import { Router } from 'express';
import { db, uid } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get('/overview', (req, res) => {
  const totalPetani = db.prepare('SELECT COUNT(*) as n FROM petani').get().n;
  const totalBuyer = db.prepare('SELECT COUNT(*) as n FROM buyer').get().n;
  const totalProduk = db.prepare('SELECT COUNT(*) as n FROM produk').get().n;
  const totalPesanan = db.prepare('SELECT COUNT(*) as n FROM pesanan').get().n;
  const gmv = db.prepare(`SELECT COALESCE(SUM(harga_total),0) as total FROM pesanan WHERE status != 'dibatalkan'`).get().total;
  const pesananPerStatus = db.prepare(`SELECT status, COUNT(*) as n FROM pesanan GROUP BY status`).all();
  const produkPerStatus = db.prepare(`SELECT status, COUNT(*) as n FROM produk GROUP BY status`).all();
  const trustRataRata = db.prepare(`SELECT AVG(skor) as avg_skor FROM rating`).get().avg_skor;

  res.json({
    totalPetani, totalBuyer, totalProduk, totalPesanan, gmv,
    pesananPerStatus, produkPerStatus,
    trustRataRata: trustRataRata ? Math.round(trustRataRata * 10) / 10 : null,
  });
});

router.get('/gudang', (req, res) => {
  res.json(db.prepare('SELECT * FROM gudang').all());
});

router.post('/gudang', (req, res) => {
  const { nama, lokasi, kapasitas_ton } = req.body;
  if (!nama || !lokasi || !kapasitas_ton) return res.status(400).json({ error: 'Nama, lokasi, dan kapasitas wajib diisi.' });
  const id = uid('gdg');
  db.prepare(`INSERT INTO gudang (id,nama,lokasi,kapasitas_ton,kapasitas_terpakai_ton) VALUES (?,?,?,?,0)`)
    .run(id, nama, lokasi, kapasitas_ton);
  res.status(201).json(db.prepare('SELECT * FROM gudang WHERE id = ?').get(id));
});

router.get('/armada', (req, res) => {
  res.json(db.prepare('SELECT * FROM armada').all());
});

router.post('/armada', (req, res) => {
  const { jenis_kendaraan, plat_nomor } = req.body;
  if (!jenis_kendaraan || !plat_nomor) return res.status(400).json({ error: 'Jenis kendaraan dan plat nomor wajib diisi.' });
  const id = uid('arm');
  db.prepare(`INSERT INTO armada (id,jenis_kendaraan,plat_nomor,status) VALUES (?,?,?,'tersedia')`)
    .run(id, jenis_kendaraan, plat_nomor);
  res.status(201).json(db.prepare('SELECT * FROM armada WHERE id = ?').get(id));
});

router.get('/pesanan', (req, res) => {
  const rows = db.prepare(`
    SELECT pesanan.*, produk.nama as produk_nama, buyer.nama_usaha, users.nama as buyer_nama
    FROM pesanan
    JOIN produk ON produk.id = pesanan.produk_id
    JOIN buyer ON buyer.id = pesanan.buyer_id
    JOIN users ON users.id = buyer.user_id
    ORDER BY tanggal_pesan DESC LIMIT 100
  `).all();
  res.json(rows);
});

router.get('/petani', (req, res) => {
  const rows = db.prepare(`
    SELECT 
      petani.id, 
      petani.desa, 
      petani.nik, 
      users.nama as user_nama, 
      users.no_hp, 
      petani.tanggal_daftar,
      IFNULL(SUM(lahan.luas_ha), 0) as total_lahan_ha,
      GROUP_CONCAT(DISTINCT lahan.komoditas) as komoditas_utama
    FROM petani 
    JOIN users ON users.id = petani.user_id
    LEFT JOIN lahan ON lahan.petani_id = petani.id
    GROUP BY petani.id
    ORDER BY petani.tanggal_daftar DESC
  `).all();
  res.json(rows);
});

export default router;
