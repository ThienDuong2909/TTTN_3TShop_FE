import {
  Package,
  ShoppingCart,
  Truck,
  FileText,
  Tags,
  Building2,
  UserCheck,
  Shield,
  RotateCcw,
  BarChart3,
  Shirt,
  Import,
  PaintBucket,
  Settings2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useApp } from "../contexts/AppContext";
import { useNavigate, useLocation } from "react-router-dom";
import { hasPermission } from "../utils/permissions";

interface AdminSidebarProps {
  activeTab: string;
}

interface NavigationItem {
  name: string;
  id: string;
  icon: any;
  permission: string;
  route: string;
  alternativePermissions?: string[];
  isDashboard?: boolean;
}

interface NavigationGroup {
  title: string;
  items: NavigationItem[];
}

export default function AdminSidebar({ activeTab }: AdminSidebarProps) {
  const { state } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const userPermissions = state.user?.permissions || [];

  const navigationGroups: NavigationGroup[] = [
    {
      title: "Tổng quan",
      items: [
        {
          name: "Dashboard",
          id: "dashboard",
          icon: BarChart3,
          permission: "toanquyen",
          route: "/admin",
          isDashboard: true,
          alternativePermissions: ["taobaocao"],
        },
      ],
    },
    {
      title: "Quản lý sản phẩm",
      items: [
        {
          name: "Sản phẩm",
          id: "products",
          icon: Shirt,
          permission: "toanquyen",
          route: "/admin/products",
          alternativePermissions: [
            "sanpham.tao",
            "sanpham.sua",
            "sanpham.xoa",
            "sanpham.xem",
          ],
        },
        {
          name: "Loại sản phẩm",
          id: "categories",
          icon: Package,
          permission: "danhmuc.tao",
          route: "/admin/categories",
          alternativePermissions: ["danhmuc.sua", "danhmuc.xoa"],
        },
        {
          name: "Màu sắc",
          id: "colors",
          icon: PaintBucket,
          permission: "mausac.tao",
          route: "/admin/colors",
          alternativePermissions: ["mausac.sua", "mausac.xoa"],
        },
        {
          name: "Giảm giá",
          id: "discounts",
          icon: Tags,
          permission: "toanquyen",
          route: "/admin/discount-management",
        },
      ],
    },
    {
      title: "Quản lý đơn hàng",
      items: [
        {
          name: "Đơn hàng",
          id: "orders",
          icon: ShoppingCart,
          permission: "donhang.xem",
          route: "/admin/orders",
          alternativePermissions: ["donhang.xem_duoc_giao"],
        },
        {
          name: "Quản lý phiếu trả",
          id: "return-management",
          icon: RotateCcw,
          permission: "toanquyen",
          route: "/admin/return-management",
          alternativePermissions: ["phieuchi.tao", "trahang.duyet"],
        },
      ],
    },
    {
      title: "Quản lý kho",
      items: [
        {
          name: "Phiếu đặt hàng",
          id: "purchase-orders",
          icon: FileText,
          permission: "dathang.xem",
          route: "/admin/purchase-orders",
          alternativePermissions: ["dathang.tao", "dathang.sua"],
        },
        {
          name: "Phiếu nhập hàng",
          id: "goods-receipt",
          icon: Import,
          permission: "nhaphang.xem",
          route: "/admin/goods-receipt",
          alternativePermissions: ["nhaphang.tao", "nhaphang.sua"],
        },
        {
          name: "Nhà cung cấp",
          id: "suppliers",
          icon: Truck,
          permission: "nhacungcap.xem",
          route: "/admin/suppliers",
          alternativePermissions: [
            "nhacungcap.tao",
            "nhacungcap.sua",
            "nhacungcap.xoa",
          ],
        },
      ],
    },
    {
      title: "Quản lý hệ thống",
      items: [
        {
          name: "Nhân viên",
          id: "staff",
          icon: UserCheck,
          permission: "toanquyen",
          route: "/admin/employees",
        },
        {
          name: "Bộ phận",
          id: "departments",
          icon: Building2,
          permission: "toanquyen",
          route: "/admin/departments",
        },
        {
          name: "Phân quyền",
          id: "permissions",
          icon: Shield,
          permission: "toanquyen",
          route: "/admin/permissions",
        },
      ],
    },
    {
      name: "Cấu hình FP-Growth",
      id: "fpgrowth-config",
      icon: Settings2,
      permission: "toanquyen",
      route: "/admin/fpgrowth-config",
    },
  ];

  const filteredNavigationGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const hasMainPermission = hasPermission(
          userPermissions,
          item.permission
        );
        const hasAlternativePermission = item.alternativePermissions?.some(
          (perm) => hasPermission(userPermissions, perm)
        );
        return hasMainPermission || hasAlternativePermission;
      }),
    }))
    .filter((group) => group.items.length > 0);

  const handleItemClick = (item: NavigationItem) => {
    navigate(item.route);
  };

  const isItemActive = (item: NavigationItem) => {
    // Special case cho Dashboard
    if (item.isDashboard) {
      return (
        location.pathname === "/admin" ||
        location.pathname === "/admin/dashboard" ||
        activeTab === "dashboard"
      );
    }

    // For other items, check if current path starts with item route
    return location.pathname.startsWith(item.route) || activeTab === item.id;
  };

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-52 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-800 px-4 pb-4 shadow-sm">
        <div className="flex h-16 shrink-0 items-center">
          <div className="flex items-center space-x-2">
            <img className="h-8 w-8" src="../../3tshop.png" alt="Logo" />
            <div>
              <span className="text-base font-semibold text-gray-900 dark:text-white">
                Bảng điều khiển
              </span>
              <div className="text-xs text-muted-foreground">
                {state.user?.role === "Admin"
                  ? "Quản trị viên"
                  : state.user?.role === "NhanVienCuaHang"
                  ? "Nhân viên cửa hàng"
                  : "Nhân viên giao hàng"}
              </div>
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            {filteredNavigationGroups.map((group) => (
              <li key={group.title}>
                {/* Group Title */}
                <div className="text-xs font-semibold leading-6 text-gray-400 dark:text-gray-500 mb-2 px-2">
                  {group.title}
                </div>
                <ul role="list" className="-mx-2 space-y-1">
                  {group.items.map((item) => {
                    const isActive = isItemActive(item);
                    const isDashboard = item.isDashboard;

                    return (
                      <li key={item.name}>
                        <button
                          onClick={() => handleItemClick(item)}
                          className={`group flex gap-x-2 rounded-md p-2 text-sm leading-6 font-medium w-full text-left transition-all duration-200 relative overflow-hidden ${
                            isDashboard
                              ? // Dashboard styling - Active giống hover, nhẹ nhàng hơn
                                isActive
                                ? "bg-gradient-to-r from-brand-50 via-brand-100 to-blue-50 text-brand-700 border border-brand-200 font-semibold shadow-sm dark:from-brand-900/30 dark:via-brand-900/40 dark:to-blue-900/30 dark:text-brand-300 dark:border-brand-600"
                                : "bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 text-gray-600 border border-gray-300 hover:from-brand-50 hover:via-brand-100 hover:to-blue-50 hover:border-brand-200 hover:text-brand-700 dark:from-gray-700 dark:via-gray-800 dark:to-gray-700 dark:text-gray-400 dark:border-gray-600 dark:hover:from-brand-900/30 dark:hover:to-blue-900/30 dark:hover:text-brand-300"
                              : // Regular menu items
                              isActive
                              ? "bg-brand-50 text-brand-600 dark:bg-brand-900/50 dark:text-brand-400"
                              : "text-gray-700 hover:text-brand-600 hover:bg-gray-50 dark:text-gray-600 dark:hover:text-brand-600 dark:hover:bg-gray-700"
                          }`}
                        >
                          <item.icon
                            className={`h-5 w-5 shrink-0 transition-all duration-200 relative z-10 ${
                              isDashboard
                                ? isActive
                                  ? "text-brand-600 dark:text-brand-400" // Màu icon nhẹ nhàng khi active
                                  : "text-gray-500 group-hover:text-brand-600 dark:text-gray-400 dark:group-hover:text-brand-400"
                                : isActive
                                ? "text-brand-600 dark:text-brand-400"
                                : "text-gray-400 group-hover:text-brand-600 dark:group-hover:text-brand-400"
                            }`}
                          />

                          <span
                            className={`relative z-10 transition-all duration-200 ${
                              isDashboard
                                ? isActive
                                  ? "font-semibold text-brand-700 dark:text-brand-300" // Font weight vừa phải
                                  : "font-medium text-gray-600 group-hover:text-brand-700 dark:text-gray-400 dark:group-hover:text-brand-300"
                                : isActive
                                ? "font-medium"
                                : ""
                            }`}
                          >
                            {item.name}
                          </span>

                          {/* Dashboard indicators - Nhẹ nhàng hơn */}
                          {isDashboard && (
                            <div className="ml-auto flex items-center relative z-10">
                              {isActive ? (
                                // Active indicator - subtle, không quá nổi bật
                                <div className="flex items-center">
                                  <div className="h-2 w-2 bg-brand-500 rounded-full opacity-80 dark:bg-brand-400"></div>
                                </div>
                              ) : (
                                // Inactive indicator - static
                                <div className="flex items-center">
                                  <div className="h-2 w-0.5 bg-gray-400 rounded-full opacity-30 group-hover:bg-brand-400 group-hover:opacity-70 transition-all duration-200"></div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Active border accent - Subtle */}
                          {isDashboard && isActive && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500 rounded-r-full opacity-60 dark:bg-brand-400"></div>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Info */}
        <div className="flex items-center gap-x-3 px-2 py-3 text-sm font-medium leading-6 text-gray-900 dark:text-white border-t">
          <Avatar className="h-7 w-7">
            <AvatarImage src={state.user?.avatar} />
            <AvatarFallback>
              {state.user?.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="text-xs text-muted-foreground">
            {state.user?.name}
          </div>
        </div>
      </div>
    </div>
  );
}
