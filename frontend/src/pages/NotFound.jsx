import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto px-4 py-32 text-center">
      <p className="text-6xl mb-4">{String.fromCodePoint(0x1f33e)}</p>
      <h1 className="font-display text-2xl font-semibold text-stone-900">Halaman tidak ditemukan</h1>
      <p className="text-stone-500 mt-2">Sepertinya jejak yang Anda cari tidak ada di sini.</p>
      <Link to="/" className="btn-primary mt-6 inline-flex">Kembali ke Beranda</Link>
    </div>
  );
}
