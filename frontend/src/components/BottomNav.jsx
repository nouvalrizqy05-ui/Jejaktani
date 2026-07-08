import { NavLink } from 'react-router-dom';
import { Home, LineChart, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { cn } from '../utils.js';

export default function BottomNav() {
  const { user } = useAuth();
  
  const dashboardPath = user?.role === 'petani' ? '/petani' : user?.role === 'admin' ? '/admin' : '/akun';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-panel md:bg-white border-t border-white/40 md:top-16 md:bottom-0 md:right-auto md:w-64 md:border-t-0 md:border-r md:border-earth-200 md:shadow-none shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
      <div className="w-full h-16 md:h-auto flex md:flex-col items-center md:items-stretch justify-around md:justify-start pb-safe md:pb-0 md:p-4 md:gap-3">
        <NavLink 
          to="/home" 
          className={({ isActive }) => cn(
            "flex flex-col md:flex-row items-center md:justify-start w-1/4 md:w-full h-full md:h-auto md:px-4 md:py-3 gap-1 md:gap-3 md:rounded-xl transition-all duration-300",
            isActive ? "text-teal-700 md:bg-teal-50 md:text-teal-800 shadow-sm" : "text-earth-400 hover:text-earth-600 md:text-earth-600 md:hover:bg-earth-50"
          )}
        >
          <Home className={cn("w-5 h-5 transition-transform", "group-hover:scale-110")} />
          <span className="text-[10px] md:text-sm font-bold tracking-wide">Beranda</span>
        </NavLink>
        
        <NavLink 
          to="/harga" 
          className={({ isActive }) => cn(
            "flex flex-col md:flex-row items-center md:justify-start w-1/4 md:w-full h-full md:h-auto md:px-4 md:py-3 gap-1 md:gap-3 md:rounded-xl transition-all duration-300",
            isActive ? "text-teal-700 md:bg-teal-50 md:text-teal-800 shadow-sm" : "text-earth-400 hover:text-earth-600 md:text-earth-600 md:hover:bg-earth-50"
          )}
        >
          <LineChart className={cn("w-5 h-5 transition-transform", "group-hover:scale-110")} />
          <span className="text-[10px] md:text-sm font-bold tracking-wide">Harga</span>
        </NavLink>
        
        <NavLink 
          to="/trace" 
          className={({ isActive }) => cn(
            "flex flex-col md:flex-row items-center md:justify-start w-1/4 md:w-full h-full md:h-auto md:px-4 md:py-3 gap-1 md:gap-3 md:rounded-xl transition-all duration-300",
            isActive ? "text-teal-700 md:bg-teal-50 md:text-teal-800 shadow-sm" : "text-earth-400 hover:text-earth-600 md:text-earth-600 md:hover:bg-earth-50"
          )}
        >
          <ShieldCheck className={cn("w-5 h-5 transition-transform", "group-hover:scale-110")} />
          <span className="text-[10px] md:text-sm font-bold tracking-wide">Lacak</span>
        </NavLink>
        
        <NavLink 
          to={user ? dashboardPath : "/akun"} 
          className={({ isActive }) => cn(
            "flex flex-col md:flex-row items-center md:justify-start w-1/4 md:w-full h-full md:h-auto md:px-4 md:py-3 gap-1 md:gap-3 md:rounded-xl transition-all duration-300",
            isActive ? "text-teal-700 md:bg-teal-50 md:text-teal-800 shadow-sm" : "text-earth-400 hover:text-earth-600 md:text-earth-600 md:hover:bg-earth-50"
          )}
        >
          <User className={cn("w-5 h-5 transition-transform", "group-hover:scale-110")} />
          <span className="text-[10px] md:text-sm font-bold tracking-wide">Akun</span>
        </NavLink>
      </div>
    </nav>
  );
}
