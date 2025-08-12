import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { User, Package, Heart, MapPin, Settings, CreditCard } from 'lucide-react';

const UserAccountLayout = ({ children }) => {
  const { state } = useApp();

  const sidebarItems = [
    {
      label: 'Thông tin cá nhân',
      path: '/profile',
      icon: User,
      color: 'text-blue-600'
    },
    {
      label: 'Đơn hàng của tôi',
      path: '/orders',
      icon: Package,
      color: 'text-orange-600'
    },
    {
      label: 'Sản phẩm yêu thích',
      path: '/wishlist',
      icon: Heart,
      color: 'text-red-600'
    },
    {
      label: 'Sổ địa chỉ',
      path: '/addresses',
      icon: MapPin,
      color: 'text-green-600'
    },
    {
      label: 'Phương thức thanh toán',
      path: '/payment-methods',
      icon: CreditCard,
      color: 'text-purple-600'
    },
    {
      label: 'Cài đặt tài khoản',
      path: '/account-settings',
      icon: Settings,
      color: 'text-gray-600'
    }
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 max-w-[1400px] py-8">
        <div className="grid grid-cols-12 gap-6">
          
          {/* Sidebar */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden sticky top-8">
              
              {/* User Info Header */}
              <div className="p-6 text-white" style={{ background: `linear-gradient(to right, #684827, #5a3e22)` }}>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-3">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      {state.user?.name || 'Người dùng'}
                    </h3>
                    <p className="text-white/80 text-sm">
                      {state.user?.email || 'user@example.com'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation Menu */}
              <nav className="p-2">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center px-4 py-3 mx-2 my-1 rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                        }`
                      }
                      style={({ isActive }) => 
                        isActive ? { backgroundColor: '#684827' } : {}
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon 
                            className={`w-5 h-5 mr-3 ${
                              isActive ? 'text-white' : item.color
                            }`} 
                          />
                          <span className="font-medium">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </nav>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    Thành viên từ {new Date().getFullYear()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-12 lg:col-span-9">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAccountLayout;