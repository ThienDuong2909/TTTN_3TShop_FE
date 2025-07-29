import { Toaster } from 'sonner';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';

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
import ProductAdd from './pages/ProductAdd';
import AdminProductDetail from './pages/AdminProductDetail';
import CategoriesManagement from './pages/CategoriesManagement';
import PurchaseOrders from './pages/PurchaseOrders';
import GoodsReceipt from './pages/GoodsReceipt';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Customers from './pages/Customers';
import Suppliers from './pages/SupplierManagement';
import Invoices from './pages/Invoices';
import Discounts from './pages/Discounts';
import Reviews from './pages/Reviews';
import Employees from './pages/EmployeeManagement';
import Departments from './pages/Departments';
import Colors from './pages/ColorManagement';
import AdminLayout from './layouts/AdminLayout';

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

// Admin layout wrapper - removed inline AdminLayout as we now have a separate component

function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <Routes>
          {/* Admin Routes - Sử dụng AdminLayout với sidebar */}
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/products" element={
            <ProtectedRoute>
              <AdminLayout>
                <ProductManagement />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/add-product" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <ProductAdd />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/products/:id" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <AdminProductDetail />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/categories" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <CategoriesManagement />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/purchase-orders" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <PurchaseOrders />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/goods-receipt" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <GoodsReceipt />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/orders" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <Orders />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/orders/:id" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <OrderDetail />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/customers" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <Customers />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/suppliers" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <Suppliers />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/invoices" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <Invoices />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/discounts" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <Discounts />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/reviews" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <Reviews />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/employees" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <Employees />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/departments" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <Departments />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/colors" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <Colors />
              </AdminLayout>
            </ProtectedRoute>
          } />

          {/* Public Routes */}
          <Route path="/" element={<MainLayout><Index /></MainLayout>} />
          <Route path="/home" element={<MainLayout><Home /></MainLayout>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
        <Toaster 
          position="top-center"
          richColors/>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
