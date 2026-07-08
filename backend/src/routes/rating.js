import { Router } from 'express';
import { db, uid } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/rating - submit a rating after an order is completed
router.post('/', requireAuth, (req, res) => {
  const { pesanan_id, untuk_user_id, skor, komentar } = req.body;
  if (!pesanan_id || !untuk_user_id || !skor) {
    return res.status(400).json({ error: 'Pesanan, penerima rating, dan skor wajib diisi.' });
  }
  if (skor < 1 || skor > 5) {
    return res.status(400).json({ error: 'Skor harus antara 1 dan 5.' });
  }

  const pesanan = db.prepare(`
    SELECT pesanan.*, produk.lahan_id FROM pesanan
    JOIN produk ON produk.id = pesanan.produk_id WHERE pesanan.id = ?`).get(pesanan_id);
  if (!pesanan) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
  if (pesanan.status !== 'selesai') {
    return res.status(400).json({ error: 'Rating hanya bisa diberikan untuk pesanan yang sudah selesai.' });
  }

  // PERBAIKAN INTEGRITAS TRUST SCORE -- sebelumnya endpoint ini bisa
  // dipanggil siapa saja dengan pesanan_id/untuk_user_id bebas, tanpa
  // verifikasi bahwa: (a) req.user memang buyer yang memesan pesanan itu,
  // (b) untuk_user_id memang petani pemilik produk di pesanan itu. Ini
  // serius karena Trust & Reputasi adalah salah satu dari enam modul inti
  // yang diklaim blueprint sebagai pembeda -- tanpa perbaikan ini, skor
  // trust bisa dimanipulasi bebas oleh siapa pun yang punya akun.
  const buyer = db.prepare('SELECT * FROM buyer WHERE id = ?').get(pesanan.buyer_id);
  const buyerUser = buyer ? db.prepare('SELECT user_id FROM users WHERE id = ?').get(buyer.user_id) : null;
  const lahan = db.prepare('SELECT petani_id FROM lahan WHERE id = ?').get(pesanan.lahan_id);
  const petani = lahan ? db.prepare('SELECT * FROM petani WHERE id = ?').get(lahan.petani_id) : null;
  const petaniUser = petani ? db.prepare('SELECT user_id FROM users WHERE id = ?').get(petani.user_id) : null;

  if (req.user.role === 'buyer') {
    if (!buyer || buyer.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Anda hanya bisa memberi rating untuk pesanan Anda sendiri.' });
    }
    if (!petaniUser || petaniUser.user_id !== untuk_user_id) {
      return res.status(400).json({ error: 'Penerima rating tidak sesuai.' });
    }
  } else if (req.user.role === 'petani') {
    if (!petani || petani.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Anda hanya bisa memberi rating untuk pesanan dari produk Anda.' });
    }
    if (!buyerUser || buyerUser.user_id !== untuk_user_id) {
      return res.status(400).json({ error: 'Penerima rating tidak sesuai.' });
    }
  } else {
    return res.status(403).json({ error: 'Role tidak diizinkan.' });
  }

  const existing = db.prepare('SELECT id FROM rating WHERE pesanan_id = ? AND dari_user_id = ?').get(pesanan_id, req.user.id);
  if (existing) {
    return res.status(409).json({ error: 'Anda sudah memberi rating untuk pesanan ini.' });
  }

  const id = uid('rtg');
  db.prepare(`INSERT INTO rating (id,pesanan_id,dari_user_id,untuk_user_id,skor,komentar) VALUES (?,?,?,?,?,?)`)
    .run(id, pesanan_id, req.user.id, untuk_user_id, skor, komentar || '');
  res.status(201).json(db.prepare('SELECT * FROM rating WHERE id = ?').get(id));
});

router.get('/user/:userId', (req, res) => {
  const rows = db.prepare(`
    SELECT rating.*, users.nama as dari_nama FROM rating
    JOIN users ON users.id = rating.dari_user_id
    WHERE untuk_user_id = ? ORDER BY created_at DESC`).all(req.params.userId);
  const agg = db.prepare(`SELECT AVG(skor) as rata_rata, COUNT(*) as jumlah FROM rating WHERE untuk_user_id = ?`).get(req.params.userId);
  res.json({ rata_rata: agg.rata_rata ? Math.round(agg.rata_rata * 10) / 10 : null, jumlah: agg.jumlah, ulasan: rows });
});

export default router;
