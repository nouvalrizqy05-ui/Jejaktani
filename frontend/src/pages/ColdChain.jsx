import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDateTime } from '../utils.js';
import { Thermometer, AlertTriangle, CheckCircle, Droplets } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';

export default function ColdChain() {
  const { id } = useParams(); // produk id
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getColdChain(id, token)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id, token]);

  if (loading) return <div className="text-center py-20 text-stone-500">Memuat data sensor...</div>;
  if (!data) return <div className="text-center py-20 text-red-500">Gagal memuat atau tidak ada akses.</div>;

  const { produk, resiko, logs, prediksi_sisa_umur_simpan_hari } = data;
  const latestLog = logs[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/admin" className="text-teal-700 hover:underline text-sm mb-2 inline-block">&larr; Kembali</Link>
        <h1 className="font-display text-2xl font-bold text-stone-900">Cold Chain Monitoring (AI)</h1>
        <p className="text-stone-500">Pemantauan suhu & kelembapan real-time untuk {produk.nama}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="card p-5 bg-teal-50 border-teal-200">
          <div className="flex items-center gap-3 mb-2">
            <Thermometer className="w-5 h-5 text-teal-700" />
            <h3 className="font-semibold text-teal-900">Suhu Terakhir</h3>
          </div>
          <p className="text-3xl font-display font-bold text-teal-700">{latestLog ? latestLog.suhu_celcius : '-'}°C</p>
          <p className="text-xs text-teal-600 mt-1">{latestLog ? formatDateTime(latestLog.waktu) : ''}</p>
        </div>

        <div className="card p-5 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <Droplets className="w-5 h-5 text-blue-700" />
            <h3 className="font-semibold text-blue-900">Kelembapan</h3>
          </div>
          <p className="text-3xl font-display font-bold text-blue-700">{latestLog?.kelembapan ? `${latestLog.kelembapan}%` : '-'}</p>
        </div>

        <div className={`card p-5 border ${resiko === 'Rendah' ? 'bg-green-50 border-green-200' : resiko === 'Sedang' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-3 mb-2">
            {resiko === 'Rendah' ? <CheckCircle className="w-5 h-5 text-green-700" /> : <AlertTriangle className="w-5 h-5 text-red-700" />}
            <h3 className="font-semibold text-stone-900">Risiko Kerusakan</h3>
          </div>
          <p className="text-xl font-display font-bold text-stone-900">{resiko}</p>
          <p className="text-sm mt-1">Sisa umur: {prediksi_sisa_umur_simpan_hari} hari</p>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-bold text-stone-900 mb-4">Riwayat Sensor</h3>
        {logs.length === 0 ? (
          <p className="text-stone-500">Belum ada data sensor.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-sm text-stone-500">
                  <th className="pb-2 font-medium">Waktu</th>
                  <th className="pb-2 font-medium">Suhu</th>
                  <th className="pb-2 font-medium">Kelembapan</th>
                  <th className="pb-2 font-medium">Kondisi</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-stone-100">
                    <td className="py-2 text-stone-600">{formatDateTime(log.waktu)}</td>
                    <td className="py-2 font-semibold text-stone-900">{log.suhu_celcius}°C</td>
                    <td className="py-2 text-stone-600">{log.kelembapan ? `${log.kelembapan}%` : '-'}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${log.kondisi === 'normal' ? 'bg-green-100 text-green-800' : log.kondisi === 'peringatan' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {log.kondisi}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
