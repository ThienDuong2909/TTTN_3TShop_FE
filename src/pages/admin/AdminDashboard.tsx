import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  ShoppingCart,
  Users,
  FileText,
  TrendingUp,
  DollarSign,
} from "lucide-react";
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
import InventoryReport from "./InventoryReport";
import ProfitReport from "./ProfitReport";
import { orders } from "../../libs/data";

import { useNavigate } from "react-router-dom";
import {
  getCurrentMonthOrders,
  getAllEmployees,
  getPurchaseOrdersNCC,
  getInventoryReport,
  getProfitReport,
} from "../../services/api";
import type {
  CurrentMonthOrdersData,
  GetAllEmployeesResponse,
  GetPurchaseOrdersNCCResponse,
} from "../../services/api";

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

// Profit Report Types
interface ProfitSummary {
  tongTriGiaNhapTotal: number;
  tongTriGiaXuatTotal: number;
  tongLoiNhuan: number;
  phanTramLoiNhuanTrungBinh: number;
  tongTriGiaNhapTotalFormatted: string;
  tongTriGiaXuatTotalFormatted: string;
  tongLoiNhuanFormatted: string;
  phanTramLoiNhuanTrungBinhFormatted: string;
  soLuongSanPham: number;
}

interface ProfitCategoryData {
  totalGiaNhap: number;
  totalGiaXuat: number;
  totalLoiNhuan: number;
  itemCount: number;
  phanTramLoiNhuan: number;
}

interface ProfitReportData {
  summary: ProfitSummary;
  ngayBatDau: string;
  ngayKetThuc: string;
  data?: any[]; // Add data property for API response
}
export default function AdminDashboard() {
  const { state } = useApp();
  const navigate = useNavigate();

  const [currentMonthData, setCurrentMonthData] =
    useState<CurrentMonthOrdersData | null>(null);
  const [employeesData, setEmployeesData] =
    useState<GetAllEmployeesResponse | null>(null);
  const [purchaseOrdersNCCData, setPurchaseOrdersNCCData] =
    useState<GetPurchaseOrdersNCCResponse | null>(null);
  const [currentInventoryData, setCurrentInventoryData] =
    useState<InventoryReportData | null>(null);
  const [currentProfitData, setCurrentProfitData] =
    useState<ProfitReportData | null>(null);
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

      const today = new Date().toISOString().split("T")[0];
      const currentDate = new Date();
      const firstDayOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const monthStart = firstDayOfMonth.toISOString().split("T")[0];

      // Parallel API calls for better performance
      const [
        ordersResponse,
        employeesResponse,
        purchaseOrdersResponse,
        inventoryResponse,
        profitResponse,
      ] = await Promise.all([
        getCurrentMonthOrders(),
        getAllEmployees(),
        getPurchaseOrdersNCC(),
        getInventoryReport(today),
        getProfitReport(monthStart, today),
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
      if (inventoryResponse.success) {
        setCurrentInventoryData(inventoryResponse.data);
      }
      if (profitResponse.success) {
        setCurrentProfitData(profitResponse.data);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      // Reset state on error
      setCurrentMonthData(null);
      setEmployeesData(null);
      setPurchaseOrdersNCCData(null);
      setCurrentInventoryData(null);
      setCurrentProfitData(null);
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

  // Helper function for profit data by category
  const getProfitByCategory = (): Record<string, ProfitCategoryData> => {
    if (!currentProfitData?.data || !Array.isArray(currentProfitData.data)) {
      return {};
    }

    return currentProfitData.data.reduce(
      (acc: Record<string, ProfitCategoryData>, item: any) => {
        const category = item.loaiSanPham || item["Loại sản phẩm"] || "Khác";
        const giaNhap = parseFloat(item.tongTriGiaNhap) || 0;
        const giaXuat = parseFloat(item.tongTriGiaXuat) || 0;
        const loiNhuan = parseFloat(item.loiNhuan) || 0;

        if (!acc[category]) {
          acc[category] = {
            totalGiaNhap: 0,
            totalGiaXuat: 0,
            totalLoiNhuan: 0,
            itemCount: 0,
            phanTramLoiNhuan: 0,
          };
        }

        acc[category].totalGiaNhap += giaNhap;
        acc[category].totalGiaXuat += giaXuat;
        acc[category].totalLoiNhuan += loiNhuan;
        acc[category].itemCount += 1;

        // Calculate average profit percentage for category
        if (acc[category].totalGiaNhap > 0) {
          acc[category].phanTramLoiNhuan =
            (acc[category].totalLoiNhuan / acc[category].totalGiaNhap) * 100;
        }

        return acc;
      },
      {}
    );
  };

  const profitByCategory = getProfitByCategory();

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

      {/* Current Profit Report Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Lợi nhuận sản phẩm tháng hiện tại
            </CardTitle>
            <div className="scale-90">
              <ProfitReport />
            </div>
          </div>
          <CardDescription>
            {currentProfitData
              ? `Từ ngày ${formatDate(
                  currentProfitData.ngayBatDau
                )} đến ${formatDate(
                  currentProfitData.ngayKetThuc
                )} - Tổng lợi nhuận: ${
                  currentProfitData.summary.tongLoiNhuanFormatted
                }`
              : "Báo cáo lợi nhuận sản phẩm theo tháng"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingStats ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 border rounded"
                >
                  <div className="space-y-1">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : currentProfitData ? (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <Card className="p-3">
                  <div className="text-xs text-muted-foreground">
                    Tổng trị giá nhập
                  </div>
                  <div className="text-sm font-bold">
                    {currentProfitData.summary.tongTriGiaNhapTotalFormatted}
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="text-xs text-muted-foreground">
                    Tổng trị giá bán
                  </div>
                  <div className="text-sm font-bold">
                    {currentProfitData.summary.tongTriGiaXuatTotalFormatted}
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="text-xs text-muted-foreground">
                    Tổng lợi nhuận
                  </div>
                  <div className="text-sm font-bold">
                    {currentProfitData.summary.tongLoiNhuanFormatted}
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="text-xs text-muted-foreground">
                    % Lợi nhuận TB
                  </div>
                  <div className="text-sm font-bold">
                    {
                      currentProfitData.summary
                        .phanTramLoiNhuanTrungBinhFormatted
                    }
                  </div>
                </Card>
              </div>

              {/* Profit by Category Grid */}
              {Object.keys(profitByCategory).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">
                    Lợi nhuận theo loại sản phẩm
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(profitByCategory).map(
                      ([category, data]) => (
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
                                <span className="font-medium">
                                  {data.itemCount}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">
                                  Trị giá nhập:
                                </span>
                                <span className="font-medium">
                                  {formatPrice(data.totalGiaNhap)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">
                                  Trị giá xuất:
                                </span>
                                <span className="font-medium">
                                  {formatPrice(data.totalGiaXuat)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center pt-1 border-t">
                                <span className="text-sm font-medium">
                                  Lợi nhuận:
                                </span>
                                <span
                                  className={`font-bold ${
                                    data.totalLoiNhuan > 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {formatPrice(data.totalLoiNhuan)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">
                                  % Lợi nhuận:
                                </span>
                                <span
                                  className={`font-medium ${
                                    data.phanTramLoiNhuan > 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {data.phanTramLoiNhuan.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {currentProfitData.summary.soLuongSanPham} sản phẩm được
                    phân tích
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Trong khoảng thời gian từ{" "}
                    {formatDate(currentProfitData.ngayBatDau)} đến{" "}
                    {formatDate(currentProfitData.ngayKetThuc)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Không thể tải dữ liệu lợi nhuận
              </p>
              <ProfitReport />
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
