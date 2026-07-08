import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// GET /api/trace/:produkId - public, what a buyer sees after scanning the QR code
router.get('/:produkId', (req, res) => {
  const produk = db.prepare('SELECT * FROM produk WHERE id = ?').get(req.params.produkId);
  if (!produk) return res.status(404).json({ error: 'Produk tidak ditemukan.' });

  const lahan = db.prepare('SELECT * FROM lahan WHERE id = ?').get(produk.lahan_id);
  const petani = lahan ? db.prepare('SELECT * FROM petani WHERE id = ?').get(lahan.petani_id) : null;
  const user = petani ? db.prepare('SELECT nama FROM users WHERE id = ?').get(petani.user_id) : null;
  const log = db.prepare('SELECT id, tahap, lokasi, catatan, suhu_celcius, cuaca, kondisi_cold_chain, waktu FROM traceability_log WHERE produk_id = ? ORDER BY waktu ASC').all(produk.id);
  const trust = petani ? db.prepare(`SELECT AVG(skor) as avg_skor, COUNT(*) as jumlah FROM rating WHERE untuk_user_id = ?`).get(petani.user_id) : null;

  res.json({
    produk: {
      nama: produk.nama, kategori: produk.kategori, grade: produk.grade,
      tanggal_panen: produk.tanggal_panen, foto_emoji: produk.foto_emoji, deskripsi: produk.deskripsi,
    },
    petani: petani ? {
      nama: user ? user.nama : 'Petani Jejak Tani',
      desa: petani.desa,
      lahan_komoditas: lahan.komoditas,
      luas_ha: lahan.luas_ha,
      trust: trust ? { rata_rata: trust.avg_skor ? Math.round(trust.avg_skor * 10) / 10 : null, jumlah_ulasan: trust.jumlah } : null,
    } : null,
    perjalanan: log,
  });
});

export default router;
