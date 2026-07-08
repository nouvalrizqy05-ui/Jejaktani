import { Router } from 'express';
import { db, uid } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/gudang-stok - List stock across all warehouses
router.get('/', requireAuth, requireRole('admin'), (req, res) => {
  const stok = db.prepare(`
    SELECT gs.*, g.nama as gudang_nama, p.nama as produk_nama, p.grade, p.kategori
    FROM gudang_stok gs
    JOIN gudang g ON gs.gudang_id = g.id
    JOIN produk p ON gs.produk_id = p.id
    ORDER BY g.nama, gs.tanggal_masuk ASC
  `).all();
  res.json(stok);
});

// POST /api/gudang-stok/transfer - Transfer stock between warehouses
router.post('/transfer', requireAuth, requireRole('admin'), (req, res) => {
  const { stok_id, gudang_tujuan_id, jumlah_transfer_kg } = req.body;
  
  if (!stok_id || !gudang_tujuan_id || !jumlah_transfer_kg || jumlah_transfer_kg <= 0) {
    return res.status(400).json({ error: 'Data transfer tidak lengkap/valid.' });
  }

  const asal = db.prepare('SELECT * FROM gudang_stok WHERE id = ?').get(stok_id);
  if (!asal) return res.status(404).json({ error: 'Stok tidak ditemukan.' });
  if (asal.gudang_id === gudang_tujuan_id) return res.status(400).json({ error: 'Gudang tujuan sama dengan gudang asal.' });
  if (asal.jumlah_kg < jumlah_transfer_kg) return res.status(400).json({ error: 'Stok tidak mencukupi untuk transfer.' });

  const gudangTujuan = db.prepare('SELECT id FROM gudang WHERE id = ?').get(gudang_tujuan_id);
  if (!gudangTujuan) return res.status(404).json({ error: 'Gudang tujuan tidak valid.' });

  db.exec('BEGIN TRANSACTION');
  try {
    // Kurangi stok dari asal
    db.prepare('UPDATE gudang_stok SET jumlah_kg = jumlah_kg - ?, updated_at = datetime("now") WHERE id = ?')
      .run(jumlah_transfer_kg, stok_id);

    // Hapus row jika stok habis
    db.prepare('DELETE FROM gudang_stok WHERE jumlah_kg <= 0').run();

    // Tambah ke tujuan (upsert)
    const stokTujuan = db.prepare('SELECT id FROM gudang_stok WHERE gudang_id = ? AND produk_id = ? AND batch_no = ?')
      .get(gudang_tujuan_id, asal.produk_id, asal.batch_no);

    if (stokTujuan) {
      db.prepare('UPDATE gudang_stok SET jumlah_kg = jumlah_kg + ?, updated_at = datetime("now") WHERE id = ?')
        .run(jumlah_transfer_kg, stokTujuan.id);
    } else {
      db.prepare(`
        INSERT INTO gudang_stok (id, gudang_id, produk_id, jumlah_kg, batch_no, tanggal_masuk, tanggal_kadaluarsa)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(uid('gst'), gudang_tujuan_id, asal.produk_id, jumlah_transfer_kg, asal.batch_no, asal.tanggal_masuk, asal.tanggal_kadaluarsa);
    }

    db.exec('COMMIT');
    res.json({ message: 'Transfer stok berhasil.' });
  } catch(e) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: 'Gagal memproses transfer stok.' });
  }
});

export default router;
