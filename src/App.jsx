import { Toaster } from 'sonner';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';

import { AppProvider } from './contexts/AppContext';
import { ThemeProvider } from './components/ThemeProvider';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { Home } from 'lucide-react';
// import { Toaster } from './components/ui/toaster';

// Public Pages
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductListing from './pages/ProductListing';
import ProductDetail from './pages/ProductDetail';
import NotFound from './pages/NotFound';
import SearchResults from './pages/SearchResults';
import OrderManagement from './pages/OrderManagement';
import OrderDetail from './pages/OrderDetail';

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
import DeliveryOrders from './pages/DeliveryOrders';
import AdminOrderDetail from './pages/AdminOrderDetail';
import Customers from './pages/Customers';
import Suppliers from './pages/SupplierManagement';
import Invoices from './pages/Invoices';
import Discounts from './pages/Discounts';
import Reviews from './pages/Reviews';
import Employees from './pages/EmployeeManagement';
import Departments from './pages/Departments';
import Colors from './pages/ColorManagement';
import PermissionManagement from './pages/PermissionManagement';
import ReturnManagement from './pages/ReturnManagement';
import DiscountManagement from './pages/DiscountManagement';
import AdminLayout from './layouts/AdminLayout';
import UserAccountLayout from './layouts/UserAccountLayout';
import CategoryPage from './pages/CategoryPage';
import NewProducts from "./pages/NewProducts";
import BestSellerProducts from "./pages/BestSellerProducts";

import DiscountProducts from './pages/DiscountProducts';
import AccountSettings from './pages/AccountSettings';

import TestPage from "./pages/TestPage";


import ScrollToTop from "./components/ScrollToTop";
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

const UserAccountLayoutWrapper = ({ children }) => (
  <MainLayout>
    <UserAccountLayout>
      {children}
    </UserAccountLayout>
  </MainLayout>
);

// Admin layout wrapper - removed inline AdminLayout as we now have a separate component

