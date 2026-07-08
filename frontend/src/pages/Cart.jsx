import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';
import ProductImage from '../components/ProductImage.jsx';
import { formatRupiah } from '../utils.js';
import { Truck, ArrowLeft } from 'lucide-react';

export default function Cart() {
  const { items, updateQty, removeItem, total, clear } = useCart();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [tipe, setTipe] = useState('reguler');
  const [alamat, setAlamat] = useState('');
  
  // Logistics states
  const [vendors, setVendors] = useState([]);
  const [vendor, setVendor] = useState('');
  const [ongkir, setOngkir] = useState(0);
  const [ongkirLoading, setOngkirLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listLogistikVendors().then(setVendors).catch(() => {});
  }, []);

  useEffect(() => {
    if (vendor && alamat.length > 5 && items.length > 0) {
      setOngkirLoading(true);
      const totalKg = items.reduce((sum, i) => sum + i.jumlah_kg, 0);
      api.cekOngkir({ asal_kota: 'Cianjur', tujuan_kota: alamat, berat_kg: totalKg, kurir: vendor })
        .then(res => setOngkir(res.biaya))
        .catch(() => setOngkir(0))
        .finally(() => setOngkirLoading(false));
    } else {
      setOngkir(0);
    }
  }, [vendor, alamat, items]);

  const handleCheckout = async () => {
    if (!alamat.trim()) { setError('Alamat pengiriman wajib diisi.'); return; }
    setLoading(true);
    setError('');
    try {
      const created = [];
      for (const item of items) {
        const pesanan = await api.createPesanan({
          produk_id: item.produk.id,
          jumlah_kg: item.jumlah_kg,
          tipe_pengiriman: tipe,
          catatan_alamat: alamat,
          vendor_logistik: vendor || null
        }, token);
        created.push(pesanan.id);
      }
      
      const snapRes = await api.createPayment({ pesanan_ids: created }, token);
      
      window.snap.pay(snapRes.token, {
        onSuccess: function(result) {
          clear();
          navigate('/akun/pesanan', { state: { justOrdered: created, paymentStatus: 'success' } });
        },
        onPending: function(result) {
          clear();
          navigate('/akun/pesanan', { state: { justOrdered: created, paymentStatus: 'pending' } });
        },
        onError: function(result) {
          navigate('/akun/pesanan');
        },
        onClose: function() {
          navigate('/akun/pesanan');
        }
      });
      
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-earth-50 min-h-screen w-full pb-10">
        <div className="bg-teal-800 text-white px-4 py-4 md:px-8 shadow-md sticky top-14 md:top-16 z-40">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <Link to="/home" className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-display font-bold text-xl md:text-2xl">Keranjang Belanja</h1>
              <p className="text-white/80 text-xs md:text-sm">Produk segar yang siap di-checkout</p>
            </div>
          </div>
        </div>
        <div className="w-full max-w-7xl mx-auto p-4 md:p-6 mt-4">
          <div className="bg-white rounded-3xl shadow-sm border border-earth-100 p-10 flex flex-col items-center justify-center text-center min-h-[50vh]">
            <p className="text-6xl mb-4">🧺</p>
            <h2 className="font-display font-bold text-2xl text-earth-900 mb-2">Keranjang masih kosong</h2>
            <p className="text-earth-500 max-w-md mb-8">Yuk jelajahi katalog produk segar langsung dari petani mitra kami.</p>
            <Link to="/home" className="btn bg-teal-600 text-white hover:bg-teal-700 shadow-md shadow-teal-600/20 px-6 py-2 rounded-xl font-bold">
              Ke Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-earth-50 min-h-screen w-full pb-10">
      <div className="bg-teal-800 text-white px-4 py-4 md:px-8 shadow-md sticky top-14 md:top-16 z-40">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link to="/home" className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-display font-bold text-xl md:text-2xl">Keranjang Belanja</h1>
            <p className="text-white/80 text-xs md:text-sm">Produk segar yang siap di-checkout</p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto p-4 md:p-6 mt-4">
        <div className="bg-white rounded-3xl shadow-sm border border-earth-100 p-6 md:p-8 max-w-4xl mx-auto">
          <div className="space-y-3">
        {items.map((item) => (
          <div key={item.produk.id} className="card p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-teal-50 overflow-hidden flex items-center justify-center"><ProductImage src={item.produk.foto_emoji} alt={item.produk.nama} size="md" className="w-full h-full" /></div>
            <div className="flex-1">
              <p className="font-display font-semibold text-earth-900">{item.produk.nama}</p>
              <p className="text-sm text-earth-500">{formatRupiah(item.produk.harga_per_kg)} / kg</p>
            </div>
            <input
              type="number" min="1" value={item.jumlah_kg}
              onChange={(e) => updateQty(item.produk.id, Math.max(1, Number(e.target.value)))}
              className="input !w-20 text-center"
            />
            <span className="w-28 text-right font-semibold text-earth-800">{formatRupiah(item.jumlah_kg * item.produk.harga_per_kg)}</span>
            <button onClick={() => removeItem(item.produk.id)} className="text-earth-400 hover:text-red-500 text-sm">Hapus</button>
          </div>
        ))}
      </div>

      <div className="card p-5 mt-6 space-y-4">
        <div>
          <label className="label">Alamat pengiriman</label>
          <textarea value={alamat} onChange={(e) => setAlamat(e.target.value)} rows={2} className="input" placeholder="Nama jalan, kota, kode pos" />
        </div>
        <div>
          <label className="label">Opsi pengiriman</label>
          <div className="flex gap-2 mb-3">
            {[
              ['same_day', 'Same-day (sebelum 11.00)'],
              ['reguler', 'Reguler'],
              ['tanpa_kontak', 'Tanpa kontak'],
            ].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setTipe(val)}
                className={`btn-secondary !rounded-xl text-xs !py-2 ${tipe === val ? '!bg-teal-700 !text-white !border-teal-700' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="label flex items-center gap-2"><Truck className="w-4 h-4"/> Kurir Pengiriman</label>
          <select value={vendor} onChange={e => setVendor(e.target.value)} className="input">
            <option value="">Pilih kurir logistik...</option>
            {vendors.map(v => <option key={v.kode} value={v.kode}>{v.nama}</option>)}
          </select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        
        <div className="space-y-2 pt-3 border-t border-earth-100">
          <div className="flex items-center justify-between text-sm text-earth-500">
            <span>Subtotal Produk</span>
            <span>{formatRupiah(total)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-earth-500">
            <span>Biaya Pengiriman {ongkirLoading && '(Menghitung...)'}</span>
            <span>{ongkir > 0 ? formatRupiah(ongkir) : '-'}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-earth-100 mt-2">
            <span className="text-earth-700 font-semibold">Total Tagihan</span>
            <span className="font-display text-2xl font-semibold text-teal-800">{formatRupiah(total + ongkir)}</span>
          </div>
        </div>
        <button onClick={handleCheckout} disabled={loading} className="btn-primary w-full !py-3">
          {loading ? 'Memproses...' : 'Bayar & Buat Pesanan'}
        </button>
        <p className="text-xs text-earth-400 text-center">
          Menggunakan Midtrans Sandbox Payment Gateway &mdash; Aman dan terintegrasi untuk WebDev Competition.
        </p>
      </div>
        </div>
      </div>
    </div>
  );
}
