import { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatRupiah, formatDateTime } from '../utils.js';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Preorder() {
  const { showToast } = useToast();
  const [preorders, setPreorders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.listPreorder().then(setPreorders).finally(() => setLoading(false));
  }, []);

  const handlePesan = async (id, minKg) => {
    if (!user) {
      navigate('/login');
      return;
    }
    const jumlah = prompt(`Masukkan jumlah kg yang ingin dipesan (Minimal ${minKg} kg):`, minKg);
    if (!jumlah) return;
    if (isNaN(jumlah) || Number(jumlah) < minKg) {
      showToast(`Jumlah tidak valid. Minimal ${minKg} kg.`, 'info');
      return;
    }

    try {
      await api.pesanPreorder(id, { jumlah_kg: Number(jumlah) }, token);
      showToast('Preorder berhasil dikunci! Silakan bayar melalui halaman Akun Saya.', 'info');
      navigate('/akun');
    } catch (e) {
      showToast(e.message, 'info');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="font-display text-3xl font-bold text-stone-900 mb-3">Preorder Komoditas Musiman</h1>
        <p className="text-stone-500 max-w-xl mx-auto">
          Amankan stok komoditas unggulan langsung dari petani dengan harga yang terkunci. Bebas khawatir fluktuasi harga saat panen tiba.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-10 text-stone-500">Memuat data preorder...</div>
      ) : preorders.length === 0 ? (
        <div className="card p-10 text-center border-dashed border-stone-200">
          <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="font-semibold text-stone-900">Belum ada preorder aktif</h3>
          <p className="text-stone-500 text-sm mt-1">Petani belum membuka sesi preorder saat ini.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {preorders.map(p => {
            const progress = (p.jumlah_dipesan_kg / p.jumlah_maks_kg) * 100;
            const sisa = p.jumlah_maks_kg - p.jumlah_dipesan_kg;
            return (
              <div key={p.id} className="card overflow-hidden flex flex-col">
                <div className="bg-teal-700 text-white p-5 text-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
                  <h3 className="font-display text-xl font-bold relative z-10">{p.komoditas}</h3>
                  <p className="text-teal-100 text-sm mt-1 relative z-10">Dari: {p.petani_nama} ({p.petani_desa})</p>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <p className="text-xs text-stone-500 uppercase tracking-wider font-semibold mb-1">Harga Terkunci</p>
                      <p className="font-display text-2xl font-bold text-teal-700">{formatRupiah(p.harga_terkunci_per_kg)}<span className="text-sm font-normal text-stone-500">/kg</span></p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 text-sm text-stone-600 mb-6 flex-1">
                    <p className="flex items-center gap-2"><Calendar className="w-4 h-4 text-stone-400" /> Estimasi Panen: <strong className="text-stone-900">{formatDateTime(p.tanggal_panen_estimasi).split(' ')[0]}</strong></p>
                    <p className="flex items-center gap-2"><Clock className="w-4 h-4 text-red-400" /> Ditutup pada: <strong className="text-stone-900">{formatDateTime(p.tanggal_tutup).split(' ')[0]}</strong></p>
                    <p className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /> <span className="italic">{p.deskripsi || 'Sistem pre-order mengunci harga saat ini untuk pengiriman saat panen tiba.'}</span></p>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1 font-medium">
                      <span>Terkumpul: {p.jumlah_dipesan_kg} kg</span>
                      <span>Target: {p.jumlah_maks_kg} kg</span>
                    </div>
                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className="text-xs text-stone-400 text-right mt-1">Sisa kuota: {sisa} kg</p>
                  </div>

                  <button 
                    onClick={() => handlePesan(p.id, p.jumlah_min_kg)}
                    disabled={sisa < p.jumlah_min_kg}
                    className="btn-primary w-full shadow-lg shadow-teal-900/10"
                  >
                    {sisa < p.jumlah_min_kg ? 'Kuota Penuh' : `Ikut Preorder (Min. ${p.jumlah_min_kg}kg)`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
