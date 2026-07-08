import { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext.jsx';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatRupiah, formatDateTime, STATUS_PESANAN_LABELS } from '../utils.js';

export default function AdminDashboard() {
  const { showToast } = useToast();
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [pesanan, setPesanan] = useState([]);
  const [gudang, setGudang] = useState([]);
  const [armada, setArmada] = useState([]);
  const [petaniList, setPetaniList] = useState([]);
  const [sengketa, setSengketa] = useState([]);
  const [stokGudang, setStokGudang] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ringkasan');

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.adminOverview(token);
        setData(res);
        const [psn, gdg, arm, ptn, sgk, stk] = await Promise.all([
          api.adminPesanan(token),
          api.adminGudang(token),
          api.adminArmada(token),
          api.adminPetani(token),
          api.adminSengketa(token),
          api.adminGudangStok(token)
        ]);
        setPesanan(psn);
        setGudang(gdg);
        setArmada(arm);
        setPetaniList(ptn);
        setSengketa(sgk);
        setStokGudang(stk);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [token]);

  const handleResolveSengketa = async (id) => {
    const resolusi = prompt("Masukkan resolusi untuk sengketa ini:");
    if (!resolusi) return;
    const refund = confirm("Apakah pesanan ini harus dibatalkan (refund dana)?");
    try {
      await api.resolusiSengketa(id, { resolusi, refund_dana: refund }, token);
      const sgk = await api.adminSengketa(token);
      setSengketa(sgk);
      showToast('Sengketa diselesaikan.', 'info');
    } catch(e) {
      showToast(e.message, 'info');
    }
  };

  if (loading || !data) return <div className="max-w-5xl mx-auto px-4 py-24 text-center text-stone-400">Memuat dashboard admin...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-stone-900 mb-2">Dashboard Operasional</h1>
      <p className="text-stone-500 text-sm mb-8">Pemantauan platform Jejak Tani secara menyeluruh.</p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          ['Total Petani', data.totalPetani],
          ['Total Buyer', data.totalBuyer],
          ['Total Produk', data.totalProduk],
          ['Total Pesanan', data.totalPesanan],
          ['GMV', formatRupiah(data.gmv)],
        ].map(([label, value]) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-stone-500">{label}</p>
            <p className="font-display text-lg font-semibold text-stone-900 mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-10">
        <h2 className="text-xl font-bold text-stone-900 mb-4">Fitur Operasional</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link to="/admin/rute" className="card p-5 hover:bg-stone-50 transition border border-stone-200">
            <h3 className="font-semibold text-lg text-teal-700 flex items-center gap-2">🚚 Optimasi Rute Armada</h3>
            <p className="text-sm text-stone-500 mt-2">Kalkulasi rute pengiriman berdasarkan jarak terdekat (Smart Routing).</p>
          </Link>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['ringkasan', 'pesanan', 'gudang & armada', 'stok gudang', 'petani', 'sengketa'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${tab === t ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)} {t === 'sengketa' && sengketa.filter(s => s.status==='pending').length > 0 ? `(${sengketa.filter(s => s.status==='pending').length})` : ''}
          </button>
        ))}
      </div>

      {tab === 'ringkasan' && (
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="card p-5">
            <h3 className="font-display font-semibold text-stone-900 mb-3">Status Pesanan</h3>
            <ul className="space-y-2">
              {data.pesananPerStatus.map((s) => (
                <li key={s.status} className="flex justify-between text-sm">
                  <span className="text-stone-600">{STATUS_PESANAN_LABELS[s.status] || s.status}</span>
                  <span className="font-semibold text-stone-900">{s.n}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-5">
            <h3 className="font-display font-semibold text-stone-900 mb-3">Status Produk</h3>
            <ul className="space-y-2">
              {data.produkPerStatus.map((s) => (
                <li key={s.status} className="flex justify-between text-sm">
                  <span className="text-stone-600 capitalize">{s.status}</span>
                  <span className="font-semibold text-stone-900">{s.n}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-stone-400 mt-3">Skor kepercayaan rata-rata platform: {data.trustRataRata ?? '-'} / 5</p>
          </div>
        </div>
      )}

      {tab === 'pesanan' && (
        <div className="space-y-2">
          {pesanan.map((p) => (
            <div key={p.id} className="card p-4 flex flex-wrap items-center gap-4 text-sm">
              <span className="font-medium text-stone-900 flex-1 min-w-[140px]">{p.produk_nama}</span>
              <span className="text-stone-500">{p.buyer_nama}{p.nama_usaha ? ` (${p.nama_usaha})` : ''}</span>
              <span className="text-stone-500">{p.jumlah_kg} kg</span>
              <span className="font-semibold text-stone-900">{formatRupiah(p.harga_total)}</span>
              <span className="badge bg-teal-50 text-teal-800">{STATUS_PESANAN_LABELS[p.status]}</span>
              <span className="text-xs text-stone-400">{formatDateTime(p.tanggal_pesan)}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'gudang & armada' && (
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <h3 className="font-display font-semibold text-stone-900 mb-3">Gudang Agregasi</h3>
            <div className="space-y-2">
              {gudang.map((g) => (
                <div key={g.id} className="card p-4">
                  <p className="font-medium text-stone-900">{g.nama}</p>
                  <p className="text-xs text-stone-500">{g.lokasi}</p>
                  <div className="mt-2 h-2 rounded-full bg-stone-100 overflow-hidden">
                    <div className="h-full bg-teal-600" style={{ width: `${Math.min(100, (g.kapasitas_terpakai_ton / g.kapasitas_ton) * 100)}%` }} />
                  </div>
                  <p className="text-xs text-stone-400 mt-1">{g.kapasitas_terpakai_ton} / {g.kapasitas_ton} ton</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-display font-semibold text-stone-900 mb-3">Armada</h3>
            <div className="space-y-2">
              {armada.map((a) => (
                <div key={a.id} className="card p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-stone-900">{a.jenis_kendaraan}</p>
                    <p className="text-xs text-stone-500">{a.plat_nomor}</p>
                  </div>
                  <span className="badge bg-leaf-100 text-leaf-800 capitalize">{a.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'stok gudang' && (
        <div>
          <h2 className="text-xl font-bold text-stone-900 mb-4">Manajemen Stok Multi-Gudang (Batch FIFO/FEFO)</h2>
          <div className="space-y-4">
            {stokGudang.length === 0 && <p className="text-stone-500">Belum ada stok di gudang manapun.</p>}
            {stokGudang.map(s => (
              <div key={s.id} className="card p-4 border-l-4 border-teal-500 flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-lg text-stone-900">
                    <Link to={`/admin/cold-chain/${s.produk_id}`} className="hover:text-teal-700 hover:underline">{s.produk_nama}</Link>
                    <span className="text-xs bg-stone-100 px-2 py-0.5 rounded-full text-stone-600 ml-2">Grade {s.grade}</span>
                  </h3>
                  <div className="text-sm text-stone-600 mt-2 space-y-1">
                    <p>📍 Lokasi: <strong>{s.gudang_nama}</strong></p>
                    <p>📦 Batch: <span className="font-mono bg-stone-100 px-1 rounded">{s.batch_no}</span></p>
                    <p>🕒 Tgl Masuk: {formatDateTime(s.tanggal_masuk).split(' ')[0]} | ⚠️ Exp: {s.tanggal_kadaluarsa || '-'}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <div className="text-2xl font-display font-bold text-teal-700">{s.jumlah_kg} <span className="text-sm font-normal text-stone-500">kg</span></div>
                  <button onClick={async () => {
                    const destGudang = prompt("Masukkan ID Gudang Tujuan (lihat di tab Gudang):");
                    if (!destGudang) return;
                    const qty = prompt(`Masukkan jumlah transfer (maks ${s.jumlah_kg} kg):`);
                    if (!qty || isNaN(qty) || qty <= 0) return;
                    try {
                      await api.transferStok({ stok_id: s.id, gudang_tujuan_id: destGudang, jumlah_transfer_kg: Number(qty) }, token);
                      const stk = await api.adminGudangStok(token);
                      setStokGudang(stk);
                      showToast('Transfer stok berhasil!', 'info');
                    } catch(e) { showToast(e.message, 'info'); }
                  }} className="btn-secondary !text-xs !py-1 mt-2">Transfer Antar Gudang</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'petani' && (
        <div>
          <h2 className="text-xl font-bold text-stone-900 mb-4">Petani & Lahan</h2>
          <div className="space-y-3">
            {petaniList.map((petani) => (
              <div key={petani.id} className="p-4 border border-stone-100 rounded-xl flex flex-wrap justify-between gap-4 items-center">
                <div>
                  <p className="font-semibold text-stone-900">{petani.user_nama}</p>
                  <p className="text-sm text-stone-500">NIK: {petani.nik} &bull; {petani.desa}</p>
                </div>
                <div className="text-sm text-stone-500 text-right">
                  {petani.total_lahan_ha} Ha &bull; {petani.komoditas_utama}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'sengketa' && (
        <div>
          <h2 className="text-xl font-bold text-stone-900 mb-4">Resolusi Sengketa</h2>
          <div className="space-y-3">
            {sengketa.length === 0 && <p className="text-stone-500">Tidak ada sengketa.</p>}
            {sengketa.map(s => (
              <div key={s.id} className="p-4 border border-stone-200 rounded-xl">
                <div className="flex justify-between mb-2">
                  <p className="font-semibold text-stone-900">Pesanan: {s.produk_nama}</p>
                  <span className={`badge ${s.status === 'selesai' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{s.status}</span>
                </div>
                <p className="text-sm text-stone-500 mb-2"><strong>Pelapor:</strong> {s.pelapor}</p>
                <p className="text-sm text-stone-700 bg-stone-50 p-3 rounded-lg border border-stone-100 mb-3">{s.alasan}</p>
                
                {s.status === 'pending' ? (
                  <button onClick={() => handleResolveSengketa(s.id)} className="btn-primary !py-1 text-sm">Selesaikan Sengketa</button>
                ) : (
                  <p className="text-sm text-green-700"><strong>Resolusi:</strong> {s.resolusi}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
