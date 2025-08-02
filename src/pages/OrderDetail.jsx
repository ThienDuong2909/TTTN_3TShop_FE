import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "../components/ui/dialog";
import { useApp } from "../contexts/AppContext";
import dayjs from "dayjs";
import { getOrderDetail, cancelOrder } from "../services/api";
import { ArrowLeft, User, MapPin, Phone, Truck, CheckCircle, Clock, Package } from "lucide-react";

const STATUS_MAP = {
  CHOXACNHAN: { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  DANGGIAO: { label: "Đang vận chuyển", color: "bg-blue-100 text-blue-800", icon: Truck },
  HOANTAT: { label: "Hoàn thành", color: "bg-green-100 text-green-800", icon: CheckCircle },
  DAHUY: { label: "Đã huỷ", color: "bg-red-100 text-red-800", icon: Package },
  TRAHANG: { label: "Trả hàng/Hoàn tiền", color: "bg-purple-100 text-purple-800", icon: Package },
};

function formatPrice(price) {
  return Number(price).toLocaleString("vi-VN", { style: "currency", currency: "VND" });
}

export default function OrderDetail() {
  const { id } = useParams();
  const { state } = useApp();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    if (!id || !state.user?.id) return;
    loadOrderDetail();
  }, [id, state.user?.id]);

  const loadOrderDetail = () => {
    setLoading(true);
    getOrderDetail({ maKH: state.user.id, maDDH: id })
      .then(res => setOrder(res))
      .finally(() => setLoading(false));
  };

  const handleCancelOrder = () => {
    setShowCancelModal(true);
  };

  const confirmCancelOrder = async () => {
    if (!order) return;
    
    setCancelLoading(true);
    try {
      await cancelOrder(state.user.id, order.MaDDH);
      loadOrderDetail();
      setShowCancelModal(false);
    } catch (error) {
      console.error("Lỗi khi hủy đơn hàng:", error);
    } finally {
      setCancelLoading(false);
    }
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#684827' }}></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container mx-auto px-4 max-w-[900px]">
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Không tìm thấy đơn hàng</h2>
            <p className="text-gray-500 mb-6">Đơn hàng bạn tìm kiếm không tồn tại hoặc đã bị xóa.</p>
            <Button 
              onClick={() => navigate("/orders")} 
              className="text-white hover:opacity-90"
              style={{ backgroundColor: '#684827' }}
            >
              Quay lại danh sách đơn hàng
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Lấy trạng thái
  const status = order.TrangThaiDH?.TrangThai;
  const statusInfo = STATUS_MAP[status] || { 
    label: order.TrangThaiDH?.Note, 
    color: "bg-gray-100 text-gray-800",
    icon: Package 
  };
  const StatusIcon = statusInfo.icon;

  // Nhân viên duyệt/giao
  const nguoiDuyet = order.NguoiDuyet?.TenNV || "Vẫn chưa xét duyệt";
  const nguoiGiao = order.NguoiGiao?.TenNV || "Hiện chưa phân công";

  // Tổng tiền
  const total = order.CT_DonDatHangs.reduce(
    (sum, ct) => sum + Number(ct.DonGia) * ct.SoLuong,
    0
  );

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-[1000px]">
        
        {/* Header với nút back */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)} 
            className="text-gray-600 hover:text-gray-800 p-2 -ml-2"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Quay lại
          </Button>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          
          {/* Header thông tin đơn hàng */}
          <div className="text-white p-6" style={{ background: `linear-gradient(to right, #684827, #5a3e22)` }}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2">Đơn hàng #{order.MaDDH}</h1>
                <p className="opacity-80">
                  Đặt ngày {dayjs(order.NgayTao).format("DD/MM/YYYY - HH:mm")}
                </p>
              </div>
              <div className="text-right">
                <Badge className={`${statusInfo.color} px-4 py-2 text-sm font-medium`}>
                  <StatusIcon className="w-4 h-4 mr-2" />
                  {statusInfo.label}
                </Badge>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Thông tin giao hàng và xử lý */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              
              {/* Thông tin người nhận */}
              <div className="bg-gray-50 rounded-lg p-5">
                <div className="flex items-center mb-4">
                  <div className="p-2 rounded-lg mr-3" style={{ backgroundColor: '#f3efeb' }}>
                    <User className="w-5 h-5" style={{ color: '#684827' }} />
                  </div>
                  <h3 className="font-semibold text-gray-800">Thông tin người nhận</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <User className="w-4 h-4 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">Người nhận</p>
                      <p className="font-medium text-gray-800">{order.NguoiNhan}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">Địa chỉ giao hàng</p>
                      <p className="font-medium text-gray-800">{order.DiaChiGiao}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Phone className="w-4 h-4 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">Số điện thoại</p>
                      <p className="font-medium text-gray-800">{order.SDT || "Chưa có"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thông tin xử lý */}
              <div className="bg-gray-50 rounded-lg p-5">
                <div className="flex items-center mb-4">
                  <div className="bg-green-100 p-2 rounded-lg mr-3">
                    <Truck className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Thông tin xử lý</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Nhân viên duyệt đơn</p>
                    <p className="font-medium text-gray-800">{nguoiDuyet}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nhân viên giao hàng</p>
                    <p className="font-medium text-gray-800">{nguoiGiao}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Thời gian giao hàng dự kiến</p>
                    <p className="font-medium text-gray-800">
                      {order.ThoiGianGiao 
                        ? dayjs(order.ThoiGianGiao).format("HH:mm - DD/MM/YYYY")
                        : "Chưa có thông tin"
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Chi tiết sản phẩm */}
            <div className="mb-8">
              <div className="flex items-center mb-6">
                <div className="bg-orange-100 p-2 rounded-lg mr-3">
                  <Package className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Chi tiết đơn hàng</h3>
              </div>
              
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                {order.CT_DonDatHangs.map((ct, index) => {
                  const images = ct.ChiTietSanPham?.SanPham?.AnhSanPhams || [];
                  const mainImage = images.find(img => img.AnhChinh) || images[0];
                  const imageUrl = mainImage?.DuongDan || "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=600&fit=crop";
                  
                  return (
                    <div key={ct.MaCTDDH} className={`flex items-center p-4 ${index !== order.CT_DonDatHangs.length - 1 ? 'border-b border-gray-200' : ''}`}>
                      <div className="w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                        <img
                          src={imageUrl}
                          alt={ct.ChiTietSanPham?.SanPham?.TenSP}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="flex-1 ml-4">
                        <h4 className="font-semibold text-gray-800 mb-1">
                          {ct.ChiTietSanPham?.SanPham?.TenSP}
                        </h4>
                        <p className="text-sm text-gray-500 mb-2">
                          {ct.ChiTietSanPham?.Mau?.TenMau} • {ct.ChiTietSanPham?.KichThuoc?.TenKichThuoc}
                        </p>
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="bg-gray-200 px-2 py-1 rounded text-xs">
                            Số lượng: {ct.SoLuong}
                          </span>
                        </div>
                      </div>
                      <div className="text-right min-w-[120px]">
                        <p className="text-lg font-bold" style={{ color: '#684827' }}>{formatPrice(ct.DonGia)}</p>
                        <p className="text-sm text-gray-500">
                          = {formatPrice(ct.DonGia * ct.SoLuong)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tổng cộng và thao tác */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between">
                <div className="flex space-x-3">
                  {status === "CHOXACNHAN" && (
                    <Button 
                      variant="outline" 
                      className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                      onClick={handleCancelOrder}
                    >
                      Hủy đơn hàng
                    </Button>
                  )}
                  {status === "HOANTAT" && (
                    <>
                      <Button 
                        variant="outline" 
                        className="hover:bg-orange-50"
                        style={{ borderColor: '#684827', color: '#684827' }}
                      >
                        Đánh giá
                      </Button>
                      <Button variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50">
                        Yêu cầu trả hàng
                      </Button>
                    </>
                  )}
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">Tổng thanh toán</p>
                  <p className="text-2xl font-bold" style={{ color: '#684827' }}>{formatPrice(total)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal xác nhận hủy đơn hàng */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Xác nhận hủy đơn hàng
            </DialogTitle>
            <DialogDescription className="pt-2">
              Bạn có chắc chắn muốn hủy đơn hàng <strong>#{order?.MaDDH}</strong> không?
              <br />
              <span className="text-sm text-gray-500 mt-2 block">
                Hành động này không thể hoàn tác.
              </span>
            </DialogDescription>
          </DialogHeader>
          
          {order && (
            <div className="py-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Mã đơn hàng:</span>
                  <span className="font-medium">#{order.MaDDH}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Ngày đặt:</span>
                  <span className="font-medium">{dayjs(order.NgayTao).format("DD/MM/YYYY")}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Trạng thái:</span>
                  <Badge className={`${statusInfo.color} text-xs`}>
                    {statusInfo.label}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-sm border-t pt-3">
                  <span className="text-gray-600">Tổng tiền:</span>
                  <span className="font-bold text-lg" style={{ color: '#684827' }}>
                    {formatPrice(total)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={closeCancelModal}
              disabled={cancelLoading}
              className="flex-1"
            >
              Giữ đơn hàng
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmCancelOrder}
              disabled={cancelLoading}
              className="bg-red-600 hover:bg-red-700 flex-1"
            >
              {cancelLoading ? "Đang hủy..." : "Hủy đơn hàng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}