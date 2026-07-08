import { Router } from 'express';
import { db, uid } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, requireRole('buyer'), (req, res) => {
  const buyer = db.prepare('SELECT * FROM buyer WHERE user_id = ?').get(req.user.id);
  if (!buyer || buyer.tipe !== 'b2b') {
    return res.status(403).json({ error: 'Kontrak berulang hanya untuk akun buyer B2B.' });
  }
  const { komoditas, volume_rutin_kg, frekuensi, harga_terkunci_per_kg, termin_hari } = req.body;
  if (!komoditas || !volume_rutin_kg || !frekuensi || !harga_terkunci_per_kg) {
    return res.status(400).json({ error: 'Komoditas, volume, frekuensi, dan harga wajib diisi.' });
  }
  const id = uid('ktr');
  db.prepare(`INSERT INTO kontrak_b2b (id,buyer_id,komoditas,volume_rutin_kg,frekuensi,harga_terkunci_per_kg,termin_hari,status)
    VALUES (?,?,?,?,?,?,?,'aktif')`)
    .run(id, buyer.id, komoditas, volume_rutin_kg, frekuensi, harga_terkunci_per_kg, termin_hari || 14);
  res.status(201).json(db.prepare('SELECT * FROM kontrak_b2b WHERE id = ?').get(id));
});

router.get('/mine', requireAuth, requireRole('buyer'), (req, res) => {
  const buyer = db.prepare('SELECT * FROM buyer WHERE user_id = ?').get(req.user.id);
  if (!buyer) return res.json([]);
  res.json(db.prepare('SELECT * FROM kontrak_b2b WHERE buyer_id = ? ORDER BY tanggal_mulai DESC').all(buyer.id));
});

router.patch('/:id/status', requireAuth, requireRole('buyer', 'admin'), (req, res) => {
  const { status } = req.body;
  if (!['aktif', 'selesai', 'dibatalkan'].includes(status)) {
    return res.status(400).json({ error: 'Status tidak valid.' });
  }

  const kontrak = db.prepare('SELECT * FROM kontrak_b2b WHERE id = ?').get(req.params.id);
  if (!kontrak) return res.status(404).json({ error: 'Kontrak tidak ditemukan.' });

  // PERBAIKAN IDOR: sebelumnya buyer mana pun bisa ubah status kontrak
  // B2B milik buyer lain, asal tahu ID-nya -- tidak ada pengecekan
  // kepemilikan. Admin tetap bebas mengubah status kontrak siapa pun
  // (untuk keperluan moderasi/dukungan pelanggan).
  if (req.user.role === 'buyer') {
    const buyer = db.prepare('SELECT * FROM buyer WHERE user_id = ?').get(req.user.id);
    if (!buyer || kontrak.buyer_id !== buyer.id) {
      return res.status(404).json({ error: 'Kontrak tidak ditemukan.' });
    }
  }

  db.prepare('UPDATE kontrak_b2b SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json(db.prepare('SELECT * FROM kontrak_b2b WHERE id = ?').get(req.params.id));
});

export default router;
