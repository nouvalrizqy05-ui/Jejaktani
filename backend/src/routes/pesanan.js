import { Router } from 'express';
import { db, uid } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

function getBuyerForUser(userId) {
  return db.prepare('SELECT * FROM buyer WHERE user_id = ?').get(userId);
}

// POST /api/pesanan - buyer creates an order
router.post('/', requireAuth, requireRole('buyer'), (req, res) => {
  const { produk_id, jumlah_kg, tipe_pengiriman, catatan_alamat } = req.body;
  const buyer = getBuyerForUser(req.user.id);
  if (!buyer) return res.status(400).json({ error: 'Profil buyer tidak ditemukan.' });

  const produk = db.prepare('SELECT * FROM produk WHERE id = ?').get(produk_id);
  if (!produk) return res.status(404).json({ error: 'Produk tidak ditemukan.' });

  if (!jumlah_kg || jumlah_kg <= 0) return res.status(400).json({ error: 'Jumlah pesanan tidak valid.' });

  const hargaTotal = jumlah_kg * produk.harga_per_kg;
  const pesananId = uid('psn');

  // CATATAN AUDIT: handler ini sinkron (node:sqlite DatabaseSync, tanpa
  // await), sehingga di deployment SATU PROSES NODE, tidak ada celah
  // interleaving antar request -- berbeda dari kasus AgriLoop/Prisma yang
  // memang async. Kondisi WHERE di bawah tetap dipasang sebagai proteksi
  // defensif murah (bukan karena celah race condition sudah terbukti ada),
  // untuk berjaga-jaga kalau nanti pindah ke driver async atau dijalankan
  // multi-proses/cluster -- dua skenario yang MENGHILANGKAN jaminan
  // run-to-completion yang saat ini melindungi kode ini.
  db.exec('BEGIN TRANSACTION');
  try {
    const result = db
      .prepare(
        `UPDATE produk SET jumlah_terjual_kg = jumlah_terjual_kg + ?
         WHERE id = ? AND (jumlah_kg - jumlah_terjual_kg) >= ?`
      )
      .run(jumlah_kg, produk_id, jumlah_kg);

    if (result.changes === 0) {
      db.exec('ROLLBACK');
      return res.status(409).json({ error: `Stok tidak mencukupi. Sisa stok mungkin sudah berubah.` });
    }

    // FEFO stock deduction
    let sisaKurang = jumlah_kg;
    const stoks = db.prepare(`SELECT * FROM gudang_stok WHERE produk_id = ? ORDER BY tanggal_kadaluarsa ASC, tanggal_masuk ASC`).all(produk_id);
    
    if (stoks.length > 0) {
      for (const stk of stoks) {
        if (sisaKurang <= 0) break;
        const ambil = Math.min(sisaKurang, stk.jumlah_kg);
        db.prepare('UPDATE gudang_stok SET jumlah_kg = jumlah_kg - ? WHERE id = ?').run(ambil, stk.id);
        sisaKurang -= ambil;
      }
      db.prepare('DELETE FROM gudang_stok WHERE jumlah_kg <= 0').run();
    }

    db.prepare(`INSERT INTO pesanan (id,produk_id,buyer_id,jumlah_kg,harga_total,status,tipe_pengiriman,catatan_alamat)
      VALUES (?,?,?,?,?,?,?,?)`)
      .run(pesananId, produk_id, buyer.id, jumlah_kg, hargaTotal, 'menunggu_pembayaran',
        tipe_pengiriman || 'reguler', catatan_alamat || '');

    const pesanan = db.prepare('SELECT * FROM pesanan WHERE id = ?').get(pesananId);
    db.exec('COMMIT');
    res.status(201).json(pesanan);
  } catch(e) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: 'Gagal membuat pesanan.' });
  }
});

// PATCH /api/pesanan/:id/bayar - simulate payment confirmation (no real payment gateway)
router.patch('/:id/bayar', requireAuth, requireRole('buyer'), (req, res) => {
  const pesanan = db.prepare('SELECT * FROM pesanan WHERE id = ?').get(req.params.id);
  if (!pesanan) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });

  const buyer = getBuyerForUser(req.user.id);
  if (!buyer || pesanan.buyer_id !== buyer.id) {
    return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
  }
  db.prepare(`UPDATE pesanan SET status = 'dibayar' WHERE id = ?`).run(pesanan.id);

  const gudang = db.prepare('SELECT id FROM gudang LIMIT 1').get();
  const armada = db.prepare(`SELECT id FROM armada WHERE status = 'tersedia' LIMIT 1`).get();
  db.prepare(`INSERT INTO pengiriman (id,pesanan_id,gudang_id,armada_id,status,estimasi_tiba)
    VALUES (?,?,?,?,?,datetime('now','+1 day'))`)
    .run(uid('pgr'), pesanan.id, gudang?.id || null, armada?.id || null,
      pesanan.tipe_pengiriman === 'same_day' ? 'dalam_perjalanan' : 'menunggu');

  res.json(db.prepare('SELECT * FROM pesanan WHERE id = ?').get(pesanan.id));
});

