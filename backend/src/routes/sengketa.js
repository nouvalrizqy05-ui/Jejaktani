import { Router } from 'express';
import { db, uid } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/sengketa/mine - lihat sengketa saya (buyer/petani)
router.get('/mine', requireAuth, (req, res) => {
  try {
    const sengketa = db.prepare(`
      SELECT s.*, p.status as pesanan_status, pr.nama as produk_nama 
      FROM sengketa s
      JOIN pesanan p ON s.pesanan_id = p.id
      JOIN produk pr ON p.produk_id = pr.id
      WHERE s.diajukan_oleh = ?
      ORDER BY s.created_at DESC
    `).all(req.user.id);
    res.json(sengketa);
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan.' });
  }
});

// GET /api/sengketa - semua sengketa (admin)
router.get('/', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const sengketa = db.prepare(`
      SELECT s.*, p.status as pesanan_status, pr.nama as produk_nama, u.nama as pelapor
      FROM sengketa s
      JOIN pesanan p ON s.pesanan_id = p.id
      JOIN produk pr ON p.produk_id = pr.id
      JOIN users u ON s.diajukan_oleh = u.id
      ORDER BY s.created_at DESC
    `).all();
    res.json(sengketa);
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan.' });
  }
});

// POST /api/sengketa - buat sengketa
router.post('/', requireAuth, (req, res) => {
  try {
    const { pesanan_id, alasan } = req.body;
    
    // Verifikasi kepemilikan pesanan (buyer atau petani yang bersangkutan)
    const pesanan = db.prepare('SELECT * FROM pesanan WHERE id = ?').get(pesanan_id);
    if (!pesanan) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });

    let isAuthorized = false;
    
    if (req.user.role === 'buyer') {
      const buyer = db.prepare('SELECT id FROM buyer WHERE user_id = ?').get(req.user.id);
      if (buyer && pesanan.buyer_id === buyer.id) isAuthorized = true;
    } else if (req.user.role === 'petani') {
      const produk = db.prepare('SELECT lahan_id FROM produk WHERE id = ?').get(pesanan.produk_id);
      const lahan = produk ? db.prepare('SELECT petani_id FROM lahan WHERE id = ?').get(produk.lahan_id) : null;
      const petani = lahan ? db.prepare('SELECT user_id FROM petani WHERE id = ?').get(lahan.petani_id) : null;
      if (petani && petani.user_id === req.user.id) isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Anda tidak diizinkan mengajukan sengketa untuk pesanan ini.' });
    }

    // Pastikan belum ada sengketa pending untuk pesanan ini oleh orang yang sama
    const existing = db.prepare('SELECT id FROM sengketa WHERE pesanan_id = ? AND diajukan_oleh = ?').get(pesanan_id, req.user.id);
    if (existing) {
      return res.status(400).json({ error: 'Anda sudah mengajukan sengketa untuk pesanan ini.' });
    }

    const id = uid('sgk');
    db.prepare(`
      INSERT INTO sengketa (id, pesanan_id, diajukan_oleh, alasan)
      VALUES (?, ?, ?, ?)
    `).run(id, pesanan_id, req.user.id, alasan);

    res.status(201).json({ message: 'Sengketa berhasil diajukan.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengajukan sengketa.' });
  }
});

// PATCH /api/sengketa/:id/resolusi - admin menyelesaikan sengketa
router.patch('/:id/resolusi', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const { resolusi, refund_dana } = req.body;
    
    db.prepare(`
      UPDATE sengketa 
      SET status = 'selesai', resolusi = ?, admin_id = ?, resolved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(resolusi, req.user.id, req.params.id);

    if (refund_dana) {
      const sengketa = db.prepare('SELECT pesanan_id FROM sengketa WHERE id = ?').get(req.params.id);
      if (sengketa) {
        db.prepare('UPDATE pesanan SET status = "dibatalkan" WHERE id = ?')
          .run(sengketa.pesanan_id);
      }
    }

    res.json({ message: 'Sengketa diselesaikan.' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memproses resolusi sengketa.' });
  }
});

export default router;
