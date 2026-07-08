import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import authRoutes from './routes/auth.js';
import produkRoutes from './routes/produk.js';
import traceRoutes from './routes/trace.js';
import pesananRoutes from './routes/pesanan.js';
import kontrakRoutes from './routes/kontrak.js';
import hargaRoutes from './routes/harga.js';
import ratingRoutes from './routes/rating.js';
import petaniRoutes from './routes/petani.js';
import adminRoutes from './routes/admin.js';
import paymentRoutes from './routes/payment.js';
import ruteRoutes from './routes/rute.js';
import sertifikasiRoutes from './routes/sertifikasi.js';
import sengketaRoutes from './routes/sengketa.js';
import preorderRoutes from './routes/preorder.js';
import gudangStokRoutes from './routes/gudang-stok.js';
import coldChainRoutes from './routes/cold-chain.js';
import logistikRoutes from './routes/logistik.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // allow images to be loaded by frontend
}));

app.use(cors());
app.use(express.json());

// Global Rate Limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  message: { error: 'Terlalu banyak permintaan dari IP ini, coba lagi nanti.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Stricter Rate Limiter for Auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 login/register requests per window
  message: { error: 'Terlalu banyak percobaan login/daftar, coba lagi nanti.' }
});

// Serve generated QR code images
app.use('/qrcodes', express.static(path.join(__dirname, '..', 'data', 'qrcodes')));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'Jejak Tani API' }));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/produk', produkRoutes);
app.use('/api/trace', traceRoutes);
app.use('/api/pesanan', pesananRoutes);
app.use('/api/kontrak', kontrakRoutes);
app.use('/api/harga', hargaRoutes);
app.use('/api/rating', ratingRoutes);
app.use('/api/petani', petaniRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/rute', ruteRoutes);
app.use('/api/sertifikasi', sertifikasiRoutes);
app.use('/api/sengketa', sengketaRoutes);
app.use('/api/preorder', preorderRoutes);
app.use('/api/gudang-stok', gudangStokRoutes);
app.use('/api/cold-chain', coldChainRoutes);
app.use('/api/logistik', logistikRoutes);

app.use((req, res) => res.status(404).json({ error: 'Endpoint tidak ditemukan.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
});

app.listen(PORT, () => {
  console.log(`Jejak Tani API berjalan di http://localhost:${PORT}`);
});
