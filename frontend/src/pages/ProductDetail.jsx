import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { formatRupiah, formatDate } from '../utils.js';
import TrustStars from '../components/TrustStars.jsx';
import TraceTimeline from '../components/TraceTimeline.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { ArrowLeft, ShoppingBag, MapPin, Award, CheckCircle2 } from 'lucide-react';
import ProductImage from '../components/ProductImage.jsx';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [produk, setProduk] = useState(null);
  const [qty, setQty] = useState(1);
  const [sertifikasi, setSertifikasi] = useState([]);
  const [added, setAdded] = useState(false);
  const { user } = useAuth();
  const { addItem } = useCart();

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getProduk(id);
        setProduk(data);
        const cert = await api.getSertifikasiProduk(id);
        setSertifikasi(cert);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, [id]);

  if (!produk) return (
    <div className="flex flex-col h-full bg-earth-50 animate-pulse">
      <div className="w-full aspect-square bg-earth-200"></div>
      <div className="p-5 bg-white rounded-t-3xl -mt-6">
        <div className="h-6 w-1/3 bg-earth-200 rounded-lg mb-3"></div>
        <div className="h-8 w-2/3 bg-earth-200 rounded-lg mb-6"></div>
        <div className="h-4 w-full bg-earth-200 rounded-lg mb-2"></div>
        <div className="h-4 w-4/5 bg-earth-200 rounded-lg"></div>
      </div>
    </div>
  );

  const sisa = produk.jumlah_kg - produk.jumlah_terjual_kg;

  const handleAdd = () => {
    addItem(produk, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="bg-earth-50 min-h-full pb-24 md:pb-10 max-w-7xl mx-auto w-full md:px-6">
      {/* App Bar Over Image (Mobile Only) */}
      <div className="md:hidden absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="md:hidden">
        {/* Hero Image Mobile */}
        <div className="w-full aspect-square overflow-hidden bg-gradient-to-br from-teal-100 to-harvest-100">
          <ProductImage src={produk.foto_emoji} alt={produk.nama} size="lg" className="w-full h-full hover:scale-105 transition-transform duration-500" />
        </div>
      </div>

      <div className="hidden md:flex items-center gap-2 py-4">
        <button onClick={() => navigate(-1)} className="text-sm font-semibold text-teal-700 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
      </div>

      <div className="md:grid md:grid-cols-2 md:gap-10 md:mt-2">
        {/* Desktop Image */}
        <div className="hidden md:flex w-full aspect-square items-center justify-center overflow-hidden bg-gradient-to-br from-teal-50 to-harvest-50 rounded-[3rem] shadow-sm border border-earth-100">
          <ProductImage src={produk.foto_emoji} alt={produk.nama} size="lg" className="w-full h-full rounded-[3rem] hover:scale-105 transition-transform duration-500" />
        </div>

        {/* Content Container (Pulls up over image on mobile, normal grid column on desktop) */}
        <div className="bg-white rounded-t-[2rem] md:rounded-[3rem] -mt-8 md:mt-0 relative z-20 px-5 pt-8 pb-10 shadow-sm border-t md:border border-white/50 md:border-earth-100 md:shadow-xl md:p-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-leaf-50 text-leaf-700 text-xs font-bold uppercase tracking-wide">
            <Award className="w-3.5 h-3.5" /> Grade {produk.grade}
          </span>
          <span className="text-sm font-medium text-earth-500">Sisa {sisa} kg</span>
        </div>

        <h1 className="font-display text-2xl font-bold text-earth-900 leading-tight mb-2">{produk.nama}</h1>
        
        <div className="flex items-center gap-2 mb-6">
          <MapPin className="w-4 h-4 text-earth-400" />
          <span className="text-sm text-earth-600">{produk.petani?.desa}</span>
          <span className="text-stone-300">&bull;</span>
          <TrustStars rataRata={produk.petani?.trust?.rata_rata} jumlah={produk.petani?.trust?.jumlah_ulasan} size="sm" />
        </div>

        <div className="flex items-baseline gap-1.5 mb-6">
          <span className="font-display text-3xl font-bold text-teal-700">{formatRupiah(produk.harga_per_kg)}</span>
          <span className="text-earth-500 text-sm">/ kg</span>
        </div>

        <p className="text-earth-600 text-sm leading-relaxed mb-6">{produk.deskripsi}</p>

        {/* Certifications (if any) */}
        {sertifikasi.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-100">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-800 mb-3">Sertifikasi</h3>
            <div className="space-y-2">
              {sertifikasi.map(cert => (
                <div key={cert.id} className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">{cert.jenis}</p>
                    <p className="text-xs text-amber-700">{cert.penerbit}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Traceability Entry Point */}
        <div className="card p-4 flex gap-4 items-center mb-8 border-teal-100 bg-teal-50/50">
          <img src={`/qrcodes/${produk.id}.png`} alt="QR Code" className="w-16 h-16 rounded-xl border border-teal-200 bg-white" />
          <div className="flex-1">
            <p className="font-semibold text-earth-900 text-sm mb-1">Traceability Terverifikasi</p>
            <Link to={`/trace/${produk.id}`} className="text-xs font-medium text-teal-700 bg-teal-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 hover:bg-teal-200 transition-colors">
              Lihat Jejak Penuh &rarr;
            </Link>
          </div>
        </div>

        <h2 className="font-display text-lg font-semibold text-earth-900 mb-4">Riwayat Perjalanan</h2>
        <div className="pl-2">
          <TraceTimeline perjalanan={produk.traceability} />
        </div>
        
        {/* Dekstop Buy Action - Appends at the end of right column */}
        <div className="hidden md:block mt-auto pt-8">
          {user?.role === 'buyer' ? (
            <div className="flex gap-3 h-14">
              <div className="flex items-center border border-earth-300 rounded-xl bg-white w-32 shrink-0 overflow-hidden">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-full flex items-center justify-center text-earth-500 hover:bg-earth-50 active:bg-earth-100 transition-colors">&minus;</button>
                <div className="flex-1 text-center font-semibold text-sm border-x border-earth-100 h-full flex items-center justify-center">{qty}</div>
                <button onClick={() => setQty(q => Math.min(sisa, q + 1))} className="w-10 h-full flex items-center justify-center text-earth-500 hover:bg-earth-50 active:bg-earth-100 transition-colors">+</button>
              </div>
              <button 
                onClick={handleAdd} 
                disabled={sisa === 0 || added}
                className={`flex-1 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all shadow-lg ${
                  sisa === 0 ? 'bg-earth-200 text-earth-400 cursor-not-allowed shadow-none' : 
                  added ? 'bg-green-500 text-white shadow-green-500/30' : 
                  'bg-teal-700 text-white hover:bg-teal-800 shadow-teal-900/20 active:scale-95'
                }`}
              >
                {added ? <CheckCircle2 className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                {sisa === 0 ? 'Habis' : added ? 'Ditambahkan' : 'Tambah ke Keranjang'}
              </button>
            </div>
          ) : !user ? (
            <Link to="/masuk" className="w-full h-14 rounded-xl bg-teal-700 text-white font-semibold text-base flex items-center justify-center hover:bg-teal-800 shadow-lg shadow-teal-900/20 transition-all active:scale-95">
              Masuk untuk Membeli
            </Link>
          ) : (
            <div className="h-14 flex items-center justify-center bg-earth-100 rounded-xl text-earth-500 text-sm font-medium">
              Beralih ke akun Pembeli untuk bertransaksi.
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Sticky Bottom Add to Cart (Only for Mobile) */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-30 flex justify-center pointer-events-none">
        <div className="w-full max-w-md bg-white/90 backdrop-blur-md border-t border-earth-200 p-4 pointer-events-auto">
          {user?.role === 'buyer' ? (
            <div className="flex gap-3 h-12">
              <div className="flex items-center border border-earth-300 rounded-xl bg-white w-32 shrink-0 overflow-hidden">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-full flex items-center justify-center text-earth-500 hover:bg-earth-50 active:bg-earth-100 transition-colors">&minus;</button>
                <div className="flex-1 text-center font-semibold text-sm border-x border-earth-100 h-full flex items-center justify-center">{qty}</div>
                <button onClick={() => setQty(q => Math.min(sisa, q + 1))} className="w-10 h-full flex items-center justify-center text-earth-500 hover:bg-earth-50 active:bg-earth-100 transition-colors">+</button>
              </div>
              <button 
                onClick={handleAdd} 
                disabled={sisa === 0 || added}
                className={`flex-1 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                  sisa === 0 ? 'bg-earth-200 text-earth-400 cursor-not-allowed shadow-none' : 
                  added ? 'bg-green-500 text-white shadow-green-500/30' : 
                  'bg-teal-700 text-white hover:bg-teal-800 shadow-teal-900/20 active:scale-95'
                }`}
              >
                {added ? <CheckCircle2 className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                {sisa === 0 ? 'Habis' : added ? 'Ditambahkan' : 'Keranjang'}
              </button>
            </div>
          ) : !user ? (
            <Link to="/masuk" className="w-full h-12 rounded-xl bg-teal-700 text-white font-semibold text-sm flex items-center justify-center hover:bg-teal-800 shadow-lg shadow-teal-900/20 transition-all active:scale-95">
              Masuk untuk Membeli
            </Link>
          ) : (
            <div className="h-12 flex items-center justify-center bg-earth-100 rounded-xl text-earth-500 text-sm font-medium">
              Beralih ke akun Pembeli untuk transaksi.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
