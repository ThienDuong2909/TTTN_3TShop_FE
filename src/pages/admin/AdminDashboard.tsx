import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Users, FileText, DollarSign } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { useApp } from "../../contexts/AppContext";
import AdminHeader from "../../components/AdminHeader";
import RevenueReport from "./RevenueReport";
import InventoryDashboardSection from "../../components/admin/InventoryDashboardSection";
import ProfitDashboardSection from "../../components/admin/ProfitDashboardSection";

import { useNavigate } from "react-router-dom";
import {
  getCurrentMonthOrders,
  getAllEmployees,
  getPurchaseOrdersNCC,
} from "../../services/api";
import type {
  CurrentMonthOrdersData,
  GetAllEmployeesResponse,
  GetPurchaseOrdersNCCResponse,
} from "../../services/api";
import { orders } from "@/libs/data";

export default function AdminDashboard() {
  const { state } = useApp();
  const navigate = useNavigate();

  const [currentMonthData, setCurrentMonthData] =
    useState<CurrentMonthOrdersData | null>(null);
  const [employeesData, setEmployeesData] =
    useState<GetAllEmployeesResponse | null>(null);
  const [purchaseOrdersNCCData, setPurchaseOrdersNCCData] =
    useState<GetPurchaseOrdersNCCResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Check if user has permission to access admin dashboard
  const hasAdminAccess = state.user?.permissions?.includes("toanquyen");
  const hasOrderAssignedAccess = state.user?.permissions?.includes(
    "donhang.xem_duoc_giao"
  );
  const hasOrderViewAccess = state.user?.permissions?.includes("donhang.xem");

  // Load dashboard data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoadingStats(true);

      // Parallel API calls for better performance
      const [ordersResponse, employeesResponse, purchaseOrdersResponse] =
        await Promise.all([
          getCurrentMonthOrders(),
          getAllEmployees(),
          getPurchaseOrdersNCC(),
        ]);

      // Update state based on successful responses
      if (ordersResponse.success) {
        setCurrentMonthData(ordersResponse.data);
      }
      if (employeesResponse.success) {
        setEmployeesData(employeesResponse);
      }
      if (purchaseOrdersResponse.success) {
        setPurchaseOrdersNCCData(purchaseOrdersResponse);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      // Reset state on error
      setCurrentMonthData(null);
      setEmployeesData(null);
      setPurchaseOrdersNCCData(null);
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

  console.log("Dashboard Stats:", stats);

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

      {/* Inventory Dashboard Section with Charts */}
      <InventoryDashboardSection />

      {/* Profit Dashboard Section with Charts */}
      <ProfitDashboardSection />

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
                  .map((order: any) => {
                    const isApiData = currentMonthData && order.MaDDH;

                    return (
                      <TableRow key={isApiData ? order.MaDDH : order.id}>
                        <TableCell className="font-medium">
                          {isApiData ? `#${order.MaDDH}` : order.id}
                        </TableCell>
                        <TableCell>
                          {isApiData
                            ? order.KhachHang?.TenKH
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
                              ? mapOrderStatus(order.TrangThaiDH?.TrangThai)
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

  return (
    <div>
      <AdminHeader title="Dashboard" />

      <main className="py-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <OverviewContent />
        </div>
      </main>
    </div>
  );
}
