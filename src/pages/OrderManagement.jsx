import { useEffect, useState } from "react";
import { useApp } from "../contexts/AppContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { OrderCard } from "../components/OrderCard";
import { OrderDialogsContainer } from "../components/OrderDialogsContainer";
import dayjs from "dayjs";
import { getCustomerOrders, submitMultipleReviews, cancelOrder } from "../services/api";
import { useNavigate } from "react-router-dom";

const TABS = [
  { label: "Tất cả", value: "ALL" },
  { label: "Chờ Duyệt", value: "CHOXACNHAN" },
  { label: "Đang vận chuyển", value: "DANGGIAO" },
  { label: "Hoàn thành", value: "HOANTAT" },
  { label: "Đã huỷ", value: "DAHUY" },
];

const STATUS_MAP = {
  CHOXACNHAN: "Chờ duyệt",
  DANGGIAO: "Đang vận chuyển",
  HOANTAT: "Hoàn thành",
  DAHUY: "Đã huỷ",
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

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-[1200px]">
        <h1 className="text-2xl font-bold mb-6">Quản lý đơn hàng</h1>
        
        {/* Tabs */}
        <div className="flex space-x-2 bg-white rounded-t-lg border-b">
          {TABS.map(t => (
            <Button
              key={t.value}
              variant={tab === t.value ? "default" : "ghost"}
              className={`rounded-none border-b-2 ${tab === t.value ? "border-brand-600 text-brand-600" : "border-transparent"}`}
              onClick={() => setTab(t.value)}
            >
              {t.label}
            </Button>
          ))}
        </div>
        
        {/* Search */}
        <div className="bg-white px-4 py-3 border-b flex items-center">
          <Input
            placeholder="Bạn có thể tìm kiếm theo tên sản phẩm hoặc mã đơn hàng"
            className="w-full"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        
        {/* Orders */}
        <div className="space-y-6 mt-4">
          {loading ? (
            <div className="text-center py-12 text-lg">Đang tải đơn hàng...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Không có đơn hàng nào.</div>
          ) : (
            filteredOrders.map(order => (
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
            ))
          )}
        </div>
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