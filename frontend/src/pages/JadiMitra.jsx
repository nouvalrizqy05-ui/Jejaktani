import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import PasswordStrength from '../components/PasswordStrength.jsx';

const steps = [
  ['Daftar & lengkapi profil', 'Buat akun petani dan lengkapi data lahan Anda.'],
  ['Catat hasil panen', 'Masukkan jenis, jumlah, dan grade kualitas panen Anda.'],
  ['Dapat jejak QR otomatis', 'Setiap produk mendapat kode QR yang bisa ditelusuri pembeli.'],
  ['Terjual dengan harga adil', 'Produk tayang di marketplace dengan harga transparan.'],
];

export default function JadiMitra() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nama: '', email: '', password: '', no_hp: '', desa: '', alamat: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register({ ...form, role: 'petani' });
      navigate('/petani');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
      <span className="badge bg-leaf-100 text-leaf-800">Untuk Petani &amp; UMKM Pelosok</span>
      <h1 className="font-display text-3xl sm:text-4xl font-semibold text-stone-900 mt-3">
        Jual hasil panen Anda,<br />tanpa perantara berlapis.
      </h1>
      <p className="text-stone-600 mt-4 leading-relaxed max-w-xl">
        Jejak Tani menghubungkan Anda langsung ke pembeli rumah tangga maupun bisnis (restoran,
        hotel, ritel) di kota. Tidak perlu smartphone canggih &mdash; tim agen lapangan kami siap membantu pendaftaran.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mt-10">
        {steps.map(([title, desc], i) => (
          <div key={title} className="card p-5">
            <span className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center font-display font-semibold text-sm">{i + 1}</span>
            <p className="font-display font-semibold text-stone-900 mt-3">{title}</p>
            <p className="text-sm text-stone-500 mt-1">{desc}</p>
          </div>
        ))}
      </div>

      {!showForm ? (
        <button onClick={() => setShowForm(true)} className="btn-primary mt-10 !py-3 !px-7">
          Daftar Sebagai Petani/UMKM
        </button>
      ) : (
        <div className="mt-12 bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-stone-200" id="form-daftar">
          <h2 className="font-display text-2xl font-bold mb-6">Formulir Kemitraan Petani</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nama lengkap</label>
              <input required value={form.nama} onChange={set('nama')} className="input" />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" required value={form.email} onChange={set('email')} className="input" />
            </div>
            <div>
              <label className="label">Kata sandi</label>
              <input type="password" required minLength={8} value={form.password} onChange={set('password')} className="input" />
              <PasswordStrength password={form.password} />
            </div>
            <div>
              <label className="label">Nomor HP / WhatsApp</label>
              <input value={form.no_hp} onChange={set('no_hp')} className="input" placeholder="08xxxxxxxxxx" />
            </div>
            <div>
              <label className="label">Desa &amp; Kabupaten</label>
              <input required value={form.desa} onChange={set('desa')} className="input" placeholder="Contoh: Desa Sukamaju, Cianjur" />
            </div>
            <div>
              <label className="label">Alamat lengkap lahan / gudang desa</label>
              <input required value={form.alamat} onChange={set('alamat')} className="input" placeholder="Jalan, RT/RW..." />
            </div>

            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
            
            <button disabled={loading} className="btn-primary w-full !py-3 mt-4">
              {loading ? 'Memproses...' : 'Daftar Sekarang'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
