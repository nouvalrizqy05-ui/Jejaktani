import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useFavorite } from '../context/FavoriteContext.jsx';
import { Search, Heart, Bell, User, LogOut, ChevronDown, Settings } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const { favorites } = useFavorite();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Mock notifications state
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Promo Freshtival! Diskon 20%', desc: 'Gunakan kode FRESH20 saat checkout.', time: '2 jam yang lalu', read: true },
    { id: 2, title: 'Stok Beras Cianjur Tersedia', desc: 'Petani mitra kami baru saja memanen beras setra ramos. Cek sekarang!', time: 'Baru saja', read: false }
  ]);
  const unreadCount = notifications.filter(n => !n.read).length;

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const dashboardPath = user?.role === 'petani' ? '/petani' : user?.role === 'admin' ? '/admin' : '/akun';

  // Extract search query from URL if on home
  useEffect(() => {
    if (location.pathname === '/home') {
      const params = new URLSearchParams(location.search);
      setSearchQuery(params.get('search') || '');
    } else {
      setSearchQuery('');
    }
  }, [location]);

  // Click outside listener for dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) setShowProfileMenu(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifications(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/home?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/home');
    }
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 bg-teal-800/95 backdrop-blur-md shadow-md transition-all duration-300">
      <div className="max-w-[1400px] mx-auto px-4 h-14 md:h-16 flex items-center justify-between gap-2 md:gap-6">
        {/* Logo */}
        <Link to="/home" aria-label="Beranda Jejak Tani" className="shrink-0 flex items-center justify-center hover:opacity-90 transition-opacity">
          <Logo size={36} withText={false} />
          <span className="hidden lg:block ml-2 text-white font-display font-bold text-xl tracking-tight">Jejak Tani</span>
        </Link>
        
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 relative max-w-2xl group mx-1 md:mx-0">
          <Search className="absolute left-2.5 md:left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-teal-700/60 group-focus-within:text-teal-600 transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari panen..."
            className="w-full bg-white/95 text-earth-800 rounded-full py-1.5 md:py-2.5 pl-8 md:pl-10 pr-3 md:pr-4 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-harvest-400 focus:bg-white shadow-inner transition-all duration-300 placeholder:text-earth-400"
          />
        </form>

        {/* Icons (Right) */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0 text-white">
          {/* Favorite */}
          <Link to="/favorit" aria-label="Favorit" className="flex p-2 hover:bg-white/10 rounded-full transition-colors relative group">
            <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {favorites.length > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                {favorites.length}
              </span>
            )}
          </Link>
          
          {/* Notification */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notifikasi" 
              className="p-2 hover:bg-white/10 rounded-full transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-harvest-400 rounded-full border border-teal-800"></span>
              )}
            </button>
            
            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-earth-100 overflow-hidden animate-fade-in z-50">
                <div className="p-4 border-b border-earth-100 flex justify-between items-center bg-earth-50">
                  <h3 className="font-bold text-earth-800">Notifikasi</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
                      className="text-xs text-teal-600 font-semibold hover:underline"
                    >
                      Tandai dibaca
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      onClick={() => {
                        setNotifications(notifications.map(n => n.id === notif.id ? { ...n, read: true } : n));
                        setShowNotifications(false);
                      }}
                      className={`p-4 border-b border-earth-50 hover:bg-earth-50 cursor-pointer transition-colors relative ${notif.read ? 'opacity-60' : ''}`}
                    >
                      {!notif.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500"></div>}
                      <p className={`text-xs mb-1 ${notif.read ? 'text-earth-500' : 'text-teal-600 font-semibold'}`}>{notif.time}</p>
                      <p className={`text-sm ${notif.read ? 'font-semibold text-earth-800' : 'font-bold text-earth-900'}`}>{notif.title}</p>
                      <p className="text-xs text-earth-600 mt-0.5 line-clamp-2">{notif.desc}</p>
                    </div>
                  ))}
                </div>
                <Link to="/home" onClick={() => setShowNotifications(false)} className="block w-full text-center p-3 text-xs font-bold text-teal-600 hover:bg-earth-50 border-t border-earth-100 transition-colors">
                  Lihat Semua
                </Link>
              </div>
            )}
          </div>

          {/* Cart */}
          {user?.role !== 'petani' && user?.role !== 'admin' && (
            <Link to="/keranjang" className="p-2 hover:bg-white/10 rounded-full transition-colors relative group" aria-label="Keranjang">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              {items.length > 0 && (
                <span className="absolute top-0 right-0 bg-harvest-500 text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border border-teal-800 shadow-sm animate-pulse-slow">
                  {items.length}
                </span>
              )}
            </Link>
          )}

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center ml-2 border-l border-white/20 pl-4 relative" ref={profileRef}>
            {user ? (
              <>
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 hover:bg-white/10 py-1.5 px-3 rounded-full transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                    {user.nama.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold max-w-[100px] truncate">{user.nama.split(' ')[0]}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown */}
                {showProfileMenu && (
                  <div className="absolute top-full right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-earth-100 overflow-hidden animate-slide-up z-50">
                    <div className="p-4 border-b border-earth-100 bg-earth-50/50">
                      <p className="font-bold text-earth-900 truncate">{user.nama}</p>
                      <p className="text-xs text-earth-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                        {user.role}
                      </span>
                    </div>
                    <div className="p-2">
                      <Link to={dashboardPath} onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-earth-700 hover:bg-earth-100 hover:text-teal-700 rounded-xl transition-colors font-medium">
                        <User className="w-4 h-4" /> Dashboard Saya
                      </Link>
                      <Link to="/akun/pengaturan" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-earth-700 hover:bg-earth-100 hover:text-teal-700 rounded-xl transition-colors font-medium">
                        <Settings className="w-4 h-4" /> Pengaturan
                      </Link>
                    </div>
                    <div className="p-2 border-t border-earth-100">
                      <button 
                        onClick={() => { logout(); navigate('/'); setShowProfileMenu(false); }} 
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors font-bold"
                      >
                        <LogOut className="w-4 h-4" /> Keluar
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/masuk" className="text-sm font-semibold px-4 py-2 hover:bg-white/10 rounded-full transition-colors">Masuk</Link>
                <Link to="/daftar" className="text-sm font-bold bg-harvest-500 text-white px-5 py-2 rounded-full hover:bg-harvest-400 shadow-md transition-all hover:shadow-lg active:scale-95">Gabung</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
