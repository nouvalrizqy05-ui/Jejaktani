import { Router } from 'express';
import { db, uid } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/sertifikasi/produk/:produkId - Dapatkan sertifikasi untuk sebuah produk (Public)
router.get('/produk/:produkId', (req, res) => {
  try {
    const sertifikasi = db.prepare('SELECT * FROM sertifikasi_produk WHERE produk_id = ? AND status = \'terverifikasi\'').all(req.params.produkId);
    res.json(sertifikasi);
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan.' });
  }
});

// GET /api/sertifikasi/pending - Dapatkan semua sertifikasi yang butuh verifikasi (Admin)
router.get('/pending', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const sertifikasi = db.prepare(`
      SELECT s.*, p.nama as produk_nama, p.grade 
      FROM sertifikasi_produk s
      JOIN produk p ON s.produk_id = p.id
      WHERE s.status = 'pending'
    `).all();
    res.json(sertifikasi);
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan.' });
  }
});

// POST /api/sertifikasi - Tambah klaim sertifikasi (Petani)
router.post('/', requireAuth, requireRole('petani'), (req, res) => {
  try {
    const { produk_id, jenis, nomor_sertifikat, penerbit, tanggal_terbit, tanggal_kadaluarsa } = req.body;
    
    // Cek kepemilikan produk
    const produk = db.prepare(`
      SELECT p.*, l.petani_id 
      FROM produk p
      JOIN lahan l ON p.lahan_id = l.id
      WHERE p.id = ?
    `).get(produk_id);
    
    if (!produk) return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    
    const petani = db.prepare('SELECT id FROM petani WHERE user_id = ?').get(req.user.id);
    if (!petani || produk.petani_id !== petani.id) {
      return res.status(403).json({ error: 'Akses ditolak.' });
    }

    const id = uid('srt');
    db.prepare(`
      INSERT INTO sertifikasi_produk (id, produk_id, jenis, nomor_sertifikat, penerbit, tanggal_terbit, tanggal_kadaluarsa)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, produk_id, jenis, nomor_sertifikat, penerbit, tanggal_terbit, tanggal_kadaluarsa);

    res.status(201).json({ message: 'Sertifikasi berhasil diajukan dan menunggu verifikasi.', id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal menambah sertifikasi.' });
  }
});

// PATCH /api/sertifikasi/:id/verifikasi - Verifikasi klaim sertifikasi (Admin)
router.patch('/:id/verifikasi', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const { status } = req.body; // 'terverifikasi' atau 'ditolak'
    if (!['terverifikasi', 'ditolak'].includes(status)) {
      return res.status(400).json({ error: 'Status tidak valid' });
    }

    const info = db.prepare('UPDATE sertifikasi_produk SET status = ?, diverifikasi_oleh = ? WHERE id = ?').run(status, req.user.id, req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Sertifikasi tidak ditemukan' });

    res.json({ message: `Sertifikasi berhasil diupdate menjadi ${status}` });
  } catch (error) {
    res.status(500).json({ error: 'Gagal memverifikasi sertifikasi.' });
  }
});

export default router;