// PATCH /api/pesanan/:id/status - admin/petani updates fulfilment status
router.patch('/:id/status', requireAuth, requireRole('admin', 'petani'), (req, res) => {
  const { status } = req.body;
  const valid = ['menunggu_pembayaran', 'dibayar', 'disiapkan', 'dikirim', 'selesai', 'dibatalkan'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Status tidak valid.' });

  const pesanan = db.prepare('SELECT * FROM pesanan WHERE id = ?').get(req.params.id);
  if (!pesanan) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });

  if (req.user.role === 'petani') {
    const produk = db.prepare('SELECT lahan_id FROM produk WHERE id = ?').get(pesanan.produk_id);
    const lahan = produk ? db.prepare('SELECT petani_id FROM lahan WHERE id = ?').get(produk.lahan_id) : null;
    const petani = lahan ? db.prepare('SELECT user_id FROM petani WHERE id = ?').get(lahan.petani_id) : null;
    if (!petani || petani.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    }
  }

  db.prepare('UPDATE pesanan SET status = ? WHERE id = ?').run(status, req.params.id);
  if (status === 'dikirim') {
    db.prepare(`UPDATE pengiriman SET status = 'dalam_perjalanan', updated_at = datetime('now') WHERE pesanan_id = ?`).run(req.params.id);
  }
  if (status === 'selesai') {
    db.prepare(`UPDATE pengiriman SET status = 'tiba', updated_at = datetime('now') WHERE pesanan_id = ?`).run(req.params.id);
  }
  res.json(db.prepare('SELECT * FROM pesanan WHERE id = ?').get(req.params.id));
});

// GET /api/pesanan/mine - buyer's order history
router.get('/mine', requireAuth, requireRole('buyer'), (req, res) => {
  const buyer = getBuyerForUser(req.user.id);
  if (!buyer) return res.json([]);
  const rows = db.prepare(`
    SELECT pesanan.*, produk.nama as produk_nama, produk.foto_emoji, produk.qr_code,
           users.id as petani_user_id, users.nama as petani_nama
    FROM pesanan
    JOIN produk ON produk.id = pesanan.produk_id
    JOIN lahan ON lahan.id = produk.lahan_id
    JOIN petani ON petani.id = lahan.petani_id
    JOIN users ON users.id = petani.user_id
    WHERE buyer_id = ? ORDER BY tanggal_pesan DESC`).all(buyer.id);
  res.json(rows);
});

// GET /api/pesanan/:id
router.get('/:id', requireAuth, (req, res) => {
  const pesanan = db.prepare(`
    SELECT pesanan.*, produk.nama as produk_nama, produk.foto_emoji, produk.qr_code, produk.lahan_id
    FROM pesanan JOIN produk ON produk.id = pesanan.produk_id WHERE pesanan.id = ?`).get(req.params.id);
  if (!pesanan) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });

  // PERBAIKAN IDOR: sebelumnya siapa pun yang login (asal tahu ID pesanan)
  // bisa melihat detail pesanan milik orang lain -- tidak ada verifikasi
  // kepemilikan sama sekali. Sekarang dibatasi ke tiga pihak yang sah:
  // buyer pemesan, petani pemilik produk yang dipesan, atau admin.
  if (req.user.role === 'buyer') {
    const buyer = getBuyerForUser(req.user.id);
    if (!buyer || pesanan.buyer_id !== buyer.id) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    }
  } else if (req.user.role === 'petani') {
    const lahan = db.prepare('SELECT petani_id FROM lahan WHERE id = ?').get(pesanan.lahan_id);
    const petani = lahan ? db.prepare('SELECT user_id FROM petani WHERE id = ?').get(lahan.petani_id) : null;
    if (!petani || petani.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    }
  } else if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Tidak memiliki akses.' });
  }

  const pengiriman = db.prepare('SELECT * FROM pengiriman WHERE pesanan_id = ?').get(pesanan.id);
  res.json({ ...pesanan, pengiriman });
});

export default router;
