import {
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  Truck,
  FileText,
  Tags,
  MessageSquare,
  Building2,
  UserCheck,
  Shield,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useApp } from "../contexts/AppContext";
import { useNavigate } from "react-router-dom";
import { hasPermission } from "../utils/permissions";

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function AdminSidebar({ activeTab, setActiveTab }: AdminSidebarProps) {
  const { state } = useApp();
  const navigate = useNavigate();

  const userPermissions = state.user?.permissions || [];
  const isAdmin = state.user?.role === "admin";

  const navigation = [
    {
      name: "Tổng quan",
      id: "overview",
      icon: BarChart3,
      permission: "admin.*",
      route: "/admin",
    },
    {
      name: "Sản phẩm",
      id: "products",
      icon: Package,
      permission: "product.*",
      route: "/admin/products",
    },
    {
      name: "Loại sản phẩm",
      id: "categories",
      icon: Package,
      permission: "category.*",
      route: "/admin/categories",
    },
    {
      name: "Đơn hàng",
      id: "orders",
      icon: ShoppingCart,
      permission: "order.view",
      route: "/admin/orders",
    },
    {
      name: "Khách hàng",
      id: "customers",
      icon: Users,
      permission: "admin.*",
      route: "/admin/customers",
    },
    {
      name: "Phiếu đặt hàng",
      id: "purchase-orders",
      icon: FileText,
      permission: "purchase.*",
      route: "/admin/purchase-orders",
    },
    {
      name: "Phiếu nhập hàng",
      id: "goods-receipt",
      icon: Package,
      permission: "import.*",
      route: "/admin/goods-receipt",
    },
    {
      name: "Nhà cung cấp",
      id: "suppliers",
      icon: Truck,
      permission: "supplier.*",
      route: "/admin/suppliers",
    },
    {
      name: "Hóa đơn",
      id: "invoices",
      icon: FileText,
      permission: "invoice.*",
      route: "/admin/invoices",
    },
    {
      name: "Giảm giá",
      id: "discounts",
      icon: Tags,
      permission: "admin.*",
      route: "/admin/discounts",
    },
    {
      name: "Bình luận",
      id: "reviews",
      icon: MessageSquare,
      permission: "admin.*",
      route: "/admin/reviews",
    },
    {
      name: "Nhân viên",
      id: "staff",
      icon: UserCheck,
      permission: "employee.*",
      route: "/admin/employees",
    },
    {
      name: "Bộ phận",
      id: "departments",
      icon: Building2,
      permission: "department.*",
      route: "/admin/departments",
    },
    {
      name: "Màu sắc",
      id: "colors",
      icon: Building2,
      permission: "color.*",
      route: "/admin/colors",
    },
    {
      name: "Phân quyền",
      id: "permissions",
      icon: Shield,
      permission: "admin.*",
      route: "/admin/permissions",
    },
  ];

  const filteredNavigation = navigation.filter((item) => {
    return hasPermission(userPermissions, item.permission);
  });

  const handleItemClick = (item: typeof navigation[0]) => {
    navigate(item.route);
  };

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-50 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-800 px-4 pb-4 shadow-sm">
        <div className="flex h-16 shrink-0 items-center">
          <div className="flex items-center space-x-2">
            <div className="h-7 w-7 bg-gradient-to-r from-brand-500 to-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-base">F</span>
            </div>
            <div>
              <span className="text-base font-bold text-gray-900 dark:text-white">
                Admin Panel
              </span>
              <div className="text-xs text-muted-foreground">
                {state.user?.role === "admin"
                  ? "Quản trị viên"
                  : "Nhân viên"}
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
          <span className="sr-only">Thông tin người dùng</span>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">Admin</div>
            <div className="text-xs text-muted-foreground truncate">
              admin@gmail.com
            </div>
            {/* <div className="font-medium truncate">{state.user?.name}</div>
            <div className="text-xs text-muted-foreground truncate">
              {state.user?.email}
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
} 