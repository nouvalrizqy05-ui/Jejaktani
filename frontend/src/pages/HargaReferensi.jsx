import { useEffect, useState, useMemo } from 'react';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../api.js';
import { formatRupiah, formatDate } from '../utils.js';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RefreshCw } from 'lucide-react';

export default function HargaReferensi() {
  const { showToast } = useToast();
  const [harga, setHarga] = useState([]);
  const [historis, setHistoris] = useState([]);
  const [selectedKomoditas, setSelectedKomoditas] = useState(null);
  const [filterWaktu, setFilterWaktu] = useState('1B');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => { 
    api.listHarga().then(data => {
      setHarga(data);
      if (data.length > 0) setSelectedKomoditas(data[0].komoditas);
    }); 
  }, []);

  useEffect(() => {
    if (selectedKomoditas) {
      api.getHargaHistoris(selectedKomoditas).then(setHistoris);
    }
  }, [selectedKomoditas]);

  const filterOptions = [
    { label: '7 Hari', value: '7H', days: 7 },
    { label: '1 Bulan', value: '1B', days: 30 },
    { label: '3 Bulan', value: '3B', days: 90 },
    { label: '6 Bulan', value: '6B', days: 180 },
    { label: '1 Tahun', value: '1T', days: 365 },
    { label: 'Maks', value: 'MAKS', days: Infinity }
  ];

  const filteredHistoris = useMemo(() => {
    if (!historis.length) return [];
    if (filterWaktu === 'MAKS') return historis;
    
    // Gunakan tanggal terbaru di database sebagai "sekarang"
    const maxDate = new Date(historis[historis.length - 1].tanggal);
    const selectedFilter = filterOptions.find(f => f.value === filterWaktu);
    
    return historis.filter(h => {
      const date = new Date(h.tanggal);
      const diffTime = Math.abs(maxDate - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= selectedFilter.days;
    });
  }, [historis, filterWaktu]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // PERBAIKAN: sebelumnya tombol ini cuma setTimeout 2 detik lalu
      // menampilkan alert "real-time... (Simulasi)" -- kontradiktif dan
      // tidak melakukan apa pun secara nyata (tidak ada pemanggilan API
      // sama sekali). Sekarang benar-benar memuat ulang data dari backend,
      // dengan pesan yang jujur soal sifat datanya: dataset historis PIHPS
      // (via Kaggle, sumber "PIHPS - Bank Indonesia"), bukan feed live --
      // lihat CATATAN-PERBAIKAN.md untuk detail rentang tanggal datanya.
      const data = await api.listHarga();
      setHarga(data);
      if (selectedKomoditas) {
        const hist = await api.getHargaHistoris(selectedKomoditas);
        setHistoris(hist);
      }
      showToast('Data harga dimuat ulang dari database. Sumber: dataset historis PIHPS - Bank Indonesia (bukan feed real-time; lihat tanggal data terakhir di tabel).', 'info');
    } catch (err) {
      showToast('Gagal memuat ulang data harga. Coba lagi.', 'info');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <span className="badge bg-teal-100 text-teal-800">Transparansi Harga</span>
          <h1 className="font-display text-3xl font-semibold text-stone-900 mt-3">Harga Referensi Pasar</h1>
          <p className="text-stone-600 mt-3 leading-relaxed max-w-xl">
            Lihat harga acuan sebelum Anda menjual atau membeli. Data ini membantu memastikan tidak
            ada pihak yang membentuk harga secara sepihak.
          </p>
        </div>
        
        <button 
          onClick={handleSync}
          disabled={isSyncing}
          className="btn btn-secondary self-start flex items-center gap-2 whitespace-nowrap"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Menyinkronkan...' : 'Sinkronisasi PIHPS'}
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-8">
        
        {/* Desktop Sidebar: Daftar Komoditas */}
        <div className="hidden md:block space-y-2 md:col-span-1 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          <h2 className="font-semibold text-stone-900 mb-3 sticky top-0 bg-white z-10 py-1">Komoditas</h2>
          {harga.map((h) => (
            <div 
              key={h.komoditas} 
              onClick={() => setSelectedKomoditas(h.komoditas)}
              className={`card p-4 cursor-pointer transition ${selectedKomoditas === h.komoditas ? 'border-teal-600 bg-teal-50' : 'hover:border-stone-300'}`}
            >
              <p className="font-display font-semibold text-stone-900">{h.komoditas}</p>
              <div className="mt-1 flex justify-between items-end">
                <span className="font-display text-lg font-semibold text-teal-800">{formatRupiah(h.harga_per_kg)}</span>
                <span className="text-xs text-stone-500">Harga Terkini</span>
              </div>
            </div>
          ))}
        </div>

        {/* Main Chart Area */}
        <div className="md:col-span-2 flex flex-col h-full min-h-[450px]">
          {selectedKomoditas && historis.length > 0 && (
            <div className="card p-3 sm:p-6 h-full flex flex-col flex-1 overflow-hidden w-full max-w-[calc(100vw-2rem)] md:max-w-none mx-auto">
              
              {/* Mobile Dropdown: Daftar Komoditas */}
              <div className="md:hidden mb-4 w-full">
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Pilih Komoditas</label>
                <select 
                  value={selectedKomoditas}
                  onChange={(e) => setSelectedKomoditas(e.target.value)}
                  className="block w-full rounded-lg border-stone-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm bg-stone-50 py-2.5 px-3"
                >
                  {harga.map(h => (
                    <option key={h.komoditas} value={h.komoditas}>
                      {h.komoditas} - {formatRupiah(h.harga_per_kg)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-1 w-full">
                <h2 className="font-semibold text-stone-900 hidden md:block truncate">Tren Harga: {selectedKomoditas}</h2>
                <h2 className="font-semibold text-stone-900 md:hidden truncate">Tren Harga Historis</h2>
                <div className="flex bg-stone-100 p-1 rounded-lg overflow-x-auto hide-scrollbar w-full sm:w-auto">
                  {filterOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setFilterWaktu(opt.value)}
                      className={`flex-none px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                        filterWaktu === opt.value 
                          ? 'bg-white text-teal-800 shadow-sm' 
                          : 'text-stone-500 hover:text-stone-900'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-stone-500 mb-6 mt-2 sm:mt-0">Sumber: {historis[0]?.sumber}</p>
              
              <div className="flex-1 min-h-[300px] w-full relative mt-2 overflow-hidden">
                <div className="absolute inset-0 pr-4">
                  <ResponsiveContainer width="95%" height="100%">
                    <LineChart data={filteredHistoris} margin={{ top: 5, right: 10, bottom: 5, left: -25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                      <XAxis 
                        dataKey="tanggal" 
                        tickFormatter={(val) => formatDate(val).slice(0, 6)}
                        tick={{fontSize: 11, fill: '#78716c'}}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                        minTickGap={30}
                      />
                      <YAxis 
                        tickFormatter={(val) => `Rp${val/1000}k`}
                        tick={{fontSize: 11, fill: '#78716c'}}
                        axisLine={false}
                        tickLine={false}
                        domain={['auto', 'auto']}
                        width={60}
                      />
                      <Tooltip 
                        formatter={(value) => [formatRupiah(value), 'Harga']}
                        labelFormatter={(label) => formatDate(label)}
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px'}}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="harga_per_kg" 
                        stroke="#0f766e" 
                        strokeWidth={2} 
                        dot={false}
                        activeDot={{ r: 6, fill: '#0f766e', stroke: '#ccfbf1', strokeWidth: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card p-4 sm:p-5 mt-8 bg-teal-50 text-sm text-teal-800 flex items-start gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
        <p>
          <strong>Data Terintegrasi.</strong> Harga di atas merupakan data riil rata-rata nasional yang ditarik dari Sistem Pusat Informasi Harga Pangan Strategis (PIHPS) Bank Indonesia.
        </p>
      </div>
    </div>
  );
}
