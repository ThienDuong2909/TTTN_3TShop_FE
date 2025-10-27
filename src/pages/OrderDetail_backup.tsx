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
  Edit,
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

  const fetchOrderDetail = async (orderId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`https://api.3tshop.thienduong.info/api/orders/${orderId}/detail`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Lỗi khi tải thông tin đơn hàng');
      }
      
      if (result.success && result.data) {
        setOrderDetail(result.data);
      } else {
        throw new Error(result.message || 'Không tìm thấy thông tin đơn hàng');
      }
    } catch (err) {
      console.error('Error fetching order detail:', err);
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Có lỗi xảy ra</h3>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy đơn hàng</h3>
          <p className="text-gray-600 mb-4">Đơn hàng #{id} không tồn tại hoặc đã bị xóa.</p>
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
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Cập nhật trạng thái
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            In đơn hàng
          </Button>
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
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <Package className={`w-6 h-6 text-gray-400 ${item.SanPham.HinhAnh ? 'hidden' : ''}`} />
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
                  <Label className="text-xs font-medium text-gray-500">CCCD</Label>
                  <div className="bg-gray-50/50 rounded-lg p-3 border border-gray-200 mt-1">
                    <p className="font-medium text-sm">
                      {orderDetail.ThongTinKhachHang.CCCD}
                    </p>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs font-medium text-gray-500">Địa chỉ</Label>
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
                <Label className="text-xs font-medium text-gray-500">Người nhận</Label>
                <div className="bg-gray-50/50 rounded-lg p-3 border border-gray-200 mt-1">
                  <p className="font-medium text-sm">
                    {orderDetail.ThongTinNguoiNhan.HoTen}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-500">Số điện thoại</Label>
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

          {/* Invoice Information */}
          {orderDetail.ThongTinHoaDon ? (
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-[#825B32]/5 to-[#825B32]/10 py-3">
                <CardTitle className="flex items-center text-[#825B32] text-base">
                  <FileText className="w-4 h-4 mr-2" />
                  Thông tin hóa đơn
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-gray-500 text-sm">
                  Thông tin hóa đơn sẽ được hiển thị tại đây
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4 text-center">
                <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 mb-3 text-sm">Chưa có hóa đơn</p>
                <Button variant="outline" size="sm" className="text-[#825B32] border-[#825B32] hover:bg-[#825B32] hover:text-white">
                  Tạo hóa đơn
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
