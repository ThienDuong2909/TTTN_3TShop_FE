import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './contexts/AppContext';
import { ThemeProvider } from './components/ThemeProvider';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { Home, Settings, Package, FileText, Truck, LogOut } from 'lucide-react';
import { useApp } from './contexts/AppContext';

// Public Pages
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductListing from './pages/ProductListing';
import ProductDetail from './pages/ProductDetail';
import NotFound from './pages/NotFound';

// Protected Pages  
import Profile from './pages/Profile';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import ProductManagement from './pages/ProductManagement';
import PurchaseOrders from './pages/PurchaseOrders';
import GoodsReceipt from './pages/GoodsReceipt';

// Wrapper component for main layout
const MainLayout = ({ children }) => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="flex-1">
      {children}
    </main>
    <Footer />
  </div>
);

// Admin layout - chỉ content với navbar đơn giản
const AdminLayout = ({ children }) => {
  const { setUser } = useApp();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">  
      {/* Content */}
      <main>
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <Routes>
          {/* Admin Routes - Sử dụng AdminLayout không có header */}
          <Route path="/admin" element={
            <AdminLayout>
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            </AdminLayout>
          } />
          <Route path="/admin/dashboard" element={
            <AdminLayout>
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            </AdminLayout>
          } />
          <Route path="/admin/products" element={
            <AdminLayout>
              <ProtectedRoute requireAdmin>
                <ProductManagement />
              </ProtectedRoute>
            </AdminLayout>
          } />
          <Route path="/admin/purchase-orders" element={
            <AdminLayout>
              <ProtectedRoute requireAdmin>
                <PurchaseOrders />
              </ProtectedRoute>
            </AdminLayout>
          } />
          <Route path="/admin/goods-receipt" element={
            <AdminLayout>
              <ProtectedRoute requireAdmin>
                <GoodsReceipt />
              </ProtectedRoute>
            </AdminLayout>
          } />

          {/* Public Routes */}
          <Route path="/" element={<MainLayout><Index /></MainLayout>} />
          <Route path="/home" element={<MainLayout><Home /></MainLayout>} />
          <Route path="/login" element={<MainLayout><Login /></MainLayout>} />
          <Route path="/register" element={<MainLayout><Register /></MainLayout>} />
          <Route path="/products" element={<MainLayout><ProductListing /></MainLayout>} />
          <Route path="/product/:id" element={<MainLayout><ProductDetail /></MainLayout>} />
          
          {/* Protected User Routes */}
          <Route path="/profile" element={
            <MainLayout>
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            </MainLayout>
          } />
          <Route path="/cart" element={
            <MainLayout>
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            </MainLayout>
          } />
          <Route path="/checkout" element={
            <MainLayout>
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            </MainLayout>
          } />
          
          {/* 404 */}
          <Route path="*" element={<MainLayout><NotFound /></MainLayout>} />
        </Routes>
        <Toaster />
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
