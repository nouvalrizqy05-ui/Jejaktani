import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300 mt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 sm:grid-cols-3 gap-10">
        <div>
          <Logo size={30} dark />
          <p className="mt-4 text-sm text-stone-400 leading-relaxed max-w-xs">
            Setiap panen punya jejak, setiap petani punya harga adil. Platform rural commerce
            &amp; supply chain untuk menghubungkan petani pelosok langsung ke pasar yang lebih luas.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Jelajahi</h3>
          <ul className="space-y-2 text-sm text-stone-400">
            <li><Link to="/" className="hover:text-teal-300">Marketplace</Link></li>
            <li><Link to="/harga" className="hover:text-teal-300">Harga Referensi</Link></li>
            <li><Link to="/jadi-mitra" className="hover:text-teal-300">Jadi Mitra Petani</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Tentang Subtema 3</h3>
          <p className="text-sm text-stone-400 leading-relaxed">
            Dibangun murni sebagai platform Rural Commerce &amp; Supply Chain &mdash; tanpa
            fitur pembiayaan atau pengelolaan keuangan, sesuai batasan lomba.
          </p>
        </div>
      </div>
      <div className="border-t border-stone-800 py-5 text-center text-xs text-stone-500">
        &copy; {new Date().getFullYear()} Jejak Tani &mdash; Dibuat untuk Lomba Web Development, Veternity Beraksi.
      </div>
    </footer>
  );
}
