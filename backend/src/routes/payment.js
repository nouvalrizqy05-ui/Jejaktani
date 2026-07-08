import { Router } from 'express';
import { db, uid } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import midtransClient from 'midtrans-client';

const router = Router();

// Konfigurasi Midtrans diambil dari env. PENTING: default ke false
// (Sandbox) kalau env var tidak diset -- fail-safe ke mode paling aman,
// bukan diam-diam jalan di Production. Sebelumnya nilai ini di-hardcode
// `true` tanpa kontrol env sama sekali, yang berarti kode ini akan selalu
// memanggil endpoint Production Midtrans terlepas dari kredensial yang
// dipasang -- lihat catatan dashboard Midtrans: mode Production baru sah
// dipakai SETELAH mendapat persetujuan bank untuk go-live.
const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// POST /api/payment/create - Generate Snap Token
router.post('/create', requireAuth, requireRole('buyer'), async (req, res) => {
  try {
    const { pesanan_ids } = req.body;
    
    let gross_amount = 0;
    const item_details = [];
    
    // Validasi kepemilikan pesanan
    for (const pid of pesanan_ids) {
      const pesanan = db.prepare('SELECT * FROM pesanan WHERE id = ?').get(pid);
      if (!pesanan) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
      
      const buyer = db.prepare('SELECT * FROM buyer WHERE id = ?').get(pesanan.buyer_id);
      if (!buyer || buyer.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Akses ditolak.' });
      }

      const produk = db.prepare('SELECT * FROM produk WHERE id = ?').get(pesanan.produk_id);
      
      gross_amount += pesanan.harga_total;
      item_details.push({
        id: produk.id,
        price: produk.harga_per_kg,
        quantity: pesanan.jumlah_kg,
        name: produk.nama.substring(0, 50)
      });
    }

    const invId = uid('inv');

    // Parameter transaksi Midtrans
    const parameter = {
      transaction_details: {
        order_id: invId,
        gross_amount: gross_amount
      },
      item_details: item_details,
      customer_details: {
        first_name: req.user.nama,
        email: req.user.email,
        phone: req.user.no_hp || '08123456789'
      },
      custom_field1: pesanan_ids.join(',') // simpan daftar ID pesanan
    };

    const transaction = await snap.createTransaction(parameter);
    res.json({ token: transaction.token, redirect_url: transaction.redirect_url });

  } catch (error) {
    console.error('Midtrans Error:', error);
    res.status(500).json({ error: 'Gagal membuat transaksi pembayaran.' });
  }
});

// POST /api/payment/notification - Midtrans Webhook (otomatis dipanggil server Midtrans)
router.post('/notification', async (req, res) => {
  try {
    const statusResponse = await snap.transaction.notification(req.body);
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;
    const pesananIdsStr = statusResponse.custom_field1;
    
    if (!pesananIdsStr) {
      return res.status(200).json({ message: 'Ignore: No custom_field1' });
    }
    
    const pesananIds = pesananIdsStr.split(',');

    let newStatus = null;

    if (transactionStatus === 'capture') {
      if (fraudStatus === 'accept') {
        newStatus = 'dibayar';
      }
    } else if (transactionStatus === 'settlement') {
      newStatus = 'dibayar';
    } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
      newStatus = 'dibatalkan';
    } else if (transactionStatus === 'pending') {
      newStatus = 'menunggu_pembayaran';
    }

    if (newStatus && newStatus === 'dibayar') {
      for (const orderId of pesananIds) {
        const pesanan = db.prepare('SELECT * FROM pesanan WHERE id = ?').get(orderId);
        if (pesanan && pesanan.status !== 'dibayar') {
          db.prepare('UPDATE pesanan SET status = ? WHERE id = ?').run('dibayar', orderId);
          
          // Setup pengiriman
          const gudangList = db.prepare('SELECT id FROM gudang').all();
          const gudang_id = gudangList.length > 0 ? gudangList[0].id : null;
          const armadaList = db.prepare("SELECT id FROM armada WHERE status = 'tersedia'").all();
          const armada_id = armadaList.length > 0 ? armadaList[0].id : null;

          db.prepare(`INSERT INTO pengiriman (id,pesanan_id,gudang_id,armada_id,status) VALUES (?,?,?,?,?)`)
            .run(uid('kir'), orderId, gudang_id, armada_id, 'menunggu');
        }
      }
    }

    res.status(200).json({ message: 'OK' });
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
