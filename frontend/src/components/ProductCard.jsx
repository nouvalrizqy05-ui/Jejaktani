import { Link } from 'react-router-dom';
import { formatRupiah } from '../utils.js';

const GRADE_COLORS = {
  A: 'bg-leaf-100 text-leaf-800',
  B: 'bg-harvest-100 text-harvest-800',
  C: 'bg-stone-100 text-stone-600',
};

export default function ProductCard({ produk }) {
  const sisa = produk.jumlah_kg - produk.jumlah_terjual_kg;
  return (
    <Link
      to={`/produk/${produk.id}`}
      className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all block"
    >
      <div className="aspect-square bg-gradient-to-br from-teal-50 to-leaf-50 flex items-center justify-center text-5xl sm:text-6xl group-hover:scale-105 transition-transform duration-300">
        {produk.foto_emoji}
      </div>
      <div className="p-3">
        <h3 className="font-display font-semibold text-stone-900 text-sm leading-tight line-clamp-2 mb-1">
          {produk.nama}
        </h3>
        <p className="text-[11px] text-stone-400 mb-2 truncate">{produk.petani?.desa}</p>
        <div className="flex items-center justify-between gap-1">
          <span className="font-display text-base font-bold text-teal-700">{formatRupiah(produk.harga_per_kg)}</span>
          <span className="text-[10px] text-stone-400">/ kg</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${GRADE_COLORS[produk.grade]}`}>
            {produk.grade}
          </span>
          <span className="text-[10px] text-stone-400">Sisa {sisa} kg</span>
        </div>
      </div>
    </Link>
  );
}
