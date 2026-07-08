import { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext.jsx';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatRupiah, formatDateTime, STATUS_PESANAN_LABELS } from '../utils.js';
import ProductImage from '../components/ProductImage.jsx';

const STATUS_COLORS = {
  menunggu_pembayaran: 'bg-harvest-100 text-harvest-800',
  dibayar: 'bg-teal-100 text-teal-800',
  disiapkan: 'bg-teal-100 text-teal-800',
  dikirim: 'bg-leaf-100 text-leaf-800',
  selesai: 'bg-stone-100 text-stone-600',
  dibatalkan: 'bg-red-100 text-red-700',
};

function PesananTab({ token, sengketa, setSengketa, setSengketaForm, ajukanSengketa }) {
  const [pesanan, setPesanan] = useState([]);
  const [ratingFor, setRatingFor] = useState(null);
  const [skor, setSkor] = useState(5);
  const [komentar, setKomentar] = useState('');
  const location = useLocation();

  const load = () => api.myPesanan(token).then(setPesanan);
  useEffect(() => { load(); }, [token]);

  const submitRating = async (pesananId, untukUserId) => {
    await api.createRating({ pesanan_id: pesananId, untuk_user_id: untukUserId, skor, komentar }, token);
    setRatingFor(null);
    setKomentar('');
    load();
  };

  const terimaPesanan = async (id) => {
    await api.updatePesanan(id, { status: 'selesai' }, token);
    load();
  };

  return (
    <div className="space-y-3">
      {location.state?.justOrdered && (
        <div className="card p-4 bg-leaf-50 border-leaf-200 text-leaf-800 text-sm">
          Pesanan berhasil dibuat dan pembayaran terkonfirmasi (simulasi).
        </div>
      )}
      {pesanan.length === 0 && <p className="text-stone-400 text-sm">Belum ada pesanan.</p>}
      {pesanan.map((p) => (
        <div key={p.id} className="card p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 overflow-hidden flex items-center justify-center"><ProductImage src={p.foto_emoji} alt={p.produk_nama} size="sm" className="w-full h-full" /></div>
            <div className="flex-1 min-w-[180px]">
              <p className="font-display font-semibold text-stone-900">{p.produk_nama}</p>
              <p className="text-xs text-stone-500">{p.jumlah_kg} kg &bull; {formatRupiah(p.harga_total)} &bull; {formatDateTime(p.tanggal_pesan)}</p>
              <p className="text-xs text-stone-400">Petani: {p.petani_nama}</p>
            </div>
            <span className={`badge ${STATUS_COLORS[p.status]}`}>{STATUS_PESANAN_LABELS[p.status]}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-stone-100 flex flex-wrap gap-2">
            {p.status === 'selesai' && (
              <>
                {ratingFor === p.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <select value={skor} onChange={(e) => setSkor(Number(e.target.value))} className="input !w-24">
                      {[5, 4, 3, 2, 1].map((s) => <option key={s} value={s}>{s} bintang</option>)}
                    </select>
                    <input value={komentar} onChange={(e) => setKomentar(e.target.value)} placeholder="Komentar (opsional)" className="input flex-1 !w-40" />
                    <button onClick={() => submitRating(p.id, p.petani_user_id)} className="btn-primary !py-1.5 text-xs">Kirim</button>
                  </div>
                ) : (
                  <button onClick={() => setRatingFor(p.id)} className="text-sm text-teal-700 hover:underline">Beri ulasan &rarr;</button>
                )}
              </>
            )}
            <div className="flex gap-2 w-full sm:w-auto">
              {p.status === 'menunggu_pembayaran' && <button onClick={() => window.location.href='/cart'} className="btn-primary !py-1 text-sm flex-1">Bayar</button>}
              {p.status === 'dikirim' && <button onClick={() => terimaPesanan(p.id)} className="btn-secondary !py-1 text-sm flex-1 !text-teal-700 !border-teal-700 hover:!bg-teal-50">Pesanan Diterima</button>}
              {['selesai', 'dibatalkan', 'dikirim'].includes(p.status) && (
                <button onClick={() => setSengketaForm({open: true, pesananId: p.id, alasan: ''})} className="btn-secondary !py-1 text-sm flex-1 !text-red-700 !border-red-700 hover:!bg-red-50">Ajukan Komplain</button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function KontrakTab() {
  const { token } = useAuth();
  const [kontrak, setKontrak] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ komoditas: '', volume_rutin_kg: '', frekuensi: 'mingguan', harga_terkunci_per_kg: '', termin_hari: 14 });
  const [error, setError] = useState('');

  const load = () => api.myKontrak(token).then(setKontrak);
  useEffect(() => { load(); }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.createKontrak({
        ...form,
        volume_rutin_kg: Number(form.volume_rutin_kg),
        harga_terkunci_per_kg: Number(form.harga_terkunci_per_kg),
        termin_hari: Number(form.termin_hari),
      }, token);
      setShowForm(false);
      setForm({ komoditas: '', volume_rutin_kg: '', frekuensi: 'mingguan', harga_terkunci_per_kg: '', termin_hari: 14 });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowForm((s) => !s)} className="btn-secondary text-sm">
          {showForm ? 'Batal' : '+ Buat Kontrak Berulang'}
        </button>
      </div>
      {showForm && (
        <form onSubmit={submit} className="card p-5 mb-6 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Komoditas</label>
              <input required value={form.komoditas} onChange={(e) => setForm((f) => ({ ...f, komoditas: e.target.value }))} className="input" placeholder="Beras" />
            </div>
            <div>
              <label className="label">Volume rutin (kg)</label>
              <input required type="number" value={form.volume_rutin_kg} onChange={(e) => setForm((f) => ({ ...f, volume_rutin_kg: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="label">Frekuensi</label>
              <select value={form.frekuensi} onChange={(e) => setForm((f) => ({ ...f, frekuensi: e.target.value }))} className="input">
                <option value="mingguan">Mingguan</option>
                <option value="dwi_mingguan">Dwi-mingguan</option>
                <option value="bulanan">Bulanan</option>
              </select>
            </div>
            <div>
              <label className="label">Harga terkunci per kg (Rp)</label>
              <input required type="number" value={form.harga_terkunci_per_kg} onChange={(e) => setForm((f) => ({ ...f, harga_terkunci_per_kg: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="label">Termin pembayaran (hari)</label>
              <select value={form.termin_hari} onChange={(e) => setForm((f) => ({ ...f, termin_hari: e.target.value }))} className="input">
                <option value={7}>7 hari</option>
                <option value={14}>14 hari</option>
                <option value={30}>30 hari</option>
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary">Simpan Kontrak</button>
        </form>
      )}
      <div className="space-y-3">
        {kontrak.length === 0 && <p className="text-stone-400 text-sm">Belum ada kontrak berulang.</p>}
        {kontrak.map((k) => (
          <div key={k.id} className="card p-4 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[180px]">
              <p className="font-display font-semibold text-stone-900">{k.komoditas}</p>
              <p className="text-xs text-stone-500">
                {k.volume_rutin_kg} kg / {k.frekuensi.replace('_', '-')} &bull; {formatRupiah(k.harga_terkunci_per_kg)}/kg &bull; termin {k.termin_hari} hari
              </p>
            </div>
            <span className="badge bg-teal-50 text-teal-800 capitalize">{k.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Akun() {
  const { showToast } = useToast();
  const { token, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('menu');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pesanan, setPesanan] = useState([]);
  const [sengketa, setSengketa] = useState([]);
  const [sengketaForm, setSengketaForm] = useState({ open: false, pesananId: null, alasan: '' });
  const isB2B = profile?.tipe === 'b2b';

  const ajukanSengketa = async (e) => {
    e.preventDefault();
    try {
      await api.createSengketa({ pesanan_id: sengketaForm.pesananId, alasan: sengketaForm.alasan }, token);
      setSengketaForm({ open: false, pesananId: null, alasan: '' });
      const sgk = await api.mySengketa(token);
      setSengketa(sgk);
      showToast('Sengketa berhasil diajukan dan akan diproses admin.', 'info');
    } catch(e) {
      showToast(e.message, 'info');
    }
  };

  useEffect(() => {
    async function loadData() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await api.me(token);
        setUser(data);
        if (data.role === 'buyer') {
          const pes = await api.myPesanan(token);
          setPesanan(pes);
          try {
            const sgk = await api.mySengketa(token);
            setSengketa(sgk);
          } catch(e) {}
        }
      } catch (err) {
        logout();
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [token, logout, navigate]);

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-24 text-center text-stone-400">Memuat profil...</div>;

  if (!user) {
    return (
      <div className="w-full bg-stone-100 min-h-screen">
        {/* Top Header Section */}
        <div className="bg-teal-700 text-white px-4 pt-10 pb-6 rounded-b-xl shadow-sm">
          <h1 className="font-display text-2xl font-bold mb-4">Akun Saya</h1>
          <p className="text-teal-50 text-sm mb-6">Bergabung dengan kami dan dapatkan kemudahannya!</p>
          <div className="flex gap-4">
            <button onClick={() => navigate('/masuk')} className="flex-1 bg-white text-teal-700 font-bold py-2.5 rounded-lg text-center hover:bg-stone-50 transition">
              Masuk
            </button>
            <button onClick={() => navigate('/daftar')} className="flex-1 border-2 border-white text-white font-bold py-2.5 rounded-lg text-center hover:bg-white/10 transition">
              Daftar
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <div className="mt-4 bg-white border-y border-stone-200">
          <button onClick={() => navigate('/jadi-mitra')} className="w-full flex items-center justify-between px-4 py-4 border-b border-stone-100 hover:bg-stone-50 transition">
            <div className="flex items-center gap-4">
              <div className="text-stone-400"><svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>
              <div className="text-left">
                <p className="font-bold text-stone-800">Menjadi Mitra Jejak Tani</p>
                <p className="text-xs text-stone-500 mt-0.5">Kembangkan usaha Anda dan dukung petani kita</p>
              </div>
            </div>
            <div className="text-stone-400">›</div>
          </button>

          <button className="w-full flex items-center justify-between px-4 py-4 border-b border-stone-100 hover:bg-stone-50 transition">
            <div className="flex items-center gap-4">
              <div className="text-stone-400"><svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
              <p className="font-bold text-stone-800">Bantuan</p>
            </div>
            <div className="text-stone-400">›</div>
          </button>

          <button className="w-full flex items-center justify-between px-4 py-4 border-b border-stone-100 hover:bg-stone-50 transition">
            <div className="flex items-center gap-4">
              <div className="text-stone-400"><svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
              <p className="font-bold text-stone-800">Hubungi Kami</p>
            </div>
            <div className="text-stone-400">›</div>
          </button>

          <button className="w-full flex items-center justify-between px-4 py-4 border-b border-stone-100 hover:bg-stone-50 transition">
            <div className="flex items-center gap-4">
              <div className="text-stone-400"><svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></div>
              <p className="font-bold text-stone-800">Syarat & Ketentuan</p>
            </div>
            <div className="text-stone-400">›</div>
          </button>

          <button className="w-full flex items-center justify-between px-4 py-4 border-b border-stone-100 hover:bg-stone-50 transition">
            <div className="flex items-center gap-4">
              <div className="text-stone-400"><svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
              <p className="font-bold text-stone-800">Kebijakan Privasi</p>
            </div>
            <div className="text-stone-400">›</div>
          </button>
        </div>

        <div className="px-4 py-6">
          <p className="text-sm font-semibold text-stone-500">Versi 1.0.0</p>
        </div>
      </div>
    );
  }

  // Helper to render the menu layout
  if (user && activeMenu === 'menu') {
    return (
      <div className="w-full bg-stone-100 min-h-screen pb-20">
        {/* Top Header Section */}
        <div className="bg-teal-700 text-white px-4 pt-10 pb-6 rounded-b-xl shadow-sm">
          <h1 className="font-display text-2xl font-bold">Akun Saya</h1>
        </div>

        {/* User Info */}
        <div className="bg-white px-4 py-5 border-b border-stone-200 mt-2">
          <h2 className="font-bold text-stone-900 text-lg capitalize">{user.nama}</h2>
          <p className="text-stone-500 text-sm">{user.email}</p>
        </div>

        {/* Voucher Section */}
        <div className="bg-white px-4 py-5 border-b border-stone-200 mt-2">
          <h3 className="font-bold text-stone-900 mb-3">Jejak Tani Voucher</h3>
          <div className="inline-flex items-center gap-2 bg-stone-50 text-stone-600 px-3 py-1.5 rounded-md border border-stone-200 text-sm font-medium mb-4">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            0 Voucher
          </div>
          <button className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-3 rounded-xl transition-colors">
            Lihat Voucher Saya
          </button>
        </div>

        {/* Menu Items */}
        <div className="mt-2 bg-white border-y border-stone-200">
          <button onClick={() => setActiveMenu('pesanan')} className="w-full flex items-center justify-between px-4 py-4 border-b border-stone-100 hover:bg-stone-50 transition">
            <div className="flex items-center gap-4">
              <div className="text-stone-400"><svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg></div>
              <div className="text-left">
                <p className="font-bold text-stone-800">Pesanan Saya</p>
                <p className="text-xs text-stone-500 mt-0.5">Lacak dan kelola pesanan Anda</p>
              </div>
            </div>
            <div className="text-stone-400">›</div>
          </button>

          {isB2B && (
            <button onClick={() => setActiveMenu('kontrak')} className="w-full flex items-center justify-between px-4 py-4 border-b border-stone-100 hover:bg-stone-50 transition">
              <div className="flex items-center gap-4">
                <div className="text-stone-400"><svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></div>
                <div className="text-left">
                  <p className="font-bold text-stone-800">Kontrak Berulang</p>
                  <p className="text-xs text-stone-500 mt-0.5">Kelola pasokan rutin B2B Anda</p>
                </div>
              </div>
              <div className="text-stone-400">›</div>
            </button>
          )}

          <button onClick={() => setActiveMenu('sengketa')} className="w-full flex items-center justify-between px-4 py-4 border-b border-stone-100 hover:bg-stone-50 transition">
            <div className="flex items-center gap-4">
              <div className="text-stone-400"><svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
              <div className="text-left">
                <p className="font-bold text-stone-800">Sengketa & Komplain</p>
                <p className="text-xs text-stone-500 mt-0.5">Pusat resolusi kendala pesanan</p>
              </div>
            </div>
            <div className="text-stone-400">›</div>
          </button>

          <button onClick={() => navigate('/jadi-mitra')} className="w-full flex items-center justify-between px-4 py-4 border-b border-stone-100 hover:bg-stone-50 transition">
            <div className="flex items-center gap-4">
              <div className="text-stone-400"><svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>
              <div className="text-left">
                <p className="font-bold text-stone-800">Menjadi Mitra Jejak Tani</p>
                <p className="text-xs text-stone-500 mt-0.5">Kembangkan usaha Anda dan dukung petani kita</p>
              </div>
            </div>
            <div className="text-stone-400">›</div>
          </button>

          <button className="w-full flex items-center justify-between px-4 py-4 border-b border-stone-100 hover:bg-stone-50 transition">
            <div className="flex items-center gap-4">
              <div className="text-stone-400"><svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
              <div className="text-left">
                <p className="font-bold text-stone-800">Profil Anda</p>
                <p className="text-xs text-stone-500 mt-0.5">Atur profil anda</p>
              </div>
            </div>
            <div className="text-stone-400">›</div>
          </button>

          <button className="w-full flex items-center justify-between px-4 py-4 border-b border-stone-100 hover:bg-stone-50 transition">
            <div className="flex items-center gap-4">
              <div className="text-stone-400"><svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
              <p className="font-bold text-stone-800">Bantuan</p>
            </div>
            <div className="text-stone-400">›</div>
          </button>

          <button onClick={() => { logout(); navigate('/home'); }} className="w-full flex items-center justify-between px-4 py-4 border-b border-stone-100 hover:bg-red-50 transition mt-2">
            <div className="flex items-center gap-4">
              <div className="text-red-500"><svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></div>
              <p className="font-bold text-red-600">Keluar</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Render sub-pages (Pesanan, Kontrak, Sengketa) with a back button
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 min-h-screen">
      <button onClick={() => setActiveMenu('menu')} className="mb-4 inline-flex items-center gap-2 text-stone-500 hover:text-teal-700 font-medium">
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Kembali ke Akun Saya
      </button>

      <h1 className="font-display text-2xl font-bold text-stone-900 mb-6 capitalize">
        {activeMenu === 'pesanan' ? 'Pesanan Saya' : activeMenu === 'kontrak' ? 'Kontrak Berulang' : 'Sengketa & Komplain'}
      </h1>

      {activeMenu === 'pesanan' && <PesananTab token={token} sengketa={sengketa} setSengketa={setSengketa} setSengketaForm={setSengketaForm} ajukanSengketa={ajukanSengketa} />}
      {activeMenu === 'kontrak' && <KontrakTab />}
      {activeMenu === 'sengketa' && (
        <div className="space-y-4">
          {sengketa.length === 0 ? <p className="text-stone-400">Tidak ada sengketa / komplain.</p> : null}
          {sengketa.map(s => (
            <div key={s.id} className="card p-4 border-l-4 border-red-500">
              <div className="flex justify-between items-start mb-2">
                <p className="font-semibold">{s.produk_nama} <span className="text-stone-500 font-normal">({s.pesanan_id})</span></p>
                <span className={`badge ${s.status === 'selesai' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{s.status}</span>
              </div>
              <p className="text-sm text-stone-700 mb-2 font-medium">Alasan: {s.alasan}</p>
              {s.status === 'selesai' && (
                <div className="bg-green-50 p-3 rounded-lg text-sm text-green-800 border border-green-200">
                  <strong>Resolusi:</strong> {s.resolusi}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {sengketaForm.open && (
        <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="font-display font-semibold text-lg mb-2">Ajukan Komplain / Sengketa</h3>
            <form onSubmit={ajukanSengketa} className="space-y-4">
              <div>
                <label className="label">Alasan Komplain</label>
                <textarea rows="3" required value={sengketaForm.alasan} onChange={(e) => setSengketaForm(f => ({...f, alasan: e.target.value}))} className="input" placeholder="Barang tidak sesuai, timbangan kurang..."></textarea>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setSengketaForm({ open: false })} className="btn-secondary flex-1">Batal</button>
                <button type="submit" className="btn-primary flex-1 !bg-red-600 !border-red-600">Ajukan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
