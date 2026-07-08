import React from 'react';
import { Heart, ArrowLeft, SearchX } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useFavorite } from '../context/FavoriteContext.jsx';
import ProductImage from '../components/ProductImage.jsx';
import { formatRupiah } from '../utils.js';
import { useCart } from '../context/CartContext.jsx';

export default function Favorit() {
  const { favorites, toggleFavorite } = useFavorite();
  const { addItem } = useCart();
  const navigate = useNavigate();

  return (
    <div className="bg-earth-50 min-h-screen w-full pb-10">
      <div className="bg-teal-800 text-white px-4 py-4 md:px-8 shadow-md sticky top-14 md:top-16 z-40">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link to="/home" className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-display font-bold text-xl md:text-2xl">Produk Favorit</h1>
            <p className="text-white/80 text-xs md:text-sm">Kumpulan hasil panen pilihan Anda</p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto p-4 md:p-6 mt-4">
        {favorites.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-earth-100 p-10 flex flex-col items-center justify-center text-center min-h-[50vh]">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
              <Heart className="w-12 h-12 text-red-400" />
            </div>
            <h2 className="font-display font-bold text-2xl text-earth-900 mb-2">Belum ada produk favorit</h2>
            <p className="text-earth-500 max-w-md mb-8">
              Anda belum menandai produk apapun sebagai favorit. Jelajahi katalog kami dan tekan ikon hati pada produk yang Anda sukai untuk menyimpannya di sini.
            </p>
            <Link to="/home" className="btn bg-teal-600 text-white hover:bg-teal-700 shadow-md shadow-teal-600/20">
              Mulai Eksplorasi
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {favorites.map(produk => (
              <div key={produk.id} className="card relative flex flex-col h-full group bg-white border border-earth-200">
                <button 
                  onClick={(e) => { e.preventDefault(); toggleFavorite(produk); }} 
                  className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-md rounded-full shadow-sm z-10 transition-transform active:scale-90 hover:bg-white"
                >
                  <Heart className="w-4 h-4 transition-colors fill-red-500 text-red-500" />
                </button>
                
                <Link to={`/produk/${produk.id}`} className="block relative aspect-square bg-gradient-to-br from-earth-50 to-teal-50 overflow-hidden flex items-center justify-center group-hover:opacity-90 transition-opacity">
                   <ProductImage src={produk.foto_emoji} alt={produk.nama} size="lg" className="rounded-t-2xl group-hover:scale-105 transition-transform duration-500" />
                </Link>
                
                <div className="p-3 flex flex-col grow bg-white">
                   <p className="text-[10px] text-teal-700 font-bold uppercase truncate tracking-wider">{produk.petani?.desa || 'LOKAL'}</p>
                   <Link to={`/produk/${produk.id}`} className="font-semibold text-earth-900 text-sm leading-snug line-clamp-2 mt-1 mb-1 group-hover:text-teal-700 transition-colors">
                     {produk.nama}
                   </Link>
                   
                   <div className="mt-auto pt-2 border-t border-earth-100">
                     <div className="flex items-end gap-1 mb-3">
                       <span className="font-bold text-earth-900 text-base">{formatRupiah(produk.harga_per_kg)}</span>
                       <span className="text-[10px] text-earth-500 font-medium">/ kg</span>
                     </div>
                     <button onClick={(e) => { e.preventDefault(); addItem(produk, 1); }} className="w-full py-2 border border-teal-600 text-teal-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-teal-50 transition-all active:scale-95 group-hover:bg-teal-600 group-hover:text-white">
                       + Keranjang
                     </button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