function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <ScrollToTop />
        <Routes>
          {/* Admin Routes - Sử dụng AdminLayout với sidebar */}
          <Route path="/admin" element={
            <ProtectedRoute requiredPermissions={['toanquyen', 'donhang.xem_duoc_giao', 'donhang.xem']}>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute requiredPermissions={['toanquyen', 'donhang.xem_duoc_giao', 'donhang.xem']}>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/products" element={
            <ProtectedRoute requiredPermissions={['sanpham.xem']}>
              <AdminLayout>
                <ProductManagement />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/add-product" element={
            <ProtectedRoute requiredPermissions={['sanpham.tao']}>
              <AdminLayout>
                <ProductAdd />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/products/:id" element={
            <ProtectedRoute requiredPermissions={['sanpham.xem']}>
              <AdminLayout>
                <AdminProductDetail />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/categories" element={
            <ProtectedRoute requiredPermissions={['danhmuc.tao', 'danhmuc.sua', 'danhmuc.xoa']}>
              <AdminLayout>
                <CategoriesManagement />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/purchase-orders" element={
            <ProtectedRoute requiredPermissions={['dathang.xem', 'dathang.tao', 'dathang.sua']}>
              <AdminLayout>
                <PurchaseOrders />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/goods-receipt" element={
            <ProtectedRoute requiredPermissions={['nhaphang.xem', 'nhaphang.tao', 'nhaphang.sua']}>
              <AdminLayout>
                <GoodsReceipt />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/orders" element={
            <ProtectedRoute requiredPermissions={['donhang.xem', 'donhang.xem_duoc_giao']}>
              <AdminLayout>
                <Orders />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/orders/:id" element={
            <ProtectedRoute requiredPermissions={['donhang.xem', 'donhang.xem_duoc_giao']}>
              <AdminLayout>
                <AdminOrderDetail
                />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/delivery-orders" element={
            <ProtectedRoute requiredPermissions={['donhang.xem_duoc_giao']}>
              <AdminLayout>
                <DeliveryOrders />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/return-management" element={
            <ProtectedRoute requiredPermissions={['thongtin.xem', 'toanquyen']}>
              <AdminLayout>
                <ReturnManagement />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/discount-management" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <DiscountManagement />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/customers" element={
            <ProtectedRoute requiredPermissions={['toanquyen']}>
              <AdminLayout>
                <Customers />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/suppliers" element={
            <ProtectedRoute requiredPermissions={['nhacungcap.xem', 'nhacungcap.tao', 'nhacungcap.sua', 'nhacungcap.xoa']}>
              <AdminLayout>
                <Suppliers />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/invoices" element={
            <ProtectedRoute requiredPermissions={['hoadon.xem', 'hoadon.tao']}>
              <AdminLayout>
                <Invoices />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/discounts" element={
            <ProtectedRoute requiredPermissions={['toanquyen']}>
              <AdminLayout>
                <Discounts />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/reviews" element={
            <ProtectedRoute requiredPermissions={['toanquyen']}>
              <AdminLayout>
                <Reviews />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/employees" element={
            <ProtectedRoute requiredPermissions={['nhanvien.xem', 'nhanvien.phancong']}>
              <AdminLayout>
                <Employees />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/departments" element={
            <ProtectedRoute requiredPermissions={['bophan.xem', 'toanquyen']}>
              <AdminLayout>
                <Departments />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/colors" element={
            <ProtectedRoute requiredPermissions={['mausac.tao', 'mausac.sua', 'mausac.xoa']}>
              <AdminLayout>
                <Colors />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/sizes" element={
            <ProtectedRoute requiredPermissions={['kichthuoc.tao', 'kichthuoc.sua', 'kichthuoc.xoa']}>
              <AdminLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-4">Quản lý kích thước</h1>
                  <p className="text-gray-600">Trang quản lý kích thước sản phẩm</p>
                </div>
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/permissions" element={
            <ProtectedRoute requiredPermissions={['toanquyen']}>
              <AdminLayout>
                <PermissionManagement />
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
          <Route path="/category/:id" element={<MainLayout><CategoryPage /></MainLayout>} />
          <Route path="/search" element={<MainLayout><SearchResults /></MainLayout>} />
          <Route path="/new-products" element={<MainLayout><NewProducts /></MainLayout>} />
          <Route path="/bestseller-products" element={<MainLayout><BestSellerProducts /></MainLayout>} />
          <Route path="/discount-products" element={<MainLayout><DiscountProducts /></MainLayout>} />

          <Route path="/test" element={<MainLayout><TestPage /></MainLayout>} />

          {/* Protected User Routes */}
          <Route path="/profile" element={
              <ProtectedRoute requiredPermissions={['thongtin.xem']}>
                <UserAccountLayoutWrapper>
                  <Profile />
                </UserAccountLayoutWrapper>
              </ProtectedRoute>
          } />

          <Route path="/account-settings" element={
              <ProtectedRoute requiredPermissions={['thongtin.xem']}>
                <UserAccountLayoutWrapper>
                  <AccountSettings />
                </UserAccountLayoutWrapper>
              </ProtectedRoute>
            } />
          <Route path="/cart" element={
            <MainLayout>
              <ProtectedRoute requiredPermissions={['giohang.xem']}>
                <Cart />
              </ProtectedRoute>
            </MainLayout>
          } />
          <Route path="/checkout" element={
            <MainLayout>
              <ProtectedRoute requiredPermissions={['giohang.xem', 'donhang.tao']}>
                <Checkout />
              </ProtectedRoute>
            </MainLayout>
          } />

          <Route path="/orders" element={
            <ProtectedRoute requiredPermissions={['donhang.xem_cua_minh']}>
              <UserAccountLayoutWrapper>
                <OrderManagement />
              </UserAccountLayoutWrapper>
            </ProtectedRoute>
          } />
              <Route path="/orders/:id" element={
            <ProtectedRoute requiredPermissions={['donhang.xem_cua_minh']}>
              <UserAccountLayoutWrapper>
                <OrderDetail />
              </UserAccountLayoutWrapper>
            </ProtectedRoute>
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
