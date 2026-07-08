const assert = require('assert');

// Simple fetch wrapper since Node v18+ supports fetch natively
const BASE_URL = 'http://localhost:4000/api';

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  
  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

async function runE2E() {
  console.log('--- Memulai E2E Test: B2C Checkout Flow ---');
  
  try {
    // 1. Register a new buyer
    console.log('1. Registrasi Akun Buyer...');
    const randomSuffix = Math.floor(Math.random() * 10000);
    const registerData = await request('/auth/register', {
      method: 'POST',
      body: {
        nama: `Buyer E2E ${randomSuffix}`,
        email: `buyer.e2e.${randomSuffix}@jejaktani.id`,
        password: 'Password123!',
        role: 'buyer',
        tipe_buyer: 'b2c',
        alamat: 'Jl. Merdeka 45, Jakarta'
      }
    });
    assert(registerData.token, 'Token tidak ditemukan setelah register');
    const token = registerData.token;
    console.log('   ✅ Berhasil registrasi & login');

    // 2. Fetch products
    console.log('2. Mencari produk di marketplace...');
    const produkList = await request('/produk');
    assert(produkList.length > 0, 'Marketplace kosong');
    const produk = produkList[0];
    console.log(`   ✅ Ditemukan produk: ${produk.nama}`);

    // 3. Create pesanan (Cart Checkout)
    console.log('3. Membuat pesanan (checkout)...');
    const pesanan = await request('/pesanan', {
      method: 'POST',
      token,
      body: {
        produk_id: produk.id,
        jumlah_kg: 2,
        tipe_pengiriman: 'same_day',
        catatan_alamat: 'Kirim ke rumah warna biru'
      }
    });
    assert(pesanan.id, 'Gagal membuat pesanan');
    assert.strictEqual(pesanan.status, 'menunggu_pembayaran');
    console.log(`   ✅ Pesanan dibuat: ${pesanan.id}, total: Rp${pesanan.harga_total}`);

    // 4. Simulate Midtrans Payment Creation (Sandbox)
    console.log('4. Membuat Midtrans Payment Token...');
    const payment = await request('/payment/create', {
      method: 'POST',
      token,
      body: { pesanan_ids: [pesanan.id] }
    });
    assert(payment.token, 'Midtrans token tidak terbentuk');
    console.log(`   ✅ Token pembayaran didapat: ${payment.token}`);

    // 5. Simulate Payment Success (via /bayar endpoint)
    console.log('5. Simulasi penyelesaian pembayaran...');
    const dibayar = await request(`/pesanan/${pesanan.id}/bayar`, {
      method: 'PATCH',
      token
    });
    assert.strictEqual(dibayar.status, 'dibayar');
    console.log('   ✅ Pesanan berhasil dibayar');

    // 6. Verify Pengiriman generated
    console.log('6. Memeriksa status pesanan & pengiriman...');
    const myPesanan = await request(`/pesanan/${pesanan.id}`, { token });
    assert(myPesanan.pengiriman, 'Pengiriman tidak otomatis dibuat setelah bayar');
    console.log(`   ✅ Pengiriman dibuat dengan ID armada: ${myPesanan.pengiriman.armada_id || 'Belum di-assign'}`);

    console.log('\\n🎉 E2E Checkout Flow Selesai Tanpa Error! 🎉');

  } catch (error) {
    console.error('\\n❌ E2E Gagal:');
    console.error(error.message);
    process.exit(1);
  }
}

runE2E();
