import { useEffect, useState } from "react";
import { useApp } from "../contexts/AppContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "../components/ui/dialog";
import dayjs from "dayjs";
import { getCustomerOrders, cancelOrder } from "../services/api";
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
                  const mainImage = images.find(img => img.AnhChinh) || images[0];
                  const imageUrl = mainImage?.DuongDan || "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=600&fit=crop";
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
                        <div className="font-semibold">{ct.ChiTietSanPham?.SanPham?.TenSP}</div>
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
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={(e) => handleCancelOrder(order, e)}
                      >
                        Hủy đơn hàng
                      </Button>
                    )}
                    {order.TrangThaiDH?.TrangThai === "HOANTAT" && (
                      <>
                        <Button variant="outline">Đánh Giá</Button>
                        <Button variant="outline">Yêu Cầu Trả Hàng/Hoàn Tiền</Button>
                      </>
                    )}
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

      {/* Modal xác nhận hủy đơn hàng */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Xác nhận hủy đơn hàng</DialogTitle>
            <DialogDescription className="pt-2">
              Bạn có chắc chắn muốn hủy đơn hàng <strong>#{selectedOrder?.MaDDH}</strong> không?
              <br />
              <span className="text-sm text-gray-500 mt-2 block">
                Hành động này không thể hoàn tác.
              </span>
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="py-4">
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Mã đơn hàng:</span>
                  <span className="font-medium">#{selectedOrder.MaDDH}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Ngày đặt:</span>
                  <span className="font-medium">{dayjs(selectedOrder.NgayTao).format("DD/MM/YYYY")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tổng tiền:</span>
                  <span className="font-medium text-brand-600">
                    {formatPrice(selectedOrder.CT_DonDatHangs.reduce((sum, ct) => sum + Number(ct.DonGia) * ct.SoLuong, 0))}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={closeCancelModal}
              disabled={cancelLoading}
            >
              Không, giữ đơn hàng
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmCancelOrder}
              disabled={cancelLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelLoading ? "Đang hủy..." : "Có, hủy đơn hàng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}