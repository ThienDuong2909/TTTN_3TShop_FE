import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Truck,
  Calendar,
  CreditCard,
  FileText,
  Users,
  ShoppingBag,
  Badge as BadgeIcon,
  Palette,
  Ruler,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Label } from "../components/ui/label";
import { InvoiceView } from "../components/Invoice";
import { toast } from "sonner";
import { updateOrderStatus } from "../services/api";

// Additional API functions for order detail management
const getOrderDetailById = async (orderId: string) => {
  try {
    const response = await fetch(
      `http://localhost:8080/api/orders/${orderId}/detail`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      }
    );
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching order detail:", error);
    return { success: false, message: "Không thể tải thông tin đơn hàng" };
  }
};

const getInvoiceByOrderId = async (orderId: string) => {
  try {
    const response = await fetch(
      `http://localhost:8080/api/invoices/order/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      }
    );
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return { success: false, message: "Không thể tải thông tin hóa đơn" };
  }
};

const createInvoice = async (invoiceData: any) => {
  try {
    const response = await fetch("http://localhost:8080/api/invoices", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invoiceData),
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error creating invoice:", error);
    return { success: false, message: "Không thể tạo hóa đơn" };
  }
};

interface OrderDetail {
  ThongTinDonHang: {
    MaDDH: number;
    NgayTao: string;
    TrangThai: {
      Ma: number;
      Ten: string;
    };
    TongSoLuong: number;
    TongTien: number;
  };
  ThongTinNguoiNhan: {
    HoTen: string;
    SDT: string;
    DiaChi: string;
    ThoiGianGiao: string;
  };
  ThongTinKhachHang: {
    MaKH: number;
    TenKH: string;
    SDT: string;
    DiaChi: string;
    CCCD: string;
  };
  ThongTinXuLy: {
    NguoiDuyet: {
      MaNV: number;
      TenNV: string;
    };
    NguoiGiao: {
      MaNV: number;
      TenNV: string;
    };
  };
  DanhSachSanPham: Array<{
    MaCTDDH: number;
    MaCTSP: number;
    SoLuong: number;
    DonGia: number;
    ThanhTien: number;
    SoLuongTra: number;
    SanPham: {
      MaSP: number;
      TenSP: string;
      KichThuoc: string;
      MauSac: {
        TenMau: string;
        MaHex: string;
      };
      HinhAnh?: {
        MaAnh: number;
        TenFile: string;
        DuongDan: string;
      } | null;
    };
  }>;
  ThongTinHoaDon: any;
}

export const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for order approval
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvingOrder, setApprovingOrder] = useState(false);

  // States for order cancellation
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(false);

  // States for invoice creation
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  // States for invoice view
  const [showInvoiceView, setShowInvoiceView] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null);

  const fetchOrderDetail = async (orderId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await getOrderDetailById(orderId);

      if (result.success && result.data) {
        setOrderDetail(result.data);
      } else {
        throw new Error(result.message || "Không tìm thấy thông tin đơn hàng");
      }
    } catch (err) {
      console.error("Error fetching order detail:", err);
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrderDetail(id);
    }
  }, [id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  // Handle order approval
  const handleApproveOrder = () => {
    setShowApprovalModal(true);
  };

  // Confirm order approval
  const confirmApproveOrder = async () => {
    if (!orderDetail || !id) return;

    try {
      setApprovingOrder(true);

      // Get user info from localStorage or context (assuming user ID is 1 for now)
      const userId = 1; // You should get this from your auth context

      const result = await updateOrderStatus(parseInt(id), {
        maTTDH: 2, // Status "Đã duyệt"
        maNVDuyet: userId,
      });

      if (result.success) {
        // Show success message
        toast.success("Đã duyệt đơn hàng thành công");
        // Refresh order detail
        await fetchOrderDetail(id);
      } else {
        toast.error(result.message || "Có lỗi xảy ra khi duyệt đơn hàng");
      }
    } catch (error) {
      console.error("Error approving order:", error);
      toast.error("Không thể kết nối đến server");
    } finally {
      setApprovingOrder(false);
      setShowApprovalModal(false);
    }
  };

  // Handle order cancellation
  const handleCancelOrder = () => {
    setShowCancelModal(true);
  };

  // Confirm order cancellation
  const confirmCancelOrder = async () => {
    if (!orderDetail || !id) return;

    try {
      setCancellingOrder(true);

      // Get user info from localStorage or context (assuming user ID is 1 for now)
      const userId = 1; // You should get this from your auth context

      const result = await updateOrderStatus(parseInt(id), {
        maTTDH: 5, // Status "Hủy"
        maNVDuyet: userId,
      });

      if (result.success) {
        // Show success message
        toast.success("Đã hủy đơn hàng thành công");

        // Refresh order detail
        await fetchOrderDetail(id);
      } else {
        toast.error(result.message || "Có lỗi xảy ra khi hủy đơn hàng");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("Không thể kết nối đến server");
    } finally {
      setCancellingOrder(false);
      setShowCancelModal(false);
    }
  };

  // Handle invoice creation
  const handleCreateInvoice = () => {
    // If invoice already exists, show invoice view
    if (orderDetail?.ThongTinHoaDon) {
      // Try to get invoice number from orderDetail first, or fetch from API
      handleViewInvoice();
      return;
    }
    setShowInvoiceModal(true);
  };

  // Handle view invoice
  const handleViewInvoice = async () => {
    if (!orderDetail || !id) return;

    try {
      // If we already have invoice number, use it directly
      if (
        orderDetail.ThongTinHoaDon &&
        typeof orderDetail.ThongTinHoaDon === "object" &&
        "SoHD" in orderDetail.ThongTinHoaDon
      ) {
        setInvoiceNumber(orderDetail.ThongTinHoaDon.SoHD as string);
        setShowInvoiceView(true);
        return;
      }

      // Otherwise, get invoice by order ID
      const result = await getInvoiceByOrderId(id);

      if (result.success && result.data?.ThongTinHoaDon?.SoHD) {
        setInvoiceNumber(result.data.ThongTinHoaDon.SoHD);
        setShowInvoiceView(true);
      } else {
        toast.error("Không tìm thấy hóa đơn cho đơn hàng này");
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
      toast.error("Không thể lấy thông tin hóa đơn");
    }
  };

  // Confirm invoice creation
  const confirmCreateInvoice = async () => {
    if (!orderDetail || !id) return;

    // If invoice already exists, we could navigate to invoice detail or show invoice info
    if (orderDetail.ThongTinHoaDon) {
      toast.info("Đơn hàng này đã có hóa đơn");
      setShowInvoiceModal(false);
      return;
    }

    try {
      setCreatingInvoice(true);

      // Get user info from localStorage or context (assuming user ID is 1 for now)
      const userId = 1; // You should get this from your auth context

      const result = await createInvoice({
        maDDH: parseInt(id),
        maNVLap: userId,
      });

      if (result.success) {
        // Show success message
        toast.success("Đã tạo hóa đơn thành công");

        // Get invoice number from response and show invoice view
        if (result.data?.ThongTinHoaDon?.SoHD) {
          setInvoiceNumber(result.data.ThongTinHoaDon.SoHD);
          setTimeout(() => {
            setShowInvoiceView(true);
          }, 500); // Small delay to let the success message show
        }

        // Refresh order detail to show invoice info
        await fetchOrderDetail(id);
      } else {
        toast.error(result.message || "Có lỗi xảy ra khi tạo hóa đơn");
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Không thể kết nối đến server");
    } finally {
      setCreatingInvoice(false);
      setShowInvoiceModal(false);
    }
  };

  const getStatusBadge = (status: { Ma: number; Ten: string }) => {
    const statusConfig: Record<number, { className: string; icon: any }> = {
      1: { className: "bg-yellow-100 text-yellow-800", icon: Clock },
      2: { className: "bg-blue-100 text-blue-800", icon: CheckCircle },
      3: { className: "bg-purple-100 text-purple-800", icon: Truck },
      4: { className: "bg-green-100 text-green-800", icon: CheckCircle },
      5: { className: "bg-red-100 text-red-800", icon: AlertCircle },
    };

    const config = statusConfig[status.Ma] || statusConfig[1];
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full ${config.className}`}
      >
        <Icon className="w-4 h-4 mr-2" />
        {status.Ten}
      </span>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#825B32] mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Có lỗi xảy ra
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => id && fetchOrderDetail(id)} variant="outline">
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  // Not found state
  if (!orderDetail) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Không tìm thấy đơn hàng
          </h3>
          <p className="text-gray-600 mb-4">
            Đơn hàng #{id} không tồn tại hoặc đã bị xóa.
          </p>
          <Button onClick={() => navigate("/admin/orders")} variant="outline">
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/admin/orders")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Đơn hàng #{orderDetail.ThongTinDonHang.MaDDH}
            </h1>
            <p className="text-gray-600">
              Ngày tạo: {formatDate(orderDetail.ThongTinDonHang.NgayTao)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {getStatusBadge(orderDetail.ThongTinDonHang.TrangThai)}

          {/* Show approve button only for orders with status "Đã đặt" (id = 1) */}
          {orderDetail.ThongTinDonHang.TrangThai.Ma === 1 && (
            <Button
              variant="default"
              size="sm"
              onClick={handleApproveOrder}
              className="bg-[#825B32] hover:bg-[#825B32]/90 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Duyệt đơn hàng
            </Button>
          )}

          {/* Show cancel button only for orders with status "Đã đặt" (id = 1) */}
          {orderDetail.ThongTinDonHang.TrangThai.Ma === 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelOrder}
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Hủy đơn hàng
            </Button>
          )}

          {/* Show create invoice button only for orders with status "Đã duyệt" (id = 2) */}
          {orderDetail.ThongTinDonHang.TrangThai.Ma !== 1 && (
            <Button variant="default" size="sm" onClick={handleCreateInvoice}>
              <FileText className="w-4 h-4 mr-2" />
              {orderDetail.ThongTinHoaDon ? "Xem hóa đơn" : "Tạo hóa đơn"}
            </Button>
          )}

          {/* <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            In đơn hàng
          </Button> */}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <ShoppingBag className="h-6 w-6 text-[#825B32]" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-500">
                  Tổng số lượng
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {orderDetail.ThongTinDonHang.TongSoLuong}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CreditCard className="h-6 w-6 text-[#825B32]" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-500">Tổng tiền</p>
                <p className="text-lg font-bold text-[#825B32]">
                  {formatCurrency(orderDetail.ThongTinDonHang.TongTien)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calendar className="h-6 w-6 text-[#825B32]" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-500">
                  Thời gian giao
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {formatDate(orderDetail.ThongTinNguoiNhan.ThoiGianGiao)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Package className="h-6 w-6 text-[#825B32]" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-500">Sản phẩm</p>
                <p className="text-lg font-bold text-gray-900">
                  {orderDetail.DanhSachSanPham.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column - Order Information */}
        <div className="lg:col-span-2 space-y-4">
          {/* Products List */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#825B32]/5 to-[#825B32]/10 py-3">
              <CardTitle className="flex items-center text-[#825B32] text-base">
                <Package className="w-4 h-4 mr-2" />
                Danh sách sản phẩm
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {orderDetail.DanhSachSanPham.map((item) => (
                  <div
                    key={item.MaCTDDH}
                    className="flex items-start space-x-3 p-3 border border-gray-200 rounded-md"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {item.SanPham.HinhAnh ? (
                        <img
                          src={item.SanPham.HinhAnh.DuongDan}
                          alt={item.SanPham.TenSP}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            target.nextElementSibling?.classList.remove(
                              "hidden"
                            );
                          }}
                        />
                      ) : null}
                      <Package
                        className={`w-6 h-6 text-gray-400 ${
                          item.SanPham.HinhAnh ? "hidden" : ""
                        }`}
                      />
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 text-sm">
                            {item.SanPham.TenSP}
                          </h4>
                          <p className="text-xs text-gray-500">
                            Mã SP: {item.SanPham.MaSP}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-[#825B32] text-sm">
                            {formatCurrency(item.ThanhTien)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.SoLuong} x {formatCurrency(item.DonGia)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 text-xs">
                        <div className="flex items-center space-x-1">
                          <Palette className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-600">
                            {item.SanPham.MauSac.TenMau}
                          </span>
                          <div
                            className="w-3 h-3 rounded-full border border-gray-300"
                            style={{
                              backgroundColor: item.SanPham.MauSac.MaHex,
                            }}
                          />
                        </div>
                        <div className="flex items-center space-x-1">
                          <Ruler className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-600">
                            {item.SanPham.KichThuoc}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <BadgeIcon className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-600">
                            SL: {item.SoLuong}
                          </span>
                        </div>
                        {item.SoLuongTra > 0 && (
                          <div className="flex items-center space-x-1">
                            <AlertCircle className="w-3 h-3 text-red-400" />
                            <span className="text-red-600">
                              Đã trả: {item.SoLuongTra}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Tổng cộng:</span>
                <span className="text-[#825B32]">
                  {formatCurrency(orderDetail.ThongTinDonHang.TongTien)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#825B32]/5 to-[#825B32]/10 py-3">
              <CardTitle className="flex items-center text-[#825B32] text-base">
                <User className="w-4 h-4 mr-2" />
                Thông tin khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium text-gray-500">
                    Tên khách hàng
                  </Label>
                  <div className="bg-gradient-to-br from-[#825B32]/5 to-[#825B32]/10 rounded-lg p-3 border border-[#825B32]/20 mt-1">
                    <p className="font-medium text-sm">
                      {orderDetail.ThongTinKhachHang.TenKH}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500">
                    Mã khách hàng
                  </Label>
                  <div className="bg-gray-50/50 rounded-lg p-3 border border-gray-200 mt-1">
                    <p className="font-medium text-sm">
                      #{orderDetail.ThongTinKhachHang.MaKH}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500">
                    Số điện thoại
                  </Label>
                  <div className="bg-gray-50/50 rounded-lg p-3 border border-gray-200 mt-1">
                    <p className="font-medium text-sm">
                      {orderDetail.ThongTinKhachHang.SDT}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500">
                    CCCD
                  </Label>
                  <div className="bg-gray-50/50 rounded-lg p-3 border border-gray-200 mt-1">
                    <p className="font-medium text-sm">
                      {orderDetail.ThongTinKhachHang.CCCD}
                    </p>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs font-medium text-gray-500">
                    Địa chỉ
                  </Label>
                  <div className="bg-gray-50/50 rounded-lg p-3 border border-gray-200 mt-1">
                    <p className="font-medium text-sm">
                      {orderDetail.ThongTinKhachHang.DiaChi}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Delivery and Processing Info */}
        <div className="space-y-4">
          {/* Delivery Information */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#825B32]/5 to-[#825B32]/10 py-3">
              <CardTitle className="flex items-center text-[#825B32] text-base">
                <Truck className="w-4 h-4 mr-2" />
                Thông tin giao hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div>
                <Label className="text-xs font-medium text-gray-500">
                  Người nhận
                </Label>
                <div className="bg-gray-50/50 rounded-lg p-3 border border-gray-200 mt-1">
                  <p className="font-medium text-sm">
                    {orderDetail.ThongTinNguoiNhan.HoTen}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-500">
                  Số điện thoại
                </Label>
                <div className="bg-gray-50/50 rounded-lg p-3 border border-gray-200 mt-1">
                  <p className="font-medium text-sm">
                    {orderDetail.ThongTinNguoiNhan.SDT}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-500">
                  Địa chỉ giao hàng
                </Label>
                <div className="bg-gray-50/50 rounded-lg p-3 border border-gray-200 mt-1">
                  <p className="font-medium text-sm">
                    {orderDetail.ThongTinNguoiNhan.DiaChi}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-500">
                  Thời gian giao dự kiến
                </Label>
                <div className="bg-gradient-to-br from-[#825B32]/5 to-[#825B32]/10 rounded-lg p-3 border border-[#825B32]/20 mt-1">
                  <p className="font-medium text-sm">
                    {formatDateTime(orderDetail.ThongTinNguoiNhan.ThoiGianGiao)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Processing Information */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#825B32]/5 to-[#825B32]/10 py-3">
              <CardTitle className="flex items-center text-[#825B32] text-base">
                <Users className="w-4 h-4 mr-2" />
                Thông tin xử lý
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div>
                <Label className="text-xs font-medium text-gray-500">
                  Người duyệt đơn
                </Label>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="w-6 h-6 bg-[#825B32]/10 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-[#825B32]">
                      {orderDetail.ThongTinXuLy.NguoiDuyet.TenNV.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {orderDetail.ThongTinXuLy.NguoiDuyet.TenNV}
                    </p>
                    <p className="text-xs text-gray-500">
                      Mã NV: {orderDetail.ThongTinXuLy.NguoiDuyet.MaNV}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-xs font-medium text-gray-500">
                  Người giao hàng
                </Label>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="w-6 h-6 bg-[#825B32]/10 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-[#825B32]">
                      {orderDetail.ThongTinXuLy.NguoiGiao.TenNV.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {orderDetail.ThongTinXuLy.NguoiGiao.TenNV}
                    </p>
                    <p className="text-xs text-gray-500">
                      Mã NV: {orderDetail.ThongTinXuLy.NguoiGiao.MaNV}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Status History */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#825B32]/5 to-[#825B32]/10 py-3">
              <CardTitle className="flex items-center text-[#825B32] text-base">
                <Clock className="w-4 h-4 mr-2" />
                Lịch sử đơn hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-[#825B32]/10 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-[#825B32]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Đơn hàng được tạo</p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(orderDetail.ThongTinDonHang.NgayTao)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-[#825B32]/10 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-[#825B32]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Đơn hàng được duyệt</p>
                    <p className="text-xs text-gray-500">
                      Bởi {orderDetail.ThongTinXuLy.NguoiDuyet.TenNV}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-[#825B32]/10 rounded-full flex items-center justify-center">
                    <Truck className="w-3 h-3 text-[#825B32]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Đang giao hàng</p>
                    <p className="text-xs text-gray-500">
                      Giao bởi {orderDetail.ThongTinXuLy.NguoiGiao.TenNV}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Approval Confirmation Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-[#825B32]/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-[#825B32]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Xác nhận duyệt đơn hàng
                  </h3>
                  <p className="text-sm text-gray-500">
                    Đơn hàng #{orderDetail?.ThongTinDonHang.MaDDH}
                  </p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                Bạn có chắc chắn muốn duyệt đơn hàng này? Trạng thái đơn hàng sẽ
                được chuyển thành "Đã duyệt".
              </p>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowApprovalModal(false)}
                  disabled={approvingOrder}
                >
                  Hủy
                </Button>
                <Button
                  onClick={confirmApproveOrder}
                  disabled={approvingOrder}
                  className="bg-[#825B32] hover:bg-[#825B32]/90 text-white"
                >
                  {approvingOrder ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang duyệt...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Duyệt đơn hàng
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Xác nhận hủy đơn hàng
                  </h3>
                  <p className="text-sm text-gray-500">
                    Đơn hàng #{orderDetail?.ThongTinDonHang.MaDDH}
                  </p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể
                hoàn tác.
              </p>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancellingOrder}
                >
                  Hủy bỏ
                </Button>
                <Button
                  onClick={confirmCancelOrder}
                  disabled={cancellingOrder}
                  variant="destructive"
                >
                  {cancellingOrder ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang hủy...
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Xác nhận hủy
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Creation Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-[#825B32]/10 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#825B32]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Tạo hóa đơn cho đơn hàng
                  </h3>
                  <p className="text-sm text-gray-500">
                    Đơn hàng #{orderDetail?.ThongTinDonHang.MaDDH}
                  </p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                {orderDetail.ThongTinHoaDon
                  ? "Đơn hàng này đã có hóa đơn. Bạn có muốn xem chi tiết hóa đơn?"
                  : "Bạn có chắc chắn muốn tạo hóa đơn cho đơn hàng này? Hóa đơn sẽ được lưu vào hệ thống."}
              </p>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowInvoiceModal(false)}
                  disabled={creatingInvoice}
                >
                  Hủy
                </Button>
                <Button
                  onClick={confirmCreateInvoice}
                  disabled={creatingInvoice}
                  className="bg-[#825B32] hover:bg-[#825B32]/90 text-white"
                >
                  {creatingInvoice ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      {orderDetail.ThongTinHoaDon
                        ? "Xem hóa đơn"
                        : "Tạo hóa đơn"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice View Modal */}
      <InvoiceView
        isOpen={showInvoiceView}
        onClose={() => setShowInvoiceView(false)}
        invoiceNumber={invoiceNumber}
      />
    </div>
  );
};

export default OrderDetail;
