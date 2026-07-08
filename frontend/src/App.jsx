import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import BottomNav from './components/BottomNav.jsx';
import AccessibilityMenu from './components/AccessibilityMenu.jsx';

import Home from './pages/Home.jsx';
import Onboarding from './pages/Onboarding.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import TraceSearch from './pages/TraceSearch.jsx';
import TracePublic from './pages/TracePublic.jsx';
import Cart from './pages/Cart.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import PetaniDashboard from './pages/PetaniDashboard.jsx';
import Akun from './pages/Akun.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import HargaReferensi from './pages/HargaReferensi.jsx';
import JadiMitra from './pages/JadiMitra.jsx';
import NotFound from './pages/NotFound.jsx';
import RuteOptimasi from './pages/RuteOptimasi.jsx';
import Preorder from './pages/Preorder.jsx';
import ColdChain from './pages/ColdChain.jsx';
import Favorit from './pages/Favorit.jsx';

export default function App() {
  const location = useLocation();
  const isOnboarding = location.pathname === '/';

  return (
    <div className={`min-h-screen bg-white md:bg-stone-100 selection:bg-teal-200 selection:text-teal-900 flex flex-col ${isOnboarding ? '!bg-transparent' : ''}`}>
      {!isOnboarding && <Navbar />}
      
      <main className={isOnboarding ? "flex-1 w-full" : "flex-1 w-full pt-14 md:pt-16 pb-20 md:pb-8 bg-white min-h-screen"}>
        <Routes>
            <Route path="/" element={<Onboarding />} />
            <Route path="/home" element={<Home />} />
            <Route path="/produk/:id" element={<ProductDetail />} />
            <Route path="/trace" element={<TraceSearch />} />
            <Route path="/trace/:id" element={<TracePublic />} />
            <Route path="/harga" element={<HargaReferensi />} />
            <Route path="/preorder" element={<Preorder />} />
            <Route path="/jadi-mitra" element={<JadiMitra />} />
            <Route path="/favorit" element={<Favorit />} />
            <Route path="/masuk" element={<Login />} />
            <Route path="/daftar" element={<Register />} />

            <Route path="/keranjang" element={
              <ProtectedRoute roles={['buyer']}><Cart /></ProtectedRoute>
            } />
            <Route path="/akun/*" element={<Akun />} />
            <Route path="/petani" element={
              <ProtectedRoute roles={['petani']}><PetaniDashboard /></ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
            } />
            <Route path="/admin/rute" element={
              <ProtectedRoute roles={['admin']}><RuteOptimasi /></ProtectedRoute>
            } />
            <Route path="/admin/cold-chain/:id" element={
              <ProtectedRoute roles={['admin']}><ColdChain /></ProtectedRoute>
            } />
          </Routes>
      </main>
      
      {!isOnboarding && (
        <>
          <div className="hidden md:block md:pl-64">
            <Footer />
          </div>
          <BottomNav />
        </>
      )}
      
      <AccessibilityMenu />
    </div>
  );
}
