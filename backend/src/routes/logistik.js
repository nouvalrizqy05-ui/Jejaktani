import { Router } from 'express';
import { db, uid } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/logistik/vendors - List available vendors
router.get('/vendors', (req, res) => {
  const vendors = db.prepare('SELECT * FROM logistik_vendor WHERE aktif = 1').all();
  if (vendors.length === 0) {
    // Return dummy if DB is empty for UI testing
    return res.json([
      { id: '1', nama: 'JNE Express', kode: 'jne', tipe: 'ekspedisi' },
      { id: '2', nama: 'J&T Express', kode: 'jnt', tipe: 'ekspedisi' },
      { id: '3', nama: 'SiCepat', kode: 'sicepat', tipe: 'ekspedisi' }
    ]);
  }
  res.json(vendors);
});

// POST /api/logistik/cek-ongkir - Mock check shipping cost (Simulating RajaOngkir)
router.post('/cek-ongkir', (req, res) => {
  const { asal_kota, tujuan_kota, berat_kg, kurir } = req.body;
  if (!asal_kota || !tujuan_kota || !berat_kg || !kurir) {
    return res.status(400).json({ error: 'Data tidak lengkap untuk cek ongkir.' });
  }

  // Simulate API delay and cost calculation
  const basePrice = 10000;
  const cost = basePrice * (Math.random() * 0.5 + 1) * Math.ceil(berat_kg);
  
  res.json({
    kurir,
    layanan: 'REG (Layanan Reguler)',
    estimasi_hari: '2-3 Hari',
    biaya: Math.round(cost / 1000) * 1000 // round to nearest thousand
  });
});

export default router;
