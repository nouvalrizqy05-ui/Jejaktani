import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from '../components/Logo.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(email, password);
      const from = location.state?.from === '/' ? '/home' : location.state?.from || '/home';
      const dest = user.role === 'petani' ? '/petani' : user.role === 'admin' ? '/admin' : from;
      navigate(dest);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    ['Petani', 'petani1@jejaktani.id', 'petani123'],
    ['Buyer B2C', 'buyer.rumahtangga@jejaktani.id', 'buyer123'],
    ['Buyer B2B', 'buyer.resto@jejaktani.id', 'buyer123'],
    ['Admin', 'admin@jejaktani.id', 'admin123'],
  ];

  return (
    <div className="flex-1 flex flex-col justify-center px-6 py-10 min-h-full">
      <div className="w-full">
        <div className="flex justify-center mb-6"><Logo size={48} /></div>
        
        <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-stone-100 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-teal-100 text-teal-800 text-[10px] font-bold rounded-full uppercase tracking-widest border border-white">Selamat Datang</div>
          <h1 className="font-display text-2xl font-bold text-stone-900 text-center mt-2">Masuk ke Akun</h1>
          
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="label">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Kata sandi</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button disabled={loading} className="btn-primary w-full !py-2.5">{loading ? 'Memproses...' : 'Masuk'}</button>
          </form>
          <p className="text-sm text-stone-500 text-center mt-4">
            Belum punya akun? <Link to="/daftar" className="text-teal-700 font-medium hover:underline">Daftar</Link>
          </p>
        </div>

        <div className="mt-6 bg-stone-50 rounded-2xl p-5 border border-stone-100">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Login Cepat (Demo)</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {demoAccounts.map(([label, em, pw]) => (
              <button
                key={em}
                type="button"
                onClick={() => { setEmail(em); setPassword(pw); }}
                className="p-2 rounded-lg bg-white border border-stone-200 text-stone-600 hover:border-teal-300 hover:text-teal-700 transition-colors text-left font-medium"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
