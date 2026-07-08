import { useState } from 'react';
import { useToast } from '../context/ToastContext.jsx';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo.jsx';

export default function TraceSearch() {
  const { showToast } = useToast();
  const [traceId, setTraceId] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (traceId.trim()) {
      navigate(`/trace/${traceId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <Logo size={50} />
        </div>
        <h2 className="mt-2 text-center text-3xl font-display font-extrabold text-stone-900">
          Lacak Produk Anda
        </h2>
        <p className="mt-2 text-center text-sm text-stone-600">
          Masukkan ID Traceability atau pindai QR Code pada kemasan untuk melihat perjalanan produk, data GPS, dan suhu (IoT).
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-stone-100">
          <form className="space-y-6" onSubmit={handleSearch}>
            <div>
              <label htmlFor="traceId" className="block text-sm font-medium text-stone-700">
                ID Traceability (Contoh: prd-...)
              </label>
              <div className="mt-2 relative rounded-md shadow-sm">
                <input
                  id="traceId"
                  name="traceId"
                  type="text"
                  required
                  value={traceId}
                  onChange={(e) => setTraceId(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-stone-300 rounded-md placeholder-stone-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                  placeholder="Masukkan ID Produk..."
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
              >
                Lacak Sekarang
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-stone-500">Atau</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => showToast('Fitur kamera AR/QR Code Scanner dapat dintegrasikan di sini pada versi produksi.', 'info')}
                className="w-full inline-flex justify-center py-3 px-4 border border-stone-300 rounded-md shadow-sm bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
              >
                <svg className="w-5 h-5 mr-2 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                Pindai QR Code
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
