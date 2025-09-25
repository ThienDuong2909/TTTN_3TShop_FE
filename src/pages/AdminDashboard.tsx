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
import RevenueReport from "../pages/RevenueReport";
import InventoryReport from "../pages/InventoryReport";
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

import { useNavigate } from "react-router-dom";
import {
  getCurrentMonthOrders,
  getAllEmployees,
  getPurchaseOrdersNCC,
  getInventoryReport,
} from "../services/api";
import type {
  CurrentMonthOrdersData,
  GetAllEmployeesResponse,
  GetPurchaseOrdersNCCResponse,
} from "../services/api";

// Inventory Report Types
interface InventoryItem {
  "Loại sản phẩm": string;
  "Mã sản phẩm": number;
  "Tên sản phẩm": string;
  "Số lượng tồn": string;
  "Giá nhập (trung bình)": string;
}

interface InventoryReportData {
  ngayBaoCao: string;
  data: InventoryItem[];
}
export default function AdminDashboard() {
  const { state } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  const [currentMonthData, setCurrentMonthData] =
    useState<CurrentMonthOrdersData | null>(null);
  const [employeesData, setEmployeesData] =
    useState<GetAllEmployeesResponse | null>(null);
  const [purchaseOrdersNCCData, setPurchaseOrdersNCCData] =
    useState<GetPurchaseOrdersNCCResponse | null>(null);
  const [currentInventoryData, setCurrentInventoryData] =
    useState<InventoryReportData | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Check if user has permission to access admin dashboard
  const hasAdminAccess = state.user?.permissions?.includes("toanquyen");
  const hasOrderAssignedAccess = state.user?.permissions?.includes(
    "donhang.xem_duoc_giao"
  );
  const hasOrderViewAccess = state.user?.permissions?.includes("donhang.xem");

  // Load current month orders data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoadingStats(true);

      // Get today's date for current inventory report
      const today = new Date().toISOString().split("T")[0];

      // Gọi cả API song song
      const [
        ordersResponse,
        employeesResponse,
        purchaseOrdersResponse,
        inventoryResponse,
      ] = await Promise.all([
        getCurrentMonthOrders(),
        getAllEmployees(),
        getPurchaseOrdersNCC(),
        getInventoryReport(today),
      ]);

      console.log("Orders response:", ordersResponse);
      console.log("Employees response:", employeesResponse);
      console.log("Inventory response:", inventoryResponse);

      if (ordersResponse.success) {
        setCurrentMonthData(ordersResponse.data);
      }

      if (employeesResponse.success) {
        setEmployeesData(employeesResponse);
      }
      if (purchaseOrdersResponse.success) {
        setPurchaseOrdersNCCData(purchaseOrdersResponse);
      }
      if (inventoryResponse.success) {
        setCurrentInventoryData(inventoryResponse.data);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      // Fallback to mock data if API fails
      setCurrentMonthData(null);
      setEmployeesData(null);
      setPurchaseOrdersNCCData(null);
      setCurrentInventoryData(null);
    } finally {
      setLoadingStats(false);
    }
  };

  const getCurrentMonthPurchaseOrdersCount = () => {
    if (!purchaseOrdersNCCData?.data) return 0;

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
    const currentYear = currentDate.getFullYear();

    return purchaseOrdersNCCData.data.filter((order) => {
      const orderDate = new Date(order.NgayDat);
      const orderMonth = orderDate.getMonth() + 1;
      const orderYear = orderDate.getFullYear();

      return orderMonth === currentMonth && orderYear === currentYear;
    }).length;
  };

  // Helper function để đếm phiếu đặt hàng theo trạng thái trong tháng hiện tại
  const getCurrentMonthPurchaseOrdersByStatus = (statusId: number) => {
    if (!purchaseOrdersNCCData?.data) return 0;

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    return purchaseOrdersNCCData.data.filter((order) => {
      const orderDate = new Date(order.NgayDat);
      const orderMonth = orderDate.getMonth() + 1;
      const orderYear = orderDate.getFullYear();

      return (
        orderMonth === currentMonth &&
        orderYear === currentYear &&
        order.MaTrangThai === statusId
      );
    }).length;
  };

  const mapOrderStatus = (trangThai: string | number) => {
    const statusMap = {
      CHOXACNHAN: "pending",
      DAXACNHAN: "confirmed",
      DANGGIAO: "shipping",
      HOANTAT: "delivered",
      DAHUY: "cancelled",
    };
    return statusMap[trangThai as keyof typeof statusMap] || "pending";
  };

  if (
    !state.user ||
    (!hasAdminAccess && !hasOrderAssignedAccess && !hasOrderViewAccess)
  ) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Không có quyền truy cập
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Bạn cần có quyền admin hoặc quyền xem đơn hàng để truy cập trang
            này.
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
      shipping: { label: "Đang giao", variant: "outline" as const },
      delivered: { label: "Hoàn tất", variant: "default" as const },
      cancelled: { label: "Đã hủy", variant: "destructive" as const },
      returned: { label: "Trả hàng", variant: "secondary" as const },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap];
    return (
      <Badge variant={statusInfo?.variant || "secondary"}>
        {statusInfo?.label || status}
      </Badge>
    );
  };

  const stats = {
    totalOrders:
      currentMonthData?.thongTinThang?.tongSoDonHang || orders.length,
    totalRevenue:
      currentMonthData?.orders?.reduce(
        (sum, order) => sum + order.TongTien,
        0
      ) || orders.reduce((sum, order) => sum + order.total, 0),
    totalEmployees: employeesData?.data?.length || 0,
    totalCustomers: 156,
    pendingOrders:
      currentMonthData?.orders?.filter(
        (o) => o.TrangThaiDH.TrangThai === "CHOXACNHAN"
      ).length || orders.filter((o) => o.status === "pending").length,
    confirmedOrders:
      currentMonthData?.orders?.filter(
        (o) => o.TrangThaiDH.TrangThai === "DAXACNHAN"
      ).length || orders.filter((o) => o.status === "confirmed").length,
    completedOrders:
      currentMonthData?.orders?.filter(
        (o) => o.TrangThaiDH.TrangThai === "HOANTAT"
      ).length || 0,
    cancelledOrders:
      currentMonthData?.orders?.filter(
        (o) => o.TrangThaiDH.TrangThai === "DA_HUY"
      ).length || 0,

    totalPurchaseOrdersNCC: getCurrentMonthPurchaseOrdersCount(),
    nhapPurchaseOrders: getCurrentMonthPurchaseOrdersByStatus(1), // Nhập
    daguiPurchaseOrders: getCurrentMonthPurchaseOrdersByStatus(2), // Đã gửi
    daxacnhanPurchaseOrders: getCurrentMonthPurchaseOrdersByStatus(3), // Đã xác nhận
    danhapmotphanPurchaseOrders: getCurrentMonthPurchaseOrdersByStatus(4), // Đã nhập một phần
    hoanthanhPurchaseOrders: getCurrentMonthPurchaseOrdersByStatus(5), // Hoàn thành
    huyPurchaseOrders: getCurrentMonthPurchaseOrdersByStatus(6), // Hủy
  };

  const getActiveEmployeesCount = () => {
    if (!employeesData?.data) return 0;

    return employeesData.data.filter((employee) => {
      // Kiểm tra có bộ phận đang làm việc không
      const hasActiveDepartment = employee.NhanVien_BoPhans.some(
        (dept) => dept.TrangThai === "DANGLAMVIEC" && dept.NgayKetThuc === null
      );
      return hasActiveDepartment;
    }).length;
  };

  // Helper function để đếm nhân viên theo vai trò
  const getEmployeesByRole = (role: string) => {
    if (!employeesData?.data) return 0;

    return employeesData.data.filter(
      (employee) => employee.TaiKhoan.VaiTro.TenVaiTro === role
    ).length;
  };
  console.log("Dashboard Stats:", stats);

  // Helper functions for inventory data
  const getInventoryByCategory = () => {
    if (!currentInventoryData?.data) return {};

    return currentInventoryData.data.reduce((acc, item) => {
      const category = item["Loại sản phẩm"];
      const quantity = parseInt(item["Số lượng tồn"]) || 0;
      const price = parseFloat(item["Giá nhập (trung bình)"]) || 0;
      const value = quantity * price;

      if (!acc[category]) {
        acc[category] = {
          totalQuantity: 0,
          totalValue: 0,
          itemCount: 0,
        };
      }

      acc[category].totalQuantity += quantity;
      acc[category].totalValue += value;
      acc[category].itemCount += 1;

      return acc;
    }, {} as Record<string, { totalQuantity: number; totalValue: number; itemCount: number }>);
  };

  const inventoryByCategory = getInventoryByCategory();
  const totalInventoryValue = Object.values(inventoryByCategory).reduce(
    (sum, category) => sum + category.totalValue,
    0
  );

  // Overview Dashboard
  const OverviewContent = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng đơn hàng tháng{" "}
              {currentMonthData?.thongTinThang?.thang ||
                new Date().getMonth() + 1}
              /
              {currentMonthData?.thongTinThang?.nam || new Date().getFullYear()}
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingStats ? (
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground mb-2">
                  + {stats.pendingOrders} đơn chờ duyệt
                </p>
                {/* Navigation button */}
                <div className="pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full flex items-center gap-1 text-xs h-8"
                    onClick={() => navigate("/admin/orders")}
                  >
                    <ShoppingCart className="h-3 w-3" />
                    Quản lý Đơn hàng
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Phiếu đặt hàng NCC
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingStats ? (
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold ">
                  {stats.totalPurchaseOrdersNCC}
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {purchaseOrdersNCCData
                    ? `Tháng ${
                        new Date().getMonth() + 1
                      }/${new Date().getFullYear()}`
                    : `Tổng phiếu đặt hàng`}
                </p>
                {/* Navigation button */}
                <div className="pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full flex items-center gap-1 text-xs h-8"
                    onClick={() => navigate("/admin/purchase-orders")}
                  >
                    <FileText className="h-3 w-3" />
                    Quản lý Phiếu đặt hàng NCC
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nhân viên</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingStats ? (
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.totalEmployees}</div>
                <p className="text-xs text-muted-foreground mb-2">
                  {employeesData
                    ? `${getActiveEmployeesCount()} đang làm việc`
                    : `Tổng số nhân viên`}
                </p>
                {/* Navigation button */}
                <div className="pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full flex items-center gap-1 text-xs h-8"
                    onClick={() => navigate("/admin/employees")}
                  >
                    <Users className="h-3 w-3" />
                    Quản lý Nhân viên
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Card Doanh thu với nút Báo cáo */}
        <Card className="relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium pr-2">
              Doanh thu tháng{" "}
              {currentMonthData?.thongTinThang?.thang ||
                new Date().getMonth() + 1}
              /
              {currentMonthData?.thongTinThang?.nam || new Date().getFullYear()}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingStats ? (
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatPrice(stats.totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {currentMonthData
                    ? `${stats.completedOrders} đơn hoàn tất`
                    : "Tổng doanh thu tháng"}
                </p>
                {/* Nút Báo cáo doanh thu */}
                <div className="pt-1">
                  <RevenueReport />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Current Inventory Report Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Tồn kho hiện tại
            </CardTitle>
            <div className="scale-90">
              <InventoryReport />
            </div>
          </div>
          <CardDescription>
            {currentInventoryData
              ? `Tính đến ngày ${formatDate(
                  currentInventoryData.ngayBaoCao
                )} - Tổng trị giá: ${formatPrice(totalInventoryValue)}`
              : "Báo cáo tồn kho theo loại sản phẩm"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingStats ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 border rounded"
                >
                  <div className="space-y-1">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : currentInventoryData ? (
            <div className="space-y-4">
              {/* Grid display for inventory categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(inventoryByCategory).map(([category, data]) => (
                  <div
                    key={category}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors bg-white dark:bg-gray-800 shadow-sm"
                  >
                    <div className="space-y-2">
                      <div className="font-semibold text-lg text-primary">
                        {category}
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Số sản phẩm:
                          </span>
                          <span className="font-medium">{data.itemCount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Tồn kho:
                          </span>
                          <span className="font-medium">
                            {data.totalQuantity.toLocaleString("vi-VN")}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t">
                          <span className="text-sm font-medium">Trị giá:</span>
                          <span className="font-bold text-primary">
                            {formatPrice(data.totalValue)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Không thể tải dữ liệu tồn kho
              </p>
              <InventoryReport />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Orders section */}
      <Card>
        <CardHeader>
          <CardTitle>Đơn hàng gần đây</CardTitle>
          <CardDescription>
            {currentMonthData
              ? `Tháng ${currentMonthData.thongTinThang.thang}/${currentMonthData.thongTinThang.nam} - ${currentMonthData.thongTinThang.tongSoDonHang} đơn hàng`
              : "Danh sách đơn hàng mới nhất cần xử lý"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingStats ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đơn</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày đặt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(currentMonthData?.orders || orders)
                  .slice(0, 5)
                  .map((order) => {
                    const isApiData = currentMonthData && order.MaDDH;

                    return (
                      <TableRow key={isApiData ? order.MaDDH : order.id}>
                        <TableCell className="font-medium">
                          {isApiData ? `#${order.MaDDH}` : order.id}
                        </TableCell>
                        <TableCell>
                          {isApiData
                            ? order.KhachHang.TenKH
                            : order.customerName}
                        </TableCell>
                        <TableCell>
                          {formatPrice(
                            isApiData ? order.TongTien : order.total
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(
                            isApiData
                              ? mapOrderStatus(order.TrangThaiDH.TrangThai)
                              : order.status
                          )}
                        </TableCell>
                        <TableCell>
                          {formatDate(
                            isApiData ? order.NgayTao : order.orderDate
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          )}
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
                        (sub) => sub.id === product.category
                      )
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
                      state.user?.permissions?.includes(
                        "donhang.capnhat_trangthai"
                      ) ||
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

  useEffect(() => {
    // Determine activeTab based on current path
    const path = location.pathname;
    if (path === "/admin" || path === "/admin/dashboard") {
      setActiveTab("dashboard");
    }
  }, [location.pathname]);
  // Get content component based on active tab
  const getTabContent = () => {
    switch (activeTab) {
      case "dashboard":
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
        <div className="px-4 sm:px-6 lg:px-8">{getTabContent()}</div>
      </main>
    </div>
  );
}
