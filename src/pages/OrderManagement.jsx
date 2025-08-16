import { useEffect, useState } from "react";
import { useApp } from "../contexts/AppContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { OrderCard } from "../components/OrderCard";
import { OrderDialogsContainer } from "../components/OrderDialogsContainer";
import dayjs from "dayjs";
import { getCustomerOrders, submitMultipleReviews, cancelOrder } from "../services/api";
import { useNavigate } from "react-router-dom";
import { Search, Package, Clock, Truck, CheckCircle, XCircle, RotateCcw } from "lucide-react";

const TABS = [
  { label: "Tất cả", value: "ALL", icon: Package, color: "text-gray-600" },
  { label: "Chờ Duyệt", value: "CHOXACNHAN", icon: Clock, color: "text-yellow-600" },
  { label: "Đang vận chuyển", value: "DANGGIAO", icon: Truck, color: "text-blue-600" },
  { label: "Hoàn thành", value: "HOANTAT", icon: CheckCircle, color: "text-green-600" },
  { label: "Đã huỷ", value: "DAHUY", icon: XCircle, color: "text-red-600" },
  { label: "Trả hàng/Hoàn tiền", value: "TRAHANG", icon: RotateCcw, color: "text-purple-600" },
];

const STATUS_MAP = {
  CHOXACNHAN: { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  DANGGIAO: { label: "Đang vận chuyển", color: "bg-blue-100 text-blue-800", icon: Truck },
  HOANTAT: { label: "Hoàn thành", color: "bg-green-100 text-green-800", icon: CheckCircle },
  DAHUY: { label: "Đã huỷ", color: "bg-red-100 text-red-800", icon: XCircle },
  TRAHANG: { label: "Trả hàng/Hoàn tiền", color: "bg-purple-100 text-purple-800", icon: Package },
};

function formatPrice(price) {
  return Number(price).toLocaleString("vi-VN", { style: "currency", currency: "VND" });
}

export default function OrderManagement() {
  const { state } = useApp();
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [reviewDialog, setReviewDialog] = useState({
    isOpen: false,
    productsToReview: []
  });
  const [viewReviewsDialog, setViewReviewsDialog] = useState({
    isOpen: false,
    reviews: [],
    orderCode: ""
  });
  const [returnRequestDialog, setReturnRequestDialog] = useState({
    isOpen: false,
    order: null
  });
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!state.user?.id) return;
    loadOrders();
  }, [state.user?.id]);

  const loadOrders = () => {
    setLoading(true);
    getCustomerOrders(state.user.id)
      .then(setOrders)
      .finally(() => {
        setLoading(false);
      });
  };

  function normalizeString(str) {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // bỏ dấu tiếng Việt
      .replace(/\s+/g, ""); // bỏ khoảng trắng
  }

  const filteredOrders = orders.filter(order => {
    if (tab === "ALL") return true;
    return order.TrangThaiDH?.TrangThai === tab;
  }).filter(order => {
    if (!search.trim()) return true;
    const keyword = normalizeString(search.trim());
    return (
      order.MaDDH.toString().includes(keyword) ||
      (order.CT_DonDatHangs || []).some(ct =>
        normalizeString(ct.ChiTietSanPham?.SanPham?.TenSP || "").includes(keyword)
      )
    );
  });

  const handleCancelOrder = (order, event) => {
    event.stopPropagation(); // Ngăn chặn click event của div cha
    setSelectedOrder(order);
    setShowCancelModal(true);
  };

  const confirmCancelOrder = async () => {
    if (!selectedOrder) return;
    
    setCancelLoading(true);
    try {
      await cancelOrder(state.user.id, selectedOrder.MaDDH);
      
      // Refresh danh sách đơn hàng sau khi hủy thành công
      loadOrders();
      
      // Đóng modal và reset state
      setShowCancelModal(false);
      setSelectedOrder(null);
      
      // Hiển thị thông báo thành công (có thể dùng toast nếu có)
      // alert("Hủy đơn hàng thành công!");
      
    } catch (error) {
      console.error("Lỗi khi hủy đơn hàng:", error);
      alert("Có lỗi xảy ra khi hủy đơn hàng. Vui lòng thử lại!");
    } finally {
      setCancelLoading(false);
    }
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setSelectedOrder(null);
  };

  // Check if order has reviews
  const hasReviews = (order) => {
    return order.CT_DonDatHangs.some(ct => ct.BinhLuans && ct.BinhLuans.length > 0);
  };

  // Handle review click
  const handleReviewClick = (order) => {
    const productsToReview = order.CT_DonDatHangs
      .filter(ct => !ct.BinhLuans || ct.BinhLuans.length === 0)
      .map(ct => ({
        MaCTDonDatHang: ct.MaCTDDH,
        TenSP: ct.ChiTietSanPham?.SanPham?.TenSP || '',
        AnhSP: ct.ChiTietSanPham?.SanPham?.AnhSanPhams?.[0]?.DuongDan || '',
        KichThuoc: ct.ChiTietSanPham?.KichThuoc?.TenKichThuoc || '',
        MauSac: ct.ChiTietSanPham?.Mau?.TenMau || '',
        SoLuong: ct.SoLuong,
        DonGia: ct.DonGia || 0
      }));

    setReviewDialog({
      isOpen: true,
      productsToReview
    });
  };

  // Handle view reviews
  const handleViewReviews = (order) => {
    const reviews = [];
    order.CT_DonDatHangs.forEach(ct => {
      if (ct.BinhLuans && ct.BinhLuans.length > 0) {
        ct.BinhLuans.forEach(review => {
          reviews.push({
            ...review,
            TenSP: ct.ChiTietSanPham?.SanPham?.TenSP || '',
            AnhSP: ct.ChiTietSanPham?.SanPham?.AnhSanPhams?.[0]?.DuongDan || '',
            KichThuoc: ct.ChiTietSanPham?.KichThuoc?.TenKichThuoc || '',
            MauSac: ct.ChiTietSanPham?.Mau?.TenMau || ''
          });
        });
      }
    });

    setViewReviewsDialog({
      isOpen: true,
      reviews,
      orderCode: order.MaDDH.toString()
    });
  };

  // Handle review submitted
  const handleReviewSubmitted = () => {
    loadOrders(); // Refresh orders after review submission
  };

  // Handle return request
  const handleReturnRequest = (order) => {
    // Transform order data to match ReturnRequestDialog expected format
    const transformedOrder = {
      MaDDH: order.MaDDH,
      NgayTao: order.NgayTao,
      TrangThai: { 
        Ma: order.TrangThaiDH?.MaTTDH || 0, 
        Ten: STATUS_MAP[order.TrangThaiDH?.TrangThai] || order.TrangThaiDH?.Note 
      },
      TongTien: order.CT_DonDatHangs.reduce((sum, ct) => sum + Number(ct.DonGia) * ct.SoLuong, 0),
      DiaChiGiao: order.DiaChiGiao,
      SDTNguoiNhan: order.SDT,
      TenNguoiNhan: order.NguoiNhan,
      items: order.CT_DonDatHangs.map(ct => {
        const images = ct.ChiTietSanPham?.SanPham?.AnhSanPhams || [];
        const mainImage = images.find(img => img.AnhChinh) || images[0];
        const imageUrl = mainImage?.DuongDan || "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=600&fit=crop";
        
        return {
          MaCTDDH: ct.MaCTDDH,
          SanPham: {
            MaSP: ct.ChiTietSanPham?.MaSP || 0,
            TenSP: ct.ChiTietSanPham?.SanPham?.TenSP || '',
            AnhSP: imageUrl,
            KichThuoc: ct.ChiTietSanPham?.KichThuoc?.TenKichThuoc || '',
            MauSac: ct.ChiTietSanPham?.Mau?.TenMau || ''
          },
          SoLuong: ct.SoLuong,
          DonGia: Number(ct.DonGia),
          ThanhTien: Number(ct.DonGia) * ct.SoLuong
        };
      })
    };

    setReturnRequestDialog({
      isOpen: true,
      order: transformedOrder
    });
  };

  const handleReturnRequested = () => {
    // Refresh orders after return request is submitted
    loadOrders();
  };

  // Get active tab info
  const activeTab = TABS.find(t => t.value === tab);
  const ActiveIcon = activeTab?.icon || Package;

  return (
    <div>
      {/* Header */}
      
      
      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex flex-wrap">
            {TABS.map(t => {
              const TabIcon = t.icon;
              const isActive = tab === t.value;
              return (
                <Button
                  key={t.value}
                  variant="ghost"
                  className={`px-6 py-4 rounded-none border-b-2 transition-all duration-200 ${
                    isActive 
                      ? 'border-b-2 text-white shadow-md' 
                      : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                  style={isActive ? { 
                    backgroundColor: '#684827',
                    borderBottomColor: '#684827'
                  } : {}}
                  onClick={() => setTab(t.value)}
                >
                  <TabIcon className={`w-4 h-4 mr-2 ${isActive ? 'text-white' : t.color}`} />
                  {t.label}
                </Button>
              );
            })}
          </div>
        </div>
        
        {/* Search */}
        <div className="p-6 border-b border-gray-100" style={{ backgroundColor: '#fafafa' }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Bạn có thể tìm kiếm theo tên sản phẩm hoặc mã đơn hàng..."
              className="pl-10 pr-4 py-3 text-sm border-gray-200 focus:border-2 focus:ring-0"
              style={{ 
                borderColor: '#e5e7eb',
                '--tw-ring-color': '#684827'
              }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Active Tab Info */}
        <div className="px-6 py-4 border-b border-gray-100" style={{ backgroundColor: '#f8f9fa' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ActiveIcon className={`w-5 h-5 mr-3 ${activeTab?.color || 'text-gray-600'}`} />
              <div>
                <h3 className="font-semibold text-gray-800">
                  {activeTab?.label || 'Tất cả đơn hàng'}
                </h3>
                <p className="text-sm text-gray-500">
                  {loading ? 'Đang tải...' : `${filteredOrders.length} đơn hàng`}
                </p>
              </div>
            </div>
            {filteredOrders.length > 0 && (
              <div className="text-right">
                <p className="text-sm text-gray-500">Tổng giá trị</p>
                <p className="font-bold text-lg" style={{ color: '#684827' }}>
                  {formatPrice(
                    filteredOrders.reduce((total, order) => 
                      total + order.CT_DonDatHangs.reduce((sum, ct) => sum + Number(ct.DonGia) * ct.SoLuong, 0), 
                      0
                    )
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Orders */}
      <div className="mt-6">
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#684827' }}></div>
            <p className="text-gray-500">Đang tải danh sách đơn hàng...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              {activeTab ? (
                <ActiveIcon className={`w-8 h-8 ${activeTab.color}`} />
              ) : (
                <Package className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {search.trim() ? 'Không tìm thấy đơn hàng' : `Chưa có đơn hàng ${activeTab?.label.toLowerCase()}`}
            </h3>
            <p className="text-gray-500 mb-6">
              {search.trim() 
                ? 'Hãy thử tìm kiếm với từ khóa khác hoặc kiểm tra lại thông tin.' 
                : 'Khi bạn đặt hàng, chúng sẽ xuất hiện ở đây.'
              }
            </p>
            {search.trim() && (
              <Button 
                variant="outline" 
                onClick={() => setSearch('')}
                className="hover:bg-gray-50"
                style={{ borderColor: '#684827', color: '#684827' }}
              >
                Xóa bộ lọc
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <OrderCard
                key={order.MaDDH}
                order={order}
                formatPrice={formatPrice}
                STATUS_MAP={STATUS_MAP}
                hasReviews={hasReviews}
                handleCancelOrder={handleCancelOrder}
                handleViewReviews={handleViewReviews}
                handleReviewClick={handleReviewClick}
                handleReturnRequest={handleReturnRequest}
              />
            ))}
          </div>
        )}
      </div>

      {/* All Order Dialogs */}
      <OrderDialogsContainer
        reviewDialog={reviewDialog}
        setReviewDialog={setReviewDialog}
        onReviewSubmitted={handleReviewSubmitted}
        viewReviewsDialog={viewReviewsDialog}
        setViewReviewsDialog={setViewReviewsDialog}
        returnRequestDialog={returnRequestDialog}
        setReturnRequestDialog={setReturnRequestDialog}
        onReturnRequested={handleReturnRequested}
        showCancelModal={showCancelModal}
        closeCancelModal={closeCancelModal}
        selectedOrder={selectedOrder}
        confirmCancelOrder={confirmCancelOrder}
        cancelLoading={cancelLoading}
      />
    </div>
  );
}