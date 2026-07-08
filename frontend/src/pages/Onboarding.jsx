import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useEffect, useState } from 'react';

const ONBOARDING_SLIDES = [
  {
    title: 'Dari Kita, Untuk Mereka',
    desc: "Berawal dari sebuah keyakinan sederhana bahwa masyarakat yang 'sadar' pertanian memiliki kekuatan untuk mengubah fakta.",
    img: "https://images.unsplash.com/photo-1596199050105-6d5d32222916?auto=format&fit=crop&q=80&w=1200"
  },
  {
    title: 'Panen Langsung Dari Ladang',
    desc: 'Potong jalur distribusi tengkulak. Nikmati hasil bumi segar dengan harga yang adil untuk petani dan pembeli.',
    img: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200"
  },
  {
    title: 'Jejak Tani Transparan',
    desc: 'Lacak dari mana makananmu berasal. Dukung ketahanan pangan lokal dengan setiap transaksi yang kamu lakukan.',
    img: "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&q=80&w=1200"
  }
];

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % ONBOARDING_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between overflow-hidden bg-teal-950">
      {/* Background Images with Crossfade */}
      {ONBOARDING_SLIDES.map((slide, index) => (
        <div 
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
          style={{
            backgroundImage: `url("${slide.img}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      ))}
      
      {/* Overlay gradient teal/green */}
      <div className="absolute inset-0 bg-teal-900/80 mix-blend-multiply z-0"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-teal-500/40 via-teal-900/80 to-teal-950 z-0"></div>

      {/* Top Navbar */}
      <div className="w-full relative z-10 flex justify-end p-6 md:p-8 animate-fade-in">
        <Link to="/masuk" className="text-white font-bold text-sm tracking-wider hover:text-harvest-400 transition-colors">
          MASUK
        </Link>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 w-full flex flex-col justify-center px-8 md:px-16 max-w-md md:max-w-xl mx-auto mt-10">
        <div className="flex items-center gap-3 mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-lg">
            <Logo size={42} withText={false} />
          </div>
          <h1 className="text-white font-display font-black text-4xl md:text-5xl tracking-tight drop-shadow-md">Jejak Tani</h1>
        </div>

        <div className="min-h-[140px]">
          {ONBOARDING_SLIDES.map((slide, index) => (
            <div 
              key={index}
              className={`absolute transition-all duration-700 ${index === currentSlide ? 'opacity-100 translate-y-0 relative' : 'opacity-0 translate-y-4 absolute inset-x-8 pointer-events-none'}`}
            >
              <h2 className="text-white font-display font-bold text-3xl md:text-4xl mb-4 leading-tight drop-shadow-md">
                {slide.title}
              </h2>
              <p className="text-teal-50/90 text-base md:text-lg leading-relaxed font-medium">
                {slide.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Carousel Dots */}
        <div className="flex gap-3 mt-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          {ONBOARDING_SLIDES.map((_, index) => (
            <button 
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all duration-500 ${index === currentSlide ? 'w-8 bg-harvest-400' : 'w-2 bg-white/40 hover:bg-white/60'}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="relative z-10 w-full px-8 md:px-16 max-w-md md:max-w-xl mx-auto pb-10 flex flex-col items-center animate-slide-up" style={{ animationDelay: '0.5s' }}>
        <Link 
          to="/home"
          className="w-full bg-white text-teal-900 font-black text-lg py-4 rounded-2xl text-center shadow-[0_8px_30px_rgba(13,148,136,0.3)] hover:bg-earth-50 active:scale-95 transition-all mb-6 flex items-center justify-center gap-2 group"
        >
          Explore Sekarang
          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/></svg>
        </Link>
        
        <p className="text-white/90 text-sm mb-12">
          Belum punya akun? <Link to="/daftar" className="text-harvest-400 font-bold hover:text-harvest-300 hover:underline transition-colors">Gabung sekarang</Link>
        </p>
        
        <p className="text-teal-100/50 text-[10px] tracking-widest uppercase font-bold">
          BUTUH BANTUAN? | <a href="mailto:help@jejaktani.id" className="hover:text-white transition-colors">help@jejaktani.id</a>
        </p>
      </div>
    </div>
  );
}
