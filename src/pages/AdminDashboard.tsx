import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  FileText,
  TrendingUp,
  DollarSign,
  Star,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";

import { useApp } from "../contexts/AppContext";
import AdminHeader from "../components/AdminHeader";
import AdminSidebar from "../components/AdminSidebar";
import RevenueReport from '../pages/RevenueReport';
// import PermissionDebug from "../components/PermissionDebug";
// import PermissionTest from "../components/PermissionTest";
// import UserStateTest from "../components/UserStateTest";
import {
  products,
  orders,
  suppliers,
  departments,
  discounts,
  mockStaff,
  categories,
  purchaseOrders,
  goodsReceipts,
  } from "../libs/data";

export default function AdminDashboard() {
  const { state } = useApp();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  // Check if user has permission to access admin dashboard
  const hasAdminAccess = state.user?.permissions?.includes('toanquyen');
  const hasOrderAssignedAccess = state.user?.permissions?.includes('donhang.xem_duoc_giao');
  const hasOrderViewAccess = state.user?.permissions?.includes('donhang.xem');
  
  if (!state.user || (!hasAdminAccess && !hasOrderAssignedAccess && !hasOrderViewAccess)) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Không có quyền truy cập
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Bạn cần có quyền admin hoặc quyền xem đơn hàng để truy cập trang này.
          </p>
          <Link to="/login">
            <Button>Đăng nhập</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isAdmin = state.user.role === "Admin";
  const isStaff = state.user.role === "NhanVienCuaHang";

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Chờ duyệt", variant: "secondary" as const },
      confirmed: { label: "Đã duyệt", variant: "default" as const },
      processing: { label: "Đang xử lý", variant: "outline" as const },
      shipping: { label: "Đang giao", variant: "outline" as const },
      delivered: { label: "Đã giao", variant: "default" as const },
      cancelled: { label: "Đã hủy", variant: "destructive" as const },
      returned: { label: "Đã trả", variant: "secondary" as const },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap];
    return (
      <Badge variant={statusInfo?.variant || "secondary"}>
        {statusInfo?.label || status}
      </Badge>
    );
  };

  // Mock statistics
  const stats = {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
    totalProducts: products.length,
    totalCustomers: 156,
    pendingOrders: orders.filter((o) => o.status === "pending").length,
    confirmedOrders: orders.filter((o) => o.status === "confirmed").length,
  };





  // Overview Dashboard
  const OverviewContent = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng đơn hàng</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.pendingOrders} đơn chờ duyệt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(stats.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% so với tháng trước
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sản phẩm</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Trong {categories.length} danh mục
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Khách hàng</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">+23 khách hàng mới</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 mb-6">
        <RevenueReport />
        {/* Add other action buttons here if needed */}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Đơn hàng gần đây</CardTitle>
          <CardDescription>
            Danh sách đơn hàng mới nhất cần xử lý
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã đơn</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Tổng tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày đặt</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.slice(0, 5).map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>{formatPrice(order.total)}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>{formatDate(order.orderDate)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  // Products Management
  const ProductsContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Quản lý sản phẩm</h2>
          <p className="text-muted-foreground">
            Quản lý thông tin sản phẩm, kho và giá cả
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/products">
            <Button variant="outline">Quản lý chi tiết</Button>
          </Link>
          {(isAdmin ||
            state.user?.permissions?.includes("sanpham.tao") ||
            state.user?.permissions?.includes("toanquyen")) && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm sản phẩm
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Input placeholder="Tìm kiếm sản phẩm..." />
        </div>
        <Select>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Lọc
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sản phẩm</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Giá</TableHead>
              <TableHead>Kho</TableHead>
              <TableHead>Đánh giá</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.slice(0, 10).map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {product.id}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {categories.find(
                    (cat) =>
                      cat.id === product.category?.split("-")[0] ||
                      cat.subcategories?.some(
                        (sub) => sub.id === product.category,
                      ),
                  )?.name || "Khác"}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {formatPrice(product.price)}
                    </div>
                    {product.originalPrice && (
                      <div className="text-sm text-muted-foreground line-through">
                        {formatPrice(product.originalPrice)}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">Còn hàng</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{product.rating}</span>
                    <span className="text-sm text-muted-foreground">
                      ({product.reviews})
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="default">Hoạt động</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-3 w-3" />
                    </Button>
                    {(isAdmin ||
                      state.user?.permissions?.includes("sanpham.xoa") ||
                      state.user?.permissions?.includes("toanquyen")) && (
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );

  // Orders Management
  const OrdersContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Quản lý đơn hàng</h2>
          <p className="text-muted-foreground">
            Xem và xử lý đơn hàng từ khách hàng
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Input placeholder="Tìm kiếm đơn hàng..." />
        </div>
        <Select>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="pending">Chờ duyệt</SelectItem>
            <SelectItem value="confirmed">Đã duyệt</SelectItem>
            <SelectItem value="processing">Đang xử lý</SelectItem>
            <SelectItem value="shipping">Đang giao</SelectItem>
            <SelectItem value="delivered">Đã giao</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã đơn</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Sản phẩm</TableHead>
              <TableHead>Tổng tiền</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày đặt</TableHead>
              <TableHead>Nhân viên</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.id}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{order.customerName}</div>
                    <div className="text-sm text-muted-foreground">
                      {order.customerPhone}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{order.items.length} sản phẩm</div>
                </TableCell>
                <TableCell>{formatPrice(order.total)}</TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell>{formatDate(order.orderDate)}</TableCell>
                <TableCell>
                  {order.assignedStaff ? (
                    <Badge variant="outline">
                      {mockStaff.find((s) => s.id === order.assignedStaff)
                        ?.name || "Đã gán"}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">Chưa gán</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-3 w-3" />
                    </Button>
                    {(isAdmin ||
                      state.user?.permissions?.includes("donhang.capnhat_trangthai") ||
                      state.user?.permissions?.includes("toanquyen")) && (
                      <>
                        {order.status === "pending" && (
                          <Button size="sm" variant="default">
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );

  // Get content component based on active tab
  const getTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewContent />;
      case "products":
        return <ProductsContent />;
      case "orders":
        return <OrdersContent />;
      case "customers":
        return (
          <div className="text-center py-20">
            Trang quản lý khách hàng đang phát triển
          </div>
        );
      case "purchase-orders":
        return (
          <div className="text-center py-20">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Quản lý phiếu đặt hàng
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Chức năng này được triển khai trên trang riêng biệt.
            </p>
          </div>
        );
      case "goods-receipt":
        return (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Quản lý phiếu nhập hàng
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Chức năng này được triển khai trên trang riêng biệt.
            </p>
          </div>
        );
      case "suppliers":
        return (
          <div className="text-center py-20">
            Trang quản lý nhà cung cấp đang phát triển
          </div>
        );
      case "invoices":
        return (
          <div className="text-center py-20">
            Trang quản lý hóa đơn đang phát triển
          </div>
        );
      case "discounts":
        return (
          <div className="text-center py-20">
            Trang quản lý giảm giá đang phát triển
          </div>
        );
      case "reviews":
        return (
          <div className="text-center py-20">
            Trang quản lý bình luận đang phát triển
          </div>
        );
      case "staff":
        return (
          <div className="text-center py-20">
            Trang quản lý nhân viên đang phát triển
          </div>
        );
      case "departments":
        return (
          <div className="text-center py-20">
            Trang quản lý bộ phận đang phát triển
          </div>
        );
      default:
        return <OverviewContent />;
    }
  };

  return (
    <div>
      <AdminHeader title="Dashboard" />

      <main className="py-8">
        <div className="px-4 sm:px-6 lg:px-8">
          {getTabContent()}
        </div>
      </main>
    </div>
  );
}
