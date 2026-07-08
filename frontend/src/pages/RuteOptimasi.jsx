import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';

export default function RuteOptimasi() {
  const { token } = useAuth();
  const [rute, setRute] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.adminRute(token);
        setRute(data.rute);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [token]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-stone-900">Optimasi Rute Armada (Smart Routing)</h1>
        <p className="text-stone-500">Mengkalkulasi jarak linear dari titik lokasi lahan/buyer ke gudang pusat untuk efisiensi pengiriman.</p>
      </div>

      {loading ? (
        <div className="text-center py-10">Memuat rute optimal...</div>
      ) : rute.length === 0 ? (
        <div className="card p-10 text-center text-stone-500">Tidak ada pengiriman yang sedang menunggu.</div>
      ) : (
        <div className="space-y-4">
          {rute.map((kirim, idx) => (
            <div key={kirim.id} className="card p-5 flex flex-col md:flex-row justify-between items-start md:items-center border-l-4 border-teal-500">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-stone-800 text-white font-bold w-8 h-8 flex items-center justify-center rounded-full text-sm">
                    #{idx + 1}
                  </span>
                  <h3 className="font-semibold text-lg text-stone-900">{kirim.produk_nama}</h3>
                  <span className="text-sm bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">{kirim.status}</span>
                </div>
                <div className="text-sm text-stone-500 space-y-1">
                  <p>📦 Total muatan: {kirim.jumlah_kg} kg</p>
                  <p>📍 Tujuan: {kirim.catatan_alamat}</p>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0 text-right">
                <div className="text-2xl font-display font-bold text-teal-700">
                  {kirim.jarak_ke_gudang_km} <span className="text-base text-stone-400 font-normal">km dari gudang</span>
                </div>
                <div className="text-sm text-stone-400 mt-1">Armada ID: {kirim.armada_id || 'Belum ditugaskan'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
