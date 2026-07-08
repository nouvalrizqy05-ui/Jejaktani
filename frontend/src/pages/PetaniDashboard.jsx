import { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatRupiah, STAGE_LABELS } from '../utils.js';
import TrustStars from '../components/TrustStars.jsx';
import ProductImage from '../components/ProductImage.jsx';

const STAGE_FLOW = ['panen', 'grading', 'gudang', 'dipasarkan', 'habis'];
const KATEGORI_OPTIONS = ['Sembako', 'Sayur', 'Bumbu masak', 'Buah', 'Telur & Unggas', 'Ikan', 'Daging', 'Kopi', 'Organik'];
const IMG_BY_KATEGORI = {
  'Sembako': 'https://images.unsplash.com/photo-1586201375761-83865001e8ac?auto=format&fit=crop&q=80&w=400',
  'Sayur': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=400',
  'Bumbu masak': 'https://images.unsplash.com/photo-1615485500704-8e990f9900f1?auto=format&fit=crop&q=80&w=400',
  'Buah': 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&q=80&w=400',
  'Telur & Unggas': 'https://images.unsplash.com/photo-1569288052389-dac9b5104005?auto=format&fit=crop&q=80&w=400',
  'Ikan': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=400',
  'Daging': 'https://images.unsplash.com/photo-1588168946866-a4f0e4d35eb7?auto=format&fit=crop&q=80&w=400',
  'Kopi': 'https://images.unsplash.com/photo-1447933601403-56dc2584c3d6?auto=format&fit=crop&q=80&w=400',
  'Organik': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=400',
};

