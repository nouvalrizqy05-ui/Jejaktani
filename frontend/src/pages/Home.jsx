import { useEffect, useState, useRef } from 'react';
import { useToast } from '../context/ToastContext.jsx';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import ProductImage from '../components/ProductImage.jsx';
import { api } from '../api.js';
import { MapPin, ChevronDown, Heart, SearchX, X, Check } from 'lucide-react';
import { formatRupiah } from '../utils.js';
import { useCart } from '../context/CartContext.jsx';

const CATEGORIES = [
  { name: 'Semua Produk', emoji: '🎛️' },
  { name: 'Freshtival', emoji: '🎉' },
  { name: 'Sayur', emoji: '🥬' },
  { name: 'Buah', emoji: '🍎' },
  { name: 'Sembako', emoji: '🍚' },
  { name: 'Telur & Unggas', emoji: '🥚' },
  { name: 'Ikan', emoji: '🐟' },
  { name: 'Daging', emoji: '🥩' },
  { name: 'Bumbu masak', emoji: '🧅' },
  { name: 'Kopi', emoji: '☕' },
  { name: 'Organik', emoji: '🌱' },
];

const INSPIRASI = [
  { title: 'Pedas Gurih Terong Balado Khas Nusantara', desc: 'Siapa yang suka makan terong balado? Makanan khas Indonesia ini...', img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=300' },
  { title: 'Makin Happy dengan Salad Buah', desc: 'Siapa yang pengen sarapan mini? Rasa segar dari buah buahan...', img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=300' },
  { title: 'Ayam Goreng Lengkuas Gurih', desc: 'Resep andalan keluarga untuk makan siang yang nikmat tiada tara...', img: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&q=80&w=300' }
];

const BANNERS = [
  {
    id: 1,
    tag: 'Panen Langsung',
    title: 'Dukung Petani,\nNikmati Segarnya.',
    desc: 'Potong jalur distribusi tengkulak. Beli langsung dari ladang dengan transparansi penuh.',
    img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
    bg: 'from-earth-900 via-teal-900 to-teal-950',
    btn: 'Mulai Belanja',
    filter: 'Semua Produk'
  },
  {
    id: 2,
    tag: 'Freshtival',
    title: 'Panen Spesial\nHarga Spesial.',
    desc: 'Nikmati hasil panen segar dengan harga terbaik langsung dari petani mitra kami.',
    img: 'https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&q=80&w=600',
    bg: 'from-harvest-600 via-harvest-500 to-teal-800',
    btn: 'Lihat Promo',
    filter: 'Freshtival'
  },
  {
    id: 3,
    tag: 'Jejak Transparan',
    title: 'Harga Adil,\nPetani Sejahtera.',
    desc: 'Setiap Rupiah yang Anda belanjakan memberikan dampak langsung pada kesejahteraan petani.',
    img: 'https://images.unsplash.com/photo-1592982537447-6f296d9b4b0e?auto=format&fit=crop&q=80&w=600',
    bg: 'from-teal-800 via-earth-800 to-earth-900',
    btn: 'Pelajari Lanjut',
    filter: 'Semua Produk'
  }
];

const LOCATIONS = ['Cakung - Kota Jakarta Timur', 'Menteng - Jakarta Pusat', 'Kebon Jeruk - Jakarta Barat', 'Depok - Jawa Barat', 'Serpong - Tangerang Selatan'];
const SERVICES = ['Reguler (2-3 Hari)', 'Next Day', 'Same Day (Area Terbatas)'];

import { useFavorite } from '../context/FavoriteContext.jsx';

function HomeProductCard({ produk, onAddToCart }) {
  const { toggleFavorite, isFavorite } = useFavorite();
  const loved = isFavorite(produk.id);
  const oldPrice = produk.harga_per_kg * 1.25;

  return (
    <div className="card w-40 md:w-48 shrink-0 snap-start relative flex flex-col h-full group bg-white border border-earth-200">
      <button 
        onClick={(e) => { e.preventDefault(); toggleFavorite(produk); }} 
        className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-md rounded-full shadow-sm z-10 transition-transform active:scale-90 hover:bg-white"
      >
        <Heart className={`w-4 h-4 transition-colors ${loved ? 'fill-red-500 text-red-500' : 'text-earth-400 hover:text-earth-600'}`} />
      </button>
      
      <Link to={`/produk/${produk.id}`} className="block relative aspect-square bg-gradient-to-br from-earth-50 to-teal-50 overflow-hidden flex items-center justify-center group-hover:opacity-90 transition-opacity">
         <ProductImage src={produk.foto_emoji} alt={produk.nama} size="lg" className="rounded-t-2xl group-hover:scale-105 transition-transform duration-500" />
         {produk.grade === 'A' && (
           <div className="absolute top-2 left-2 bg-gradient-to-r from-harvest-400 to-harvest-600 text-white font-bold text-[10px] px-2 py-0.5 rounded shadow-sm">
             Premium
           </div>
         )}
         <div className="absolute bottom-2 left-2 bg-red-100/90 backdrop-blur text-red-600 font-bold text-[10px] px-2 py-0.5 rounded border border-red-200">
           -20%
         </div>
      </Link>
      
      <div className="p-3 flex flex-col grow bg-white">
         <p className="text-[10px] text-teal-700 font-bold uppercase truncate tracking-wider">{produk.petani?.desa || 'LOKAL'}</p>
         <Link to={`/produk/${produk.id}`} className="font-semibold text-earth-900 text-sm leading-snug line-clamp-2 mt-1 mb-1 group-hover:text-teal-700 transition-colors">
           {produk.nama}
         </Link>
         <p className="text-[10px] text-earth-400 mb-2 truncate font-medium">Tersedia {produk.jumlah_kg - produk.jumlah_terjual_kg} kg</p>
         
         <div className="mt-auto pt-2 border-t border-earth-100">
           <div className="text-[10px] text-earth-400 line-through font-medium">{formatRupiah(oldPrice)}</div>
           <div className="flex items-end gap-1 mb-3">
             <span className="font-bold text-earth-900 text-base">{formatRupiah(produk.harga_per_kg)}</span>
             <span className="text-[10px] text-earth-500 font-medium">/ kg</span>
           </div>
           
           <button onClick={(e) => { e.preventDefault(); onAddToCart(produk); }} className="w-full py-2 border border-teal-600 text-teal-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-teal-50 transition-all active:scale-95 group-hover:bg-teal-600 group-hover:text-white">
             + Keranjang
           </button>
         </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { showToast } = useToast();
  const [produkList, setProdukList] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  
  // URL Params State
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('search')?.toLowerCase() || '';
  const filterCat = searchParams.get('kategori') || '';

  // Modal States
  const [showLocModal, setShowLocModal] = useState(false);
  const [showSvcModal, setShowSvcModal] = useState(false);
  const [selectedLoc, setSelectedLoc] = useState(LOCATIONS[0]);
  const [selectedSvc, setSelectedSvc] = useState(SERVICES[0]);
  
  // Banner Slider State
  const [activeBanner, setActiveBanner] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBanner(prev => (prev + 1) % BANNERS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setLoading(true);
    api.listProduk({}).then(data => {
      // Apply filters client side for UI responsiveness
      let filtered = data;
      if (searchQuery) {
        filtered = data.filter(p => p.nama.toLowerCase().includes(searchQuery) || p.kategori.toLowerCase().includes(searchQuery));
      }
      if (filterCat && filterCat !== 'Semua Produk') {
        if (filterCat === 'Freshtival') {
          // Fake filter for freshtival
          filtered = filtered.filter(p => p.harga_per_kg < 20000);
        } else {
          filtered = filtered.filter(p => p.kategori.toLowerCase().includes(filterCat.toLowerCase()) || (filterCat === 'Buah' && p.kategori === 'Buah'));
        }
      }
      setProdukList(filtered);
    }).finally(() => setLoading(false));
  }, [searchQuery, filterCat]);

  const handleCategoryClick = (catName) => {
    navigate(`/home?kategori=${encodeURIComponent(catName)}`);
  };

  const isFilteredView = searchQuery !== '' || filterCat !== '';

  const renderModals = () => (
    <>
      {/* Location Modal */}
      {showLocModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-earth-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowLocModal(false)}>
          <div className="bg-white w-full sm:w-96 rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-earth-900">Pilih Area Pengiriman</h3>
              <button onClick={() => setShowLocModal(false)} className="p-2 hover:bg-earth-100 rounded-full"><X className="w-5 h-5 text-earth-500" /></button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {LOCATIONS.map(loc => (
                <button key={loc} onClick={() => { setSelectedLoc(loc); setShowLocModal(false); }} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors ${selectedLoc === loc ? 'border-teal-500 bg-teal-50/50' : 'border-earth-200 hover:border-teal-300'}`}>
                  <span className={`text-sm ${selectedLoc === loc ? 'font-bold text-teal-800' : 'text-earth-700'}`}>{loc}</span>
                  {selectedLoc === loc && <Check className="w-4 h-4 text-teal-600" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Service Modal */}
      {showSvcModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-earth-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowSvcModal(false)}>
          <div className="bg-white w-full sm:w-96 rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-earth-900">Jenis Layanan Logistik</h3>
              <button onClick={() => setShowSvcModal(false)} className="p-2 hover:bg-earth-100 rounded-full"><X className="w-5 h-5 text-earth-500" /></button>
            </div>
            <div className="space-y-3">
              {SERVICES.map(svc => (
                <button key={svc} onClick={() => { setSelectedSvc(svc); setShowSvcModal(false); }} className={`w-full text-left p-4 rounded-xl border transition-all ${selectedSvc === svc ? 'border-teal-500 bg-teal-50/50 shadow-sm' : 'border-earth-200 hover:border-teal-300 hover:bg-earth-50'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`font-bold ${selectedSvc === svc ? 'text-teal-800' : 'text-earth-800'}`}>{svc.split('(')[0]}</span>
                    {selectedSvc === svc && <Check className="w-4 h-4 text-teal-600" />}
                  </div>
                  <p className="text-xs text-earth-500">Estimasi {svc.split('(')[1]?.replace(')','') || 'pengiriman standar'}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (loading) return <div className="text-center py-20 text-earth-400 font-medium text-sm min-h-screen">Memuat katalog Jejak Tani...</div>;

  return (
    <div className="bg-earth-50 min-h-screen w-full pb-10">
      {renderModals()}
      <div className="w-full max-w-7xl mx-auto">
        
        {/* Location & Service Headers (Visible if not filtered deeply) */}
        <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm sticky top-14 md:top-16 z-30 border-b border-earth-200/60">
          <button onClick={() => setShowLocModal(true)} className="flex items-center gap-2 group hover:bg-earth-50 p-1.5 rounded-lg transition-colors">
            <div className="p-1.5 bg-red-50 text-red-500 rounded-full group-hover:bg-red-100 transition-colors">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-[10px] text-earth-500 font-semibold leading-none mb-1 uppercase tracking-wide">Kirim ke</p>
              <p className="text-xs font-bold text-earth-900 leading-none truncate max-w-[150px] md:max-w-[300px]">{selectedLoc}</p>
            </div>
          </button>
          <div className="h-8 w-px bg-earth-200 mx-2"></div>
          <button onClick={() => setShowSvcModal(true)} className="flex items-center justify-end gap-1 group text-right hover:bg-earth-50 p-1.5 rounded-lg transition-colors">
            <div className="text-right">
              <p className="text-[10px] text-earth-500 font-semibold leading-none mb-1 uppercase tracking-wide">Layanan</p>
              <p className="text-xs font-bold text-earth-900 flex items-center justify-end gap-1 leading-none">
                {selectedSvc.split(' ')[0]} <ChevronDown className="w-3 h-3 text-earth-400 group-hover:text-teal-600 transition-colors" />
              </p>
            </div>
          </button>
        </div>

        {isFilteredView ? (
          /* Filtered View (Search / Category) */
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-xl text-earth-900">
                {searchQuery ? `Hasil pencarian untuk "${searchQuery}"` : `Kategori: ${filterCat}`}
              </h2>
              <button onClick={() => navigate('/home')} className="text-sm font-semibold text-teal-600 hover:underline">Bersihkan Filter</button>
            </div>
            
            {produkList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <SearchX className="w-16 h-16 text-earth-300 mb-4" />
                <h3 className="font-bold text-lg text-earth-800 mb-2">Produk tidak ditemukan</h3>
                <p className="text-sm text-earth-500 max-w-md">Coba cari dengan kata kunci lain atau telusuri kategori yang tersedia untuk melihat hasil panen terbaik kami.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {produkList.map(p => (
                  <HomeProductCard key={p.id} produk={p} onAddToCart={(prod) => addItem(prod, 1)} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Default Home View */
          <>
            {/* Banner Carousel */}
            <div className="px-4 md:px-6 pt-3 pb-4">
              <div className="w-full min-h-[16rem] sm:min-h-[20rem] md:h-80 bg-earth-900 rounded-3xl overflow-hidden relative shadow-lg flex items-center group">
                {BANNERS.map((banner, idx) => (
                  <div 
                    key={banner.id} 
                    className={`absolute inset-0 w-full h-full bg-gradient-to-br ${banner.bg} transition-opacity duration-1000 flex items-center ${idx === activeBanner ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                  >
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                    <div className="relative z-10 p-5 md:p-10 text-white w-full sm:max-w-lg md:max-w-xl">
                      <div className="inline-block px-3 py-1 bg-white/10 border border-white/20 text-white text-[10px] md:text-xs font-bold uppercase tracking-wider rounded-full mb-2 md:mb-3 backdrop-blur-sm shadow-sm">{banner.tag}</div>
                      <h2 className="font-display font-black text-2xl sm:text-3xl md:text-5xl leading-tight mb-2 whitespace-pre-line drop-shadow-sm">{banner.title}</h2>
                      <p className="text-white/90 text-xs sm:text-sm mb-4 max-w-xs md:max-w-md leading-relaxed font-medium drop-shadow-sm">{banner.desc}</p>
                      <button 
                        onClick={() => handleCategoryClick(banner.filter)}
                        className="bg-white text-teal-900 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md hover:bg-earth-50 transition-colors"
                      >
                        {banner.btn}
                      </button>
                    </div>
                    {/* Decorative Images */}
                    <div className="absolute right-0 top-0 bottom-0 w-1/2 overflow-hidden hidden sm:block">
                      <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/30 z-10"></div>
                      <img src={banner.img} className="w-full h-full object-cover mix-blend-luminosity opacity-40 scale-105 group-hover:scale-100 transition-transform duration-700" alt="Promo" />
                    </div>
                  </div>
                ))}

                {/* Pagination dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full">
                  {BANNERS.map((_, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setActiveBanner(idx)}
                      className={`h-1.5 rounded-full cursor-pointer transition-all duration-300 ${idx === activeBanner ? 'w-6 bg-white shadow-sm' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
                    ></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Kategori Horizontal Scroll */}
            <div className="mt-4 px-4 md:px-6 py-2">
              <h3 className="font-bold text-earth-900 mb-3 text-sm uppercase tracking-wider">Kategori Panen</h3>
              <div className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar snap-x">
                {CATEGORIES.map((cat) => (
                  <button onClick={() => handleCategoryClick(cat.name)} key={cat.name} className="flex flex-col items-center justify-start w-[72px] shrink-0 snap-start group outline-none">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl mb-2 shadow-sm border border-earth-100 group-hover:border-teal-400 group-hover:bg-teal-50 group-hover:shadow-md transition-all duration-300 group-active:scale-95">
                      {cat.emoji}
                    </div>
                    <span className="text-xs font-semibold text-earth-700 text-center leading-tight line-clamp-2 w-full group-hover:text-teal-800 transition-colors">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Flash Sale Banner */}
            {produkList.length > 0 && (
              <div className="mt-4 bg-gradient-to-r from-teal-800 to-teal-900 py-8 px-4 md:px-6 relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-10"></div>
                <div className="max-w-7xl mx-auto relative z-10">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <h3 className="font-display font-black text-2xl md:text-3xl text-white tracking-wide drop-shadow-sm flex items-center gap-2">
                        PANEN<span className="text-harvest-400">⚡</span>SEGAR
                      </h3>
                      <p className="text-teal-200 text-xs mt-1">Stok terbatas langsung dari kebun hari ini</p>
                    </div>
                    <button onClick={() => navigate('/home?kategori=Semua Produk')} className="hidden sm:block text-sm font-semibold bg-white/10 text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/10">Lihat Semua</button>
                  </div>
                  <div className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar snap-x">
                    {produkList.slice(0, 6).map(p => (
                      <HomeProductCard key={p.id} produk={p} onAddToCart={(prod) => addItem(prod, 1)} />
                    ))}
                  </div>
                  <button onClick={() => navigate('/home?kategori=Semua Produk')} className="sm:hidden w-full mt-2 text-sm font-semibold bg-white/10 text-white px-4 py-3 rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/10">Lihat Semua Panen</button>
                </div>
              </div>
            )}

            {/* Inspirasi / Artikel Ringan */}
            <div className="mt-8 px-4 md:px-6 py-4">
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-bold text-earth-900 text-lg">Inspirasi Dapur</h3>
                <button onClick={() => showToast('Fitur Blog Edukasi akan segera hadir di versi produksi!', 'info')} className="text-sm text-teal-600 font-semibold hover:underline">Baca Blog</button>
              </div>
              <div className="flex overflow-x-auto gap-5 pb-4 hide-scrollbar snap-x">
                {INSPIRASI.map((ins, i) => (
                  <div key={i} className="w-[280px] md:w-[320px] shrink-0 snap-start bg-white rounded-2xl overflow-hidden shadow-sm border border-earth-100 group cursor-pointer hover:shadow-md transition-shadow">
                    <div className="w-full h-40 relative overflow-hidden bg-earth-200">
                      <img src={ins.img} alt={ins.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-earth-900 text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm border border-white/50">
                        Resep
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-bold text-earth-900 text-base mb-1.5 line-clamp-1 group-hover:text-teal-700 transition-colors">{ins.title}</h4>
                      <p className="text-xs text-earth-500 line-clamp-2 leading-relaxed">{ins.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rekomendasi Grid */}
            <div className="mt-6 mb-12 px-4 md:px-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-bold text-earth-900 text-lg">Rekomendasi Spesial</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {produkList.slice(2, 10).map(p => (
                  <HomeProductCard key={p.id} produk={p} onAddToCart={(prod) => addItem(prod, 1)} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
