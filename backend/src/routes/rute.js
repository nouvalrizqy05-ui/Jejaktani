import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// OSRM Public API URL
const OSRM_URL = 'http://router.project-osrm.org/route/v1/driving';

async function hitungJarakOsrm(lat1, lon1, lat2, lon2) {
  try {
    // OSRM expects: {longitude},{latitude};{longitude},{latitude}
    const res = await fetch(`${OSRM_URL}/${lon1},${lat1};${lon2},${lat2}?overview=false`);
    const data = await res.json();
    if (data.code === 'Ok' && data.routes.length > 0) {
      return data.routes[0].distance / 1000; // meters to km
    }
  } catch (err) {
    console.warn('OSRM error, fallback to 0', err);
  }
  return 0;
}

// GET /api/rute/optimasi - Mengoptimalkan rute armada untuk pengiriman yang menunggu
router.get('/optimasi', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    // Ambil pengiriman yang statusnya menunggu atau dikirim
    const pengiriman = db.prepare(`
      SELECT pg.*, p.jumlah_kg, p.catatan_alamat, 
             pr.nama as produk_nama, 
             l.lokasi_gps as lahan_gps
      FROM pengiriman pg
      JOIN pesanan p ON pg.pesanan_id = p.id
      JOIN produk pr ON p.produk_id = pr.id
      JOIN lahan l ON pr.lahan_id = l.id
      WHERE pg.status = 'menunggu' OR pg.status = 'dikirim'
    `).all();

    // Default gudang pusat (misal Jakarta jika kosong, atau ambil dari gudang_id 1)
    const gudangPusat = { lat: -6.200000, lon: 106.816666 }; 
    const gudangPertama = db.prepare('SELECT lokasi_gps FROM gudang LIMIT 1').get();
    if (gudangPertama && gudangPertama.lokasi_gps) {
      const parts = gudangPertama.lokasi_gps.split(',');
      if (parts.length === 2) {
        gudangPusat.lat = parseFloat(parts[0]);
        gudangPusat.lon = parseFloat(parts[1]);
      }
    }

    const rute = await Promise.all(pengiriman.map(async (kirim) => {
      let jarak = 0;
      if (kirim.lahan_gps) {
        const parts = kirim.lahan_gps.split(',');
        if (parts.length === 2) {
          jarak = await hitungJarakOsrm(
            gudangPusat.lat, gudangPusat.lon, 
            parseFloat(parts[0]), parseFloat(parts[1])
          );
        }
      }
      return {
        ...kirim,
        jarak_ke_gudang_km: Math.round(jarak * 10) / 10
      };
    }));

    // Urutkan dari yang terdekat
    rute.sort((a, b) => a.jarak_ke_gudang_km - b.jarak_ke_gudang_km);

    res.json({ rute });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan saat kalkulasi rute.' });
  }
});

export default router;
