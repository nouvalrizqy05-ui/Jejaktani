import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/petani/dashboard - summary for the logged-in petani
router.get('/dashboard', requireAuth, requireRole('petani'), (req, res) => {
  const petani = db.prepare('SELECT * FROM petani WHERE user_id = ?').get(req.user.id);
  if (!petani) return res.status(404).json({ error: 'Profil petani tidak ditemukan.' });

  const lahanIds = db.prepare('SELECT id FROM lahan WHERE petani_id = ?').all(petani.id).map(l => l.id);
  let produkList = [];
  let totalTerjualKg = 0;
  let totalPendapatan = 0;
  let pesananSelesai = [];
  if (lahanIds.length > 0) {
    const placeholders = lahanIds.map(() => '?').join(',');
    produkList = db.prepare(`SELECT * FROM produk WHERE lahan_id IN (${placeholders}) ORDER BY created_at DESC`).all(...lahanIds);
    for (const p of produkList) {
      totalTerjualKg += p.jumlah_terjual_kg;
      totalPendapatan += p.jumlah_terjual_kg * p.harga_per_kg;
    }
    
    // Get completed orders for rating
    const produkIds = produkList.map(p => p.id);
    if (produkIds.length > 0) {
      const pPlaceholders = produkIds.map(() => '?').join(',');
      pesananSelesai = db.prepare(`
        SELECT p.*, pr.nama as produk_nama, u.nama as buyer_nama, b.user_id as buyer_user_id
        FROM pesanan p
        JOIN produk pr ON p.produk_id = pr.id
        JOIN buyer b ON p.buyer_id = b.id
        JOIN users u ON b.user_id = u.id
        WHERE p.produk_id IN (${pPlaceholders}) AND p.status = 'selesai'
        ORDER BY p.updated_at DESC
      `).all(...produkIds);
    }
  }
  const trust = db.prepare(`SELECT AVG(skor) as avg_skor, COUNT(*) as jumlah FROM rating WHERE untuk_user_id = ?`).get(req.user.id);

  res.json({
    petani,
    ringkasan: {
      jumlah_produk_aktif: produkList.filter(p => p.status !== 'habis').length,
      total_terjual_kg: totalTerjualKg,
      total_pendapatan: totalPendapatan,
      trust: { rata_rata: trust.avg_skor ? Math.round(trust.avg_skor * 10) / 10 : null, jumlah_ulasan: trust.jumlah },
    },
    produk: produkList,
    pesanan_selesai: pesananSelesai,
  });
});

// GET /api/petani/:id - public profile (for buyers browsing marketplace)
router.get('/:id', (req, res) => {
  const petani = db.prepare('SELECT * FROM petani WHERE id = ?').get(req.params.id);
  if (!petani) return res.status(404).json({ error: 'Petani tidak ditemukan.' });
  const user = db.prepare('SELECT nama FROM users WHERE id = ?').get(petani.user_id);
  const lahan = db.prepare('SELECT * FROM lahan WHERE petani_id = ?').all(petani.id);
  const trust = db.prepare(`SELECT AVG(skor) as avg_skor, COUNT(*) as jumlah FROM rating WHERE untuk_user_id = ?`).get(petani.user_id);
  res.json({
    nama: user?.nama, desa: petani.desa, lahan,
    trust: { rata_rata: trust.avg_skor ? Math.round(trust.avg_skor * 10) / 10 : null, jumlah_ulasan: trust.jumlah },
  });
});

export default router;
