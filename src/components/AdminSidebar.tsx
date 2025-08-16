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
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useApp } from "../contexts/AppContext";
import { useNavigate } from "react-router-dom";
import { hasPermission } from "../utils/permissions";

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

interface NavigationItem {
  name: string;
  id: string;
  icon: any;
  permission: string;
  route: string;
  alternativePermissions?: string[];
}

export default function AdminSidebar({ activeTab }: AdminSidebarProps) {
  const { state } = useApp();
  const navigate = useNavigate();

  const userPermissions = state.user?.permissions || [];
  // const isAdmin = state.user?.role === "Admin";

  const navigation: NavigationItem[] = [
    // {
    //   name: "Tổng quan",
    //   id: "overview",
    //   icon: BarChart3,
    //   permission: "toanquyen",
    //   route: "/admin",
    //   alternativePermissions: ["donhang.xem_duoc_giao", "donhang.xem"],
    // },
    {
      name: "Sản phẩm",
      id: "products",
      icon: Package,
      permission: "sanpham.xem",
      route: "/admin/products",
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
      alternativePermissions: ["thongtin.xem"],
    },
    // {
    //   name: "Khách hàng",
    //   id: "customers",
    //   icon: Users,
    //   permission: "toanquyen",
    //   route: "/admin/customers",
    // },
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
      icon: FileText,
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
    {
      name: "Giảm giá",
      id: "discounts",
      icon: Tags,
      permission: "toanquyen",
      route: "/admin/discount-management",
    },
    {
      name: "Nhân viên",
      id: "staff",
      icon: UserCheck,
      permission: "nhanvien.xem",
      route: "/admin/employees",
      alternativePermissions: ["nhanvien.phancong"],
    },
    {
      name: "Bộ phận",
      id: "departments",
      icon: Building2,
      permission: "bophan.xem",
      route: "/admin/departments",
      alternativePermissions: ["toanquyen"],
    },
    {
      name: "Màu sắc",
      id: "colors",
      icon: Building2,
      permission: "mausac.tao",
      route: "/admin/colors",
      alternativePermissions: ["mausac.sua", "mausac.xoa"],
    },
    {
      name: "Phân quyền",
      id: "permissions",
      icon: Shield,
      permission: "toanquyen",
      route: "/admin/permissions",
    },
  ];

  const filteredNavigation = navigation.filter((item) => {
    const hasMainPermission = hasPermission(userPermissions, item.permission);
    const hasAlternativePermission = item.alternativePermissions?.some((perm) =>
      hasPermission(userPermissions, perm)
    );
    return hasMainPermission || hasAlternativePermission;
  });

  const handleItemClick = (item: NavigationItem) => {
    navigate(item.route);
  };

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-52 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-800 px-4 pb-4 shadow-sm">
        <div className="flex h-16 shrink-0 items-center">
          <div className="flex items-center space-x-2">
            <div className="h-7 w-7 bg-gradient-to-r from-brand-500 to-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-base">F</span>
            </div>
            <div>
              <span className="text-base font-bold text-gray-900 dark:text-white">
                Bảng điều khiển
              </span>
              <div className="text-xs text-muted-foreground">
                {state.user?.role === "Admin" ? "Quản trị viên" : "Nhân viên"}
              </div>
            </div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {filteredNavigation.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <li key={item.name}>
                      <button
                        onClick={() => handleItemClick(item)}
                        className={`group flex gap-x-2 rounded-md p-2 text-sm leading-6 font-medium w-full text-left ${
                          isActive
                            ? "bg-brand-50 text-brand-600 dark:bg-brand-900/50 dark:text-brand-400"
                            : "text-gray-700 hover:text-brand-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-brand-400 dark:hover:bg-gray-700"
                        }`}
                      >
                        <item.icon
                          className={`h-5 w-5 shrink-0 ${
                            isActive
                              ? "text-brand-600 dark:text-brand-400"
                              : "text-gray-400 group-hover:text-brand-600 dark:group-hover:text-brand-400"
                          }`}
                        />
                        {item.name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
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
