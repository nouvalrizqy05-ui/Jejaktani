import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="max-w-6xl mx-auto px-4 py-24 text-center text-stone-400">Memuat...</div>;
  if (!user) return <Navigate to="/masuk" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}
