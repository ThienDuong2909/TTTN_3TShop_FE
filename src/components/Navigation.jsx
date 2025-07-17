import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  ShoppingBag, 
  User, 
  ShoppingCart, 
  Search,
  Menu,
  X,
  Settings,
  LogOut,
  Package,
  FileText,
  Truck
} from 'lucide-react';
import { Button } from './ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useApp } from '../contexts/AppContext';
import PurchaseOrderForm from '../features/purchase/components/PurchaseOrderForm';
import GoodsReceiptForm from '../features/goods-receipt/components/GoodsReceiptForm';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [purchaseOrderModalOpen, setPurchaseOrderModalOpen] = useState(false);
  const [goodsReceiptModalOpen, setGoodsReceiptModalOpen] = useState(false);
  const location = useLocation();
  const { state, setUser } = useApp();
  const { user, cart } = state;

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const publicLinks = [
    { path: '/', label: 'Trang chủ', icon: Home },
    { path: '/products', label: 'Sản phẩm', icon: ShoppingBag },
  ];

  const adminLinks = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: Settings },
    { path: '/admin/products', label: 'Quản lý SP', icon: Package },
    { path: '/admin/purchase-orders', label: 'Đơn đặt hàng', icon: FileText },
    { path: '/admin/goods-receipt', label: 'Phiếu nhập', icon: Truck },
  ];

  const handlePurchaseOrderClick = () => {
    setPurchaseOrderModalOpen(true);
    setIsOpen(false);
  };

  const handleGoodsReceiptClick = () => {
    setGoodsReceiptModalOpen(true);
    setIsOpen(false);
  };

  return (
    <>
      <nav className="bg-white dark:bg-gray-900 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            {/* Desktop Navigation - Centered */}
            <div className="hidden md:flex items-center justify-center w-full space-x-8">
              {/* Public Links */}
              {publicLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(link.path)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}

              {/* Business Links */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-gray-700 dark:text-gray-300">
                    <FileText className="h-4 w-4 mr-1" />
                    Quản lý
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handlePurchaseOrderClick}>
                    <FileText className="h-4 w-4 mr-2" />
                    <span>Phiếu Đặt Hàng</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleGoodsReceiptClick}>
                    <Truck className="h-4 w-4 mr-2" />
                    <span>Phiếu Nhập Hàng</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Admin Links (if user is admin) */}
              {user?.role === 'admin' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-gray-700 dark:text-gray-300">
                      <Settings className="h-4 w-4 mr-1" />
                      Admin
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {adminLinks.map((link) => {
                      const Icon = link.icon;
                      return (
                        <DropdownMenuItem key={link.path} asChild>
                          <Link to={link.path} className="flex items-center space-x-2">
                            <Icon className="h-4 w-4" />
                            <span>{link.label}</span>
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center justify-between w-full">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Menu</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white dark:bg-gray-900 border-t">
                {/* Public Links */}
                {publicLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                        isActive(link.path)
                          ? 'bg-primary text-primary-foreground'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}

                {/* Business Links */}
                <div className="border-t pt-2">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 px-3 py-2">
                    Quản lý
                  </div>
                  <button
                    onClick={handlePurchaseOrderClick}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 w-full text-left"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Phiếu Đặt Hàng</span>
                  </button>
                  <button
                    onClick={handleGoodsReceiptClick}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 w-full text-left"
                  >
                    <Truck className="h-4 w-4" />
                    <span>Phiếu Nhập Hàng</span>
                  </button>
                </div>

                {/* Admin Links */}
                {user?.role === 'admin' && (
                  <div className="border-t pt-2">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 px-3 py-2">
                      Admin
                    </div>
                    {adminLinks.map((link) => {
                      const Icon = link.icon;
                      return (
                        <Link
                          key={link.path}
                          to={link.path}
                          className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => setIsOpen(false)}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{link.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Purchase Order Modal */}
      <Dialog open={purchaseOrderModalOpen} onOpenChange={setPurchaseOrderModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Phiếu Đặt Hàng</DialogTitle>
          </DialogHeader>
          <PurchaseOrderForm 
            onSuccess={() => {
              setPurchaseOrderModalOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Goods Receipt Modal */}
      <Dialog open={goodsReceiptModalOpen} onOpenChange={setGoodsReceiptModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Phiếu Nhập Hàng</DialogTitle>
          </DialogHeader>
          <GoodsReceiptForm 
            onSuccess={() => {
              setGoodsReceiptModalOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Navigation; 