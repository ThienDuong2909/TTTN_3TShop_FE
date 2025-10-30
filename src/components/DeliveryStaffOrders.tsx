import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Package,
  Phone,
  Search,
} from "lucide-react";
import { memo, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { confirmOrderDelivery, getAssignedOrders } from "../services/api";
import AdminHeader from "./AdminHeader";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

// Order interfaces
interface OrderCustomer {
  MaKH: number;
  TenKH: string;
  SDT: string;
  DiaChi: string;
  CCCD: string;
}

interface OrderStatus {
  MaTTDH: number;
  TrangThai: string;
}

interface OrderProduct {
  MaSP: number;
  TenSP: string;
  MoTa: string;
}

interface OrderSize {
  MaKichThuoc: number;
  TenKichThuoc: string;
}

interface OrderColor {
  MaMau: number;
  TenMau: string;
  MaHex: string;
}

interface OrderProductDetail {
  MaCTSP: number;
  MaSP: number;
  MaKichThuoc: number;
  MaMau: number;
  SoLuongTon: number;
  SanPham: OrderProduct;
  KichThuoc: OrderSize;
  Mau: OrderColor;
}

interface OrderItem {
  MaCTDDH: number;
  MaDDH: number;
  MaCTSP: number;
  SoLuong: number;
  DonGia: string;
  MaPhieuTra: number | null;
  SoLuongTra: number;
  ChiTietSanPham: OrderProductDetail;
}

interface Order {
  MaDDH: number;
  NgayTao: string;
  DiaChiGiao: string;
  NguoiNhan: string;
  SDT: string;
  ThoiGianGiao: string;
  TongTien: number;
  KhachHang: OrderCustomer;
  TrangThaiDH: OrderStatus;
  CT_DonDatHangs: OrderItem[];
}

// Memoized SearchInput component
const SearchInput = memo(
  ({
    value,
    onChange,
    disabled,
    placeholder,
  }: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled: boolean;
    placeholder: string;
  }) => {
    return (
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="text-sm focus:outline-none focus:ring-0"
        />
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";

// Utility function to normalize Vietnamese text for search
const normalizeVietnameseText = (text: string): string => {
  if (!text) return "";

  let normalized = text.toLowerCase();
  normalized = normalized
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
    .replace(/[èéẹẻẽêềếệểễ]/g, "e")
    .replace(/[ìíịỉĩ]/g, "i")
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
    .replace(/[ùúụủũưừứựửữ]/g, "u")
    .replace(/[ỳýỵỷỹ]/g, "y")
    .replace(/[đ]/g, "d")
    .replace(/[ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ]/g, "a")
    .replace(/[ÈÉẸẺẼÊỀẾỆỂỄ]/g, "e")
    .replace(/[ÌÍỊỈĨ]/g, "i")
    .replace(/[ÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ]/g, "o")
    .replace(/[ÙÚỤỦŨƯỪỨỰỬỮ]/g, "u")
    .replace(/[ỲÝỴỶỸ]/g, "y")
    .replace(/[Đ]/g, "d");

  normalized = normalized.replace(/\s+/g, " ").trim();
  return normalized;
};

export default function DeliveryStaffOrders() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC" | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });

  // Confirm delivery states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [orderToConfirm, setOrderToConfirm] = useState<number | null>(null);
  const [confirmingOrder, setConfirmingOrder] = useState(false);

  // Order status mapping
  const ORDER_STATUSES = {
    "3": { label: "Đang giao", color: "default", icon: Package },
    "4": { label: "Hoàn tất", color: "outline", icon: CheckCircle },
  };

  // Fetch assigned orders
  const fetchAssignedOrders = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getAssignedOrders({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
      });

      if (result && result.success && result.data) {
        setOrders(result.data.orders || []);
        setPagination((prev) => ({
          ...prev,
          totalItems: result.data.pagination?.totalItems || 0,
          totalPages: result.data.pagination?.totalPages || 1,
          currentPage: result.data.pagination?.currentPage || 1,
        }));
      } else {
        setOrders([]);
        setPagination((prev) => ({
          ...prev,
          totalItems: 0,
          totalPages: 1,
          currentPage: 1,
        }));
      }
    } catch (error) {
      console.error("Error fetching assigned orders:", error);
      toast.error("Có lỗi xảy ra khi tải dữ liệu");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.itemsPerPage]);

  // Initial data load
  useEffect(() => {
    fetchAssignedOrders();
  }, [fetchAssignedOrders]);

  // Handle search input change
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    []
  );

  // Handle sort change
  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      if (sortOrder === "ASC") {
        setSortOrder("DESC");
      } else if (sortOrder === "DESC") {
        setSortBy(null);
        setSortOrder(null);
      } else {
        setSortOrder("ASC");
      }
    } else {
      setSortBy(field);
      setSortOrder("ASC");
    }
  };

  // Render sort icon for table headers
  const renderSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }

    if (sortOrder === "ASC") {
      return <ArrowUp className="h-4 w-4 text-primary" />;
    } else if (sortOrder === "DESC") {
      return <ArrowDown className="h-4 w-4 text-primary" />;
    }

    return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, currentPage: newPage }));
  };

  // Handle row click to view order detail
  const handleRowClick = (orderId: number) => {
    navigate(`/admin/orders/${orderId}`);
  };

  // Handle confirm delivery
  const handleConfirmDelivery = (orderId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setOrderToConfirm(orderId);
    setShowConfirmModal(true);
  };

  // Confirm delivery
  const confirmDelivery = async () => {
    if (!orderToConfirm) return;

    try {
      setConfirmingOrder(true);
      const result = await confirmOrderDelivery(orderToConfirm);

      if (result && result.success) {
        toast.success("Xác nhận giao hàng thành công");
        await fetchAssignedOrders();
      } else {
        toast.error(result?.message || "Có lỗi xảy ra khi xác nhận giao hàng");
      }
    } catch (error) {
      console.error("Error confirming delivery:", error);
      toast.error("Không thể kết nối đến server");
    } finally {
      setConfirmingOrder(false);
      setShowConfirmModal(false);
      setOrderToConfirm(null);
    }
  };

  // Filter orders based on search term
  const filteredOrders = orders.filter((order) => {
    if (!searchTerm.trim()) return true;

    const normalizedSearchTerm = normalizeVietnameseText(searchTerm);
    const normalizedOrderId = normalizeVietnameseText(
      order.MaDDH?.toString() || ""
    );
    const normalizedRecipientName = normalizeVietnameseText(
      order.NguoiNhan || ""
    );
    const normalizedPhone = normalizeVietnameseText(order.SDT || "");
    const normalizedCustomerName = normalizeVietnameseText(
      order.KhachHang?.TenKH || ""
    );

    return (
      normalizedOrderId.includes(normalizedSearchTerm) ||
      normalizedRecipientName.includes(normalizedSearchTerm) ||
      normalizedPhone.includes(normalizedSearchTerm) ||
      normalizedCustomerName.includes(normalizedSearchTerm)
    );
  });

  // Sort orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (!sortBy || !sortOrder) return 0;

    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case "MaDDH":
        aValue = a.MaDDH || 0;
        bValue = b.MaDDH || 0;
        break;
      case "NgayTao":
        aValue = new Date(a.NgayTao);
        bValue = new Date(b.NgayTao);
        break;
      case "TongTien":
        aValue = Number(a.TongTien) || 0;
        bValue = Number(b.TongTien) || 0;
        break;
      case "NguoiNhan":
        aValue = a.NguoiNhan || "";
        bValue = b.NguoiNhan || "";
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortOrder === "ASC" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "ASC" ? 1 : -1;
    return 0;
  });

  const getStatusBadge = (statusId: number) => {
    const status =
      ORDER_STATUSES[statusId.toString() as keyof typeof ORDER_STATUSES];
    if (!status) return <Badge variant="secondary">Không xác định</Badge>;

    switch (statusId) {
      case 3:
        return (
          <Badge variant="default" className="bg-blue-600">
            {status.label}
          </Badge>
        );
      case 4:
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            {status.label}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status.label}</Badge>;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate total items in order
  const getTotalItems = (order: Order) => {
    return (
      order.CT_DonDatHangs?.reduce((total, item) => total + item.SoLuong, 0) ||
      0
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader title="Đơn hàng được phân công" />

      <main className="py-6">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Đơn hàng được phân công
            </h1>
            <p className="text-gray-600 mt-2">
              Quản lý các đơn hàng được phân công cho bạn giao hàng
            </p>
          </div>

          {/* Orders Management */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Danh sách đơn hàng</CardTitle>
              <CardDescription>
                Các đơn hàng được phân công cho bạn giao hàng
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search Controls */}
              <div className="flex justify-start mb-6">
                <SearchInput
                  value={searchTerm}
                  onChange={handleSearchChange}
                  disabled={loading}
                  placeholder="Tìm kiếm theo tên, mã đơn hàng, số điện thoại"
                />
              </div>

              {/* Orders Table */}
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-sm text-muted-foreground">
                    Đang tải dữ liệu...
                  </div>
                </div>
              ) : sortedOrders.length === 0 ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-sm text-muted-foreground">
                    Không có đơn hàng nào được phân công
                  </div>
                </div>
              ) : (
                <>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead
                            className="text-xs font-semibold cursor-pointer hover:bg-muted/50 select-none"
                            onClick={() => handleSortChange("MaDDH")}
                          >
                            <div className="flex items-center gap-1">
                              Mã đơn hàng
                              {renderSortIcon("MaDDH")}
                            </div>
                          </TableHead>
                          <TableHead
                            className="text-xs font-semibold cursor-pointer hover:bg-muted/50 select-none"
                            onClick={() => handleSortChange("NguoiNhan")}
                          >
                            <div className="flex items-center gap-1">
                              Người nhận
                              {renderSortIcon("NguoiNhan")}
                            </div>
                          </TableHead>
                          <TableHead className="text-xs font-semibold">
                            Số lượng
                          </TableHead>
                          <TableHead
                            className="text-xs font-semibold cursor-pointer hover:bg-muted/50 select-none"
                            onClick={() => handleSortChange("TongTien")}
                          >
                            <div className="flex items-center gap-1">
                              Tổng tiền
                              {renderSortIcon("TongTien")}
                            </div>
                          </TableHead>
                          <TableHead className="text-xs font-semibold">
                            Trạng thái
                          </TableHead>
                          <TableHead
                            className="text-xs font-semibold cursor-pointer hover:bg-muted/50 select-none"
                            onClick={() => handleSortChange("NgayTao")}
                          >
                            <div className="flex items-center gap-1">
                              Ngày tạo
                              {renderSortIcon("NgayTao")}
                            </div>
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-center">
                            Thao tác
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedOrders.map((order) => (
                          <TableRow
                            key={order.MaDDH}
                            className="hover:bg-muted/30 cursor-pointer"
                            onClick={() => handleRowClick(order.MaDDH)}
                          >
                            <TableCell className="font-medium text-sm">
                              #{order.MaDDH.toString()}
                            </TableCell>
                            <TableCell className="text-sm">
                              <div>
                                <div className="font-medium">
                                  {order.NguoiNhan}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {order.SDT}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                  <MapPin className="h-3 w-3" />
                                  {order.DiaChiGiao}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {getTotalItems(order)}
                            </TableCell>
                            <TableCell className="font-medium text-sm">
                              {formatPrice(order.TongTien)}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(order.TrangThaiDH.MaTTDH)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDate(order.NgayTao)}
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-2">
                                {order.TrangThaiDH.MaTTDH === 3 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-3 text-xs text-green-600 border-green-600 hover:bg-green-50"
                                    title="Xác nhận giao hàng"
                                    onClick={(e) =>
                                      handleConfirmDelivery(order.MaDDH, e)
                                    }
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Xác nhận
                                  </Button>
                                )}
                                {order.TrangThaiDH.MaTTDH === 4 && (
                                  <span className="text-green-600 text-xs font-medium">
                                    Đã hoàn tất
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-muted-foreground">
                        Hiển thị{" "}
                        {(pagination.currentPage - 1) *
                          pagination.itemsPerPage +
                          1}{" "}
                        -{" "}
                        {Math.min(
                          pagination.currentPage * pagination.itemsPerPage,
                          pagination.totalItems
                        )}{" "}
                        của {pagination.totalItems} đơn hàng
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handlePageChange(pagination.currentPage - 1)
                          }
                          disabled={pagination.currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Trước
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from(
                            { length: Math.min(5, pagination.totalPages) },
                            (_, i) => {
                              const pageNumber =
                                pagination.currentPage <= 3
                                  ? i + 1
                                  : pagination.currentPage + i - 2;

                              if (pageNumber > pagination.totalPages)
                                return null;

                              return (
                                <Button
                                  key={pageNumber}
                                  variant={
                                    pageNumber === pagination.currentPage
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  onClick={() => handlePageChange(pageNumber)}
                                  className="w-8 h-8 p-0"
                                >
                                  {pageNumber}
                                </Button>
                              );
                            }
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handlePageChange(pagination.currentPage + 1)
                          }
                          disabled={
                            pagination.currentPage === pagination.totalPages
                          }
                        >
                          Sau
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Confirm Delivery Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Xác nhận giao hàng</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xác nhận đã giao hàng cho đơn hàng #
              {orderToConfirm}? Hành động này sẽ đánh dấu đơn hàng là hoàn tất.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              disabled={confirmingOrder}
            >
              Hủy
            </Button>
            <Button
              onClick={confirmDelivery}
              disabled={confirmingOrder}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {confirmingOrder ? "Đang xác nhận..." : "Xác nhận giao hàng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