export default function PetaniDashboard() {
  const { showToast } = useToast();
  const { token, user } = useAuth();
  const [data, setData] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nama: '', kategori: 'Beras', grade: 'A', jumlah_kg: '', harga_per_kg: '', komoditas: '', deskripsi: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  
  const [ratingModal, setRatingModal] = useState({ open: false, pesananId: null, targetId: null, nama: '' });
  const [ratingSkor, setRatingSkor] = useState(5);
  const [ratingKomentar, setRatingKomentar] = useState('');

  const load = () => api.petaniDashboard(token).then(setData);
  useEffect(() => { load(); }, [token]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.createProduk({
        ...form,
        komoditas: form.komoditas || form.kategori,
        jumlah_kg: Number(form.jumlah_kg),
        harga_per_kg: Number(form.harga_per_kg),
        foto_emoji: IMG_BY_KATEGORI[form.kategori] || IMG_BY_KATEGORI['Sembako'],
      }, token);
      setShowForm(false);
      setForm({ nama: '', kategori: 'Beras', grade: 'A', jumlah_kg: '', harga_per_kg: '', komoditas: '', deskripsi: '' });
      setAiResult(null);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAIGrading = async () => {
    setAiLoading(true);
    setAiResult(null);
    try {
      // Dummy image payload just to satisfy API
      const res = await api.aiGrading({ image_data: 'dummy_base64_image', komoditas: form.kategori }, token);
      setAiResult(res);
      setForm(f => ({ ...f, grade: res.grade }));
    } catch (e) {
      showToast(e.message, 'info');
    } finally {
      setAiLoading(false);
    }
  };

  const advanceStatus = async (produk) => {
    const idx = STAGE_FLOW.indexOf(produk.status);
    const next = STAGE_FLOW[idx + 1];
    if (!next) return;
    await api.updateProdukStatus(produk.id, { status: next, catatan: `Diperbarui manual oleh petani` }, token);
    load();
  };

  const handleRate = async (e) => {
    e.preventDefault();
    try {
      await api.createRating({
        pesanan_id: ratingModal.pesananId,
        untuk_user_id: ratingModal.targetId,
        skor: ratingSkor,
        komentar: ratingKomentar
      }, token);
      setRatingModal({ open: false, pesananId: null, targetId: null, nama: '' });
      load();
    } catch (err) {
      showToast(err.message, 'info');
    }
  };

  if (!data) return <div className="max-w-5xl mx-auto px-4 py-24 text-center text-stone-400">Memuat dashboard...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-semibold text-stone-900">Halo, {user.nama.split(' ')[0]} 👋</h1>
          <p className="text-stone-500 text-sm mt-1">{data.petani.desa}</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary">
          {showForm ? 'Batal' : '+ Catat Hasil Panen'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          ['Produk aktif', data.ringkasan.jumlah_produk_aktif],
          ['Total terjual', `${data.ringkasan.total_terjual_kg} kg`],
          ['Total pendapatan', formatRupiah(data.ringkasan.total_pendapatan)],
          ['Skor kepercayaan', data.ringkasan.trust.rata_rata ? `${data.ringkasan.trust.rata_rata} / 5` : '-'],
        ].map(([label, value]) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-stone-500">{label}</p>
            <p className="font-display text-xl font-semibold text-stone-900 mt-1">{value}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="card p-6 mb-8 space-y-4">
          <h2 className="font-display font-semibold text-stone-900">Catat Hasil Panen Baru</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nama produk</label>
              <input required value={form.nama} onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))} className="input" placeholder="Beras Pandanwangi Premium" />
            </div>
            <div>
              <label className="label">Kategori</label>
              <select value={form.kategori} onChange={(e) => setForm((f) => ({ ...f, kategori: e.target.value }))} className="input">
                {KATEGORI_OPTIONS.map((k) => <option key={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Grade kualitas</label>
              <div className="flex gap-2">
                <select value={form.grade} onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))} className="input flex-1">
                  <option value="A">A &mdash; Premium</option>
                  <option value="B">B &mdash; Standar</option>
                  <option value="C">C &mdash; Ekonomis</option>
                </select>
                <button type="button" onClick={handleAIGrading} disabled={aiLoading} className="btn-secondary !text-xs !py-0 !px-3 shrink-0 whitespace-nowrap">
                  {aiLoading ? 'Menganalisis...' : '🤖 AI Grading (Foto)'}
                </button>
              </div>
              {aiResult && (
                <div className="mt-2 p-2 bg-teal-50 border border-teal-100 rounded text-xs text-teal-800">
                  <strong>Skor Kualitas CV: {aiResult.skor_kualitas}/100</strong><br/>
                  {aiResult.analisis}
                </div>
              )}
            </div>
            <div>
              <label className="label">Jumlah panen (kg)</label>
              <input required type="number" min="1" value={form.jumlah_kg} onChange={(e) => setForm((f) => ({ ...f, jumlah_kg: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="label">Harga jual per kg (Rp)</label>
              <input required type="number" min="1" value={form.harga_per_kg} onChange={(e) => setForm((f) => ({ ...f, harga_per_kg: e.target.value }))} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Deskripsi singkat</label>
            <textarea value={form.deskripsi} onChange={(e) => setForm((f) => ({ ...f, deskripsi: e.target.value }))} rows={2} className="input" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button disabled={saving} className="btn-primary">{saving ? 'Menyimpan...' : 'Simpan & Buat Jejak QR'}</button>
        </form>
      )}

      <h2 className="font-display text-xl font-semibold text-stone-900 mb-4">Produk Saya</h2>
      <div className="space-y-3">
        {data.produk.length === 0 && <p className="text-stone-400 text-sm">Belum ada produk yang dicatat.</p>}
        {data.produk.map((p) => (
          <div key={p.id} className="card p-4 flex flex-wrap items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 overflow-hidden flex items-center justify-center"><ProductImage src={p.foto_emoji} alt={p.nama} size="sm" className="w-full h-full" /></div>
            <div className="flex-1 min-w-[180px]">
              <p className="font-display font-semibold text-stone-900">{p.nama}</p>
              <p className="text-xs text-stone-500">{p.jumlah_terjual_kg} / {p.jumlah_kg} kg terjual &bull; {formatRupiah(p.harga_per_kg)}/kg</p>
            </div>
            <span className="badge bg-teal-50 text-teal-800">{STAGE_LABELS[p.status]}</span>
            {STAGE_FLOW.indexOf(p.status) < STAGE_FLOW.length - 1 && (
              <button onClick={() => advanceStatus(p)} className="btn-secondary !py-1.5 text-xs">
                Tandai: {STAGE_LABELS[STAGE_FLOW[STAGE_FLOW.indexOf(p.status) + 1]]}
              </button>
            )}
          </div>
        ))}
      </div>

      {data.pesanan_selesai && data.pesanan_selesai.length > 0 && (
        <>
          <h2 className="font-display text-xl font-semibold text-stone-900 mb-4 mt-12">Pesanan Selesai (Beri Penilaian Buyer)</h2>
          <div className="space-y-3">
            {data.pesanan_selesai.map((pesanan) => (
              <div key={pesanan.id} className="card p-4 flex flex-wrap justify-between items-center gap-4">
                <div>
                  <p className="font-display font-semibold text-stone-900">{pesanan.buyer_nama}</p>
                  <p className="text-sm text-stone-500">Membeli {pesanan.jumlah_kg} kg {pesanan.produk_nama}</p>
                </div>
                <button 
                  onClick={() => setRatingModal({ open: true, pesananId: pesanan.id, targetId: pesanan.buyer_user_id, nama: pesanan.buyer_nama })}
                  className="btn-secondary !py-1.5 !text-sm"
                >
                  ⭐ Nilai Buyer
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {ratingModal.open && (
        <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="font-display font-semibold text-lg mb-2">Nilai {ratingModal.nama}</h3>
            <p className="text-sm text-stone-500 mb-4">Berikan skor kepercayaan untuk pembeli ini.</p>
            <form onSubmit={handleRate} className="space-y-4">
              <div>
                <label className="label">Skor (1-5)</label>
                <input type="number" min="1" max="5" required value={ratingSkor} onChange={(e) => setRatingSkor(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Komentar</label>
                <textarea rows="2" value={ratingKomentar} onChange={(e) => setRatingKomentar(e.target.value)} className="input" placeholder="Opsional..."></textarea>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setRatingModal({ open: false })} className="btn-secondary flex-1">Batal</button>
                <button type="submit" className="btn-primary flex-1">Kirim</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
