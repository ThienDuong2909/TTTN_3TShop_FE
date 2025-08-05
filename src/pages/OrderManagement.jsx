import { useEffect, useState } from "react";
import { useApp } from "../contexts/AppContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { MultiProductReviewDialog } from "../components/MultiProductReviewDialog";
import { ViewReviewsDialog } from "../components/ViewReviewsDialog";
import { ReturnRequestDialog } from "../components/ReturnRequestDialog";
import dayjs from "dayjs";
import { getCustomerOrders, submitMultipleReviews } from "../services/api";
import { useNavigate } from "react-router-dom";

const TABS = [
  { label: "Tất cả", value: "ALL" },
  { label: "Chờ Duyệt", value: "CHOXACNHAN" },
  { label: "Đang vận chuyển", value: "DANGGIAO" },
  { label: "Hoàn thành", value: "HOANTAT" },
  { label: "Đã huỷ", value: "DAHUY" },
  // { label: "Trả hàng/Hoàn tiền", value: "TRAHANG" },
];

const STATUS_MAP = {
  CHOXACNHAN: "Chờ duyệt",
  DANGGIAO: "Đang vận chuyển",
  HOANTAT: "Hoàn thành",
  DAHUY: "Đã huỷ",
  // TRAHANG: "Trả hàng/Hoàn tiền",
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
  const navigate = useNavigate();

useEffect(() => {
  if (!state.user?.id) return;
  setLoading(true);
  getCustomerOrders(state.user.id)
    .then(setOrders)
    .finally(() => {
        setLoading(false)
    });
}, [state.user?.id]);

// Check if order has reviews based on DanhSachBinhLuan
const hasReviews = (order) => {
  return order.DanhSachBinhLuan && order.DanhSachBinhLuan.length > 0;
};

// Handle view existing reviews
const handleViewReviews = (order) => {
  setViewReviewsDialog({
    isOpen: true,
    reviews: order.DanhSachBinhLuan || [],
    orderCode: order.MaDDH.toString()
  });
};

const handleReviewClick = (order) => {
  // Chuẩn bị sản phẩm chưa được đánh giá trong đơn hàng
  if (order.CT_DonDatHangs && order.CT_DonDatHangs.length > 0) {
    // Filter products that haven't been reviewed (based on CT_DonDatHangs.BinhLuans)
    const productsToReview = order.CT_DonDatHangs
      .filter(ct => !ct.BinhLuans || ct.BinhLuans.length === 0) // Only products without reviews
      .map(ct => {
        // Get product image
        const images = ct.ChiTietSanPham?.SanPham?.AnhSanPhams || [];
        const mainImage = images.find(img => img.AnhChinh) || images[0];
        const imageUrl = mainImage?.DuongDan || "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=600&fit=crop";
        
        return {
          maCTSP: ct.ChiTietSanPham?.MaCTSP || 0,
          tenSP: ct.ChiTietSanPham?.SanPham?.TenSP || '',
          tenMau: ct.ChiTietSanPham?.Mau?.TenMau || '',
          tenKichThuoc: ct.ChiTietSanPham?.KichThuoc?.TenKichThuoc || '',
          soLuong: ct.SoLuong,
          donGia: ct.DonGia,
          maCTDonDatHang: ct.MaCTDDH || 0,
          imageUrl: imageUrl
        };
      });
    
    // Check if there are products to review
    if (productsToReview.length === 0) {
      // All products have been reviewed, show view reviews instead
      handleViewReviews(order);
      return;
    }
    
    setReviewDialog({
      isOpen: true,
      productsToReview
    });
  }
};

const handleReviewSubmitted = () => {
  // Refresh orders after review is submitted
  if (state.user?.id) {
    getCustomerOrders(state.user.id).then(setOrders);
  }
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
  if (state.user?.id) {
    getCustomerOrders(state.user.id).then(setOrders);
  }
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
              <div key={order.MaDDH} className="bg-white rounded-lg shadow p-4 cursor-pointer hover:ring-2 ring-brand-600 transition"
                  onClick={() => navigate(`/orders/${order.MaDDH}`)}>
                <div className="flex items-center justify-between border-b pb-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-orange-500 text-white">Mã ĐH: {order.MaDDH}</Badge>
                    <span className="text-gray-600 text-sm">Ngày đặt: {dayjs(order.NgayTao).format("DD-MM-YYYY")}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-green-100 text-green-700">
                      {STATUS_MAP[order.TrangThaiDH?.TrangThai] || order.TrangThaiDH?.Note}
                    </Badge>
                  </div>
                </div>
                {/* Danh sách sản phẩm */}
                {order.CT_DonDatHangs.map(ct => {
                    const images = ct.ChiTietSanPham?.SanPham?.AnhSanPhams || [];
                    console.log
                    const mainImage = images.find(img => img.AnhChinh) || images[0];
                    const imageUrl = mainImage?.DuongDan || "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=600&fit=crop";
                    
                    // Check if this product has been reviewed based on BinhLuans
                    const hasProductReview = ct.BinhLuans && ct.BinhLuans.length > 0;
                    
                    return (
                        <div key={ct.MaCTDDH} className="flex items-center py-2 border-b last:border-b-0">
                        <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
                            <img
                            src={imageUrl}
                            alt={ct.ChiTietSanPham?.SanPham?.TenSP}
                            className="object-cover w-full h-full"
                            />
                        </div>
                        <div className="flex-1 ml-4">
                            <div className="font-semibold flex items-center gap-2">
                              {ct.ChiTietSanPham?.SanPham?.TenSP}
                              {hasProductReview && (
                                <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                  Đã đánh giá
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                            Phân loại: {ct.ChiTietSanPham?.SanPham?.TenSP} / {ct.ChiTietSanPham?.Mau?.TenMau} / {ct.ChiTietSanPham?.KichThuoc?.TenKichThuoc}
                            </div>
                            <div className="text-sm text-gray-500">x{ct.SoLuong}</div>
                        </div>
                        <div className="text-right min-w-[100px]">
                            <div className="font-bold text-brand-600">{formatPrice(ct.DonGia)}</div>
                        </div>
                        </div>
                    );
                    })}
                {/* Tổng tiền và thao tác */}
                <div className="flex items-center justify-between mt-2">
                <div className="flex space-x-2">
                    {order.TrangThaiDH?.TrangThai === "CHOXACNHAN" && (
                    <Button 
                      variant="outline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Hủy đơn hàng
                    </Button>
                    )}
                    {order.TrangThaiDH?.TrangThai === "HOANTAT" && (
                    <>
                        {hasReviews(order) ? (
                          <Button 
                            variant="outline" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewReviews(order);
                            }}
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          >
                            Xem đánh giá
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReviewClick(order);
                            }}
                          >
                            Đánh Giá
                          </Button>
                        )}
                        <Button 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReturnRequest(order);
                          }}
                        >
                          Yêu Cầu Trả Hàng/Hoàn Tiền
                        </Button>
                    </>
                    )}
                    {/* Các trạng thái khác không hiện gì */}
                </div>
                <div>
                    <span className="text-gray-600">Thành tiền: </span>
                    <span className="font-bold text-lg text-brand-600">
                    {formatPrice(order.CT_DonDatHangs.reduce((sum, ct) => sum + Number(ct.DonGia) * ct.SoLuong, 0))}
                    </span>
                </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Review Dialog */}
      <MultiProductReviewDialog
        isOpen={reviewDialog.isOpen}
        onClose={() => setReviewDialog({ isOpen: false, productsToReview: [] })}
        productsToReview={reviewDialog.productsToReview}
        onReviewSubmitted={handleReviewSubmitted}
      />

      {/* View Reviews Dialog */}
      <ViewReviewsDialog
        isOpen={viewReviewsDialog.isOpen}
        onClose={() => setViewReviewsDialog({ isOpen: false, reviews: [], orderCode: "" })}
        reviews={viewReviewsDialog.reviews}
        orderCode={viewReviewsDialog.orderCode}
      />

      {/* Return Request Dialog */}
      <ReturnRequestDialog
        isOpen={returnRequestDialog.isOpen}
        onClose={() => setReturnRequestDialog({ isOpen: false, order: null })}
        order={returnRequestDialog.order}
        onReturnRequested={handleReturnRequested}
      />
    </div>
  );
}