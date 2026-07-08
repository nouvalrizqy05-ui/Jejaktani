import { Router } from 'express';
import { db, uid } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/preorder - List active preorders
router.get('/', (req, res) => {
  // Update expired statuses first
  db.exec(`UPDATE preorder SET status = 'kedaluwarsa' WHERE status = 'buka' AND datetime('now') > datetime(tanggal_tutup)`);
  
  const preorders = db.prepare(`
    SELECT p.*, pt.desa as petani_desa, u.nama as petani_nama 
    FROM preorder p
    JOIN petani pt ON p.petani_id = pt.id
    JOIN users u ON pt.user_id = u.id
    WHERE p.status = 'buka'
    ORDER BY p.tanggal_tutup ASC
  `).all();
  res.json(preorders);
});

// POST /api/preorder - Petani creates a new preorder
router.post('/', requireAuth, requireRole('petani'), (req, res) => {
  const { komoditas, deskripsi, harga_terkunci_per_kg, jumlah_min_kg, jumlah_maks_kg, tanggal_tutup, tanggal_panen_estimasi } = req.body;
  
  if (!komoditas || !harga_terkunci_per_kg || !tanggal_tutup || !tanggal_panen_estimasi) {
    return res.status(400).json({ error: 'Data preorder tidak lengkap.' });
  }

  const petani = db.prepare('SELECT id FROM petani WHERE user_id = ?').get(req.user.id);
  if (!petani) return res.status(403).json({ error: 'Akses ditolak.' });

  const preorderId = uid('pre');
  db.prepare(`
    INSERT INTO preorder (id, komoditas, deskripsi, harga_terkunci_per_kg, jumlah_min_kg, jumlah_maks_kg, tanggal_tutup, tanggal_panen_estimasi, petani_id, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(preorderId, komoditas, deskripsi || '', harga_terkunci_per_kg, jumlah_min_kg || 1, jumlah_maks_kg || 10000, tanggal_tutup, tanggal_panen_estimasi, petani.id, req.user.id);

  const newPreorder = db.prepare('SELECT * FROM preorder WHERE id = ?').get(preorderId);
  res.status(201).json(newPreorder);
});

// POST /api/preorder/:id/pesan - Buyer creates order for preorder
router.post('/:id/pesan', requireAuth, requireRole('buyer'), (req, res) => {
  const { jumlah_kg } = req.body;
  const preorder = db.prepare('SELECT * FROM preorder WHERE id = ?').get(req.params.id);
  
  if (!preorder) return res.status(404).json({ error: 'Preorder tidak ditemukan.' });
  if (preorder.status !== 'buka') return res.status(400).json({ error: 'Preorder sudah ditutup atau kedaluwarsa.' });
  if (jumlah_kg < preorder.jumlah_min_kg) return res.status(400).json({ error: `Minimal pemesanan ${preorder.jumlah_min_kg} kg.` });
  
  const sisaQuota = preorder.jumlah_maks_kg - preorder.jumlah_dipesan_kg;
  if (jumlah_kg > sisaQuota) return res.status(400).json({ error: `Kapasitas tersisa hanya ${sisaQuota} kg.` });

  const buyer = db.prepare('SELECT id FROM buyer WHERE user_id = ?').get(req.user.id);
  
  const preorderPesananId = uid('ppo');
  const hargaTotal = jumlah_kg * preorder.harga_terkunci_per_kg;

  db.exec('BEGIN TRANSACTION');
  try {
    db.prepare('INSERT INTO preorder_pesanan (id, preorder_id, buyer_id, jumlah_kg, harga_total) VALUES (?, ?, ?, ?, ?)')
      .run(preorderPesananId, preorder.id, buyer.id, jumlah_kg, hargaTotal);
      
    db.prepare('UPDATE preorder SET jumlah_dipesan_kg = jumlah_dipesan_kg + ? WHERE id = ?')
      .run(jumlah_kg, preorder.id);
      
    const checkQuota = db.prepare('SELECT jumlah_dipesan_kg, jumlah_maks_kg FROM preorder WHERE id = ?').get(preorder.id);
    if (checkQuota.jumlah_dipesan_kg >= checkQuota.jumlah_maks_kg) {
      db.prepare("UPDATE preorder SET status = 'terpenuhi' WHERE id = ?").run(preorder.id);
    }
    db.exec('COMMIT');
    res.status(201).json({ id: preorderPesananId, status: 'terkunci' });
  } catch(e) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: 'Gagal memproses preorder.' });
  }
});

export default router;
