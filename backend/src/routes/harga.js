import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// GET /api/harga - latest reference price per commodity
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT h.komoditas, h.harga_per_kg, h.tanggal, h.sumber
    FROM harga_referensi h
    INNER JOIN (
      SELECT komoditas, MAX(tanggal) AS max_tanggal
      FROM harga_referensi
      GROUP BY komoditas
    ) latest ON h.komoditas = latest.komoditas AND h.tanggal = latest.max_tanggal
    ORDER BY h.komoditas ASC
  `).all();
  res.json(rows);
});

router.get('/historis/:komoditas', (req, res) => {
  const rows = db.prepare(`SELECT * FROM harga_referensi WHERE komoditas = ? ORDER BY tanggal ASC`)
    .all(req.params.komoditas);
  res.json(rows);
});

router.get('/:komoditas', (req, res) => {
  const row = db.prepare(`SELECT * FROM harga_referensi WHERE komoditas = ? ORDER BY tanggal DESC LIMIT 1`)
    .get(req.params.komoditas);
  if (!row) return res.status(404).json({ error: 'Data harga referensi belum tersedia untuk komoditas ini.' });
  res.json(row);
});



export default router;
