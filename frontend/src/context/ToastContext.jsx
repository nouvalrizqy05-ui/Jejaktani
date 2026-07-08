import { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none w-[90%] max-w-md">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-xl shadow-lg shadow-black/10 text-sm font-medium animate-fade-in ${
              t.type === 'error' ? 'bg-red-50 text-red-900 border border-red-200' :
              t.type === 'info' ? 'bg-blue-50 text-blue-900 border border-blue-200' :
              'bg-teal-50 text-teal-900 border border-teal-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {t.type === 'error' ? <AlertCircle className="w-5 h-5 text-red-500" /> :
               t.type === 'info' ? <Info className="w-5 h-5 text-blue-500" /> :
               <CheckCircle2 className="w-5 h-5 text-teal-600" />}
              {t.message}
            </div>
            <button onClick={() => removeToast(t.id)} className="p-1 hover:bg-black/5 rounded-md transition-colors">
              <X className="w-4 h-4 opacity-70" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
