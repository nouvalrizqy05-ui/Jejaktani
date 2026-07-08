import { Router } from 'express';
import { db, uid } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/cold-chain/:produkId
router.get('/:produkId', requireAuth, (req, res) => {
  const produk = db.prepare('SELECT id, nama, gudang_id FROM produk WHERE id = ?').get(req.params.produkId);
  if (!produk) return res.status(404).json({ error: 'Produk tidak ditemukan.' });

  const logs = db.prepare('SELECT * FROM cold_chain_log WHERE produk_id = ? ORDER BY waktu DESC LIMIT 50').all(produk.id);
  
  // Dummy prediction logic representing RandomForest ML from panen-cerdas
  const latestLog = logs.length > 0 ? logs[0] : null;
  let resiko = 'Rendah';
  let sisaHariExp = 30;
  
  if (latestLog) {
    if (latestLog.suhu_celcius > 10) resiko = 'Sedang';
    if (latestLog.suhu_celcius > 15) resiko = 'Tinggi';
  }

  res.json({
    produk,
    resiko,
    prediksi_sisa_umur_simpan_hari: sisaHariExp,
    logs
  });
});

// POST /api/cold-chain/sensor-webhook (Simulates incoming sensor data)
router.post('/sensor-webhook', (req, res) => {
  const { gudang_id, produk_id, suhu_celcius, kelembapan } = req.body;
  if (!suhu_celcius) return res.status(400).json({ error: 'Suhu wajib dikirim.' });

  let kondisi = 'normal';
  if (suhu_celcius > 8 && suhu_celcius <= 12) kondisi = 'peringatan';
  if (suhu_celcius > 12) kondisi = 'kritis';

  db.prepare(`
    INSERT INTO cold_chain_log (id, gudang_id, produk_id, suhu_celcius, kelembapan, kondisi, sumber)
    VALUES (?, ?, ?, ?, ?, ?, 'sensor')
  `).run(uid('ccl'), gudang_id, produk_id, suhu_celcius, kelembapan, kondisi);

  // If kritis, trigger alert mechanism (console log for now)
  if (kondisi === 'kritis') {
    console.warn(`[ALERT] Suhu kritis terdeteksi pada ${gudang_id || produk_id}: ${suhu_celcius}°C!`);
  }

  res.status(201).json({ message: 'Log tersimpan' });
});

export default router;
