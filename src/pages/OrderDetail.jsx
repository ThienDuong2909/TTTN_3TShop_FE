import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useApp } from "../contexts/AppContext";
import dayjs from "dayjs";
import { getOrderDetail } from "../services/api";

const STATUS_MAP = {
  CHOXACNHAN: "Chờ duyệt",
  DANGGIAO: "Đang vận chuyển",
  HOANTAT: "Hoàn thành",
  DAHUY: "Đã huỷ",
  TRAHANG: "Trả hàng/Hoàn tiền",
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

  useEffect(() => {
    if (!id || !state.user?.id) return;
    setLoading(true);
    getOrderDetail({ maKH: state.user.id, maDDH: id })
      .then(res => setOrder(res))
      .finally(() => setLoading(false));
  }, [id, state.user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!order) {
    return <div className="text-center py-16 text-lg">Không tìm thấy đơn hàng.</div>;
  }

  // Lấy trạng thái
  const status = order.TrangThaiDH?.TrangThai;
  const statusLabel = STATUS_MAP[status] || order.TrangThaiDH?.Note;

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
      <div className="container mx-auto px-4 max-w-[900px]">
        
        <div className="bg-white rounded-lg shadow p-12">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          &larr;
        </Button>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-lg font-bold">
                MÃ ĐƠN HÀNG: {order.MaDDH}
              </div>
              <div className="text-sm text-gray-500">
                Ngày đặt: {dayjs(order.NgayTao).format("DD-MM-YYYY")}
              </div>
            </div>
            <Badge variant="outline" className="bg-green-100 text-green-700 text-base">
              {statusLabel}
            </Badge>
          </div>

          {/* Thông tin trạng thái tiến trình
          <div className="flex items-center justify-between my-6">
            <div className="flex-1 flex flex-col items-center">
              <div className="rounded-full bg-green-500 text-white w-10 h-10 flex items-center justify-center mb-1">
                <i className="fa fa-file-alt" />
              </div>
              <div className="text-xs text-gray-700">Đơn Hàng Đã Đặt</div>
              <div className="text-xs text-gray-400">{dayjs(order.NgayTao).format("HH:mm DD-MM-YYYY")}</div>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <div className="rounded-full bg-green-500 text-white w-10 h-10 flex items-center justify-center mb-1">
                <i className="fa fa-dollar-sign" />
              </div>
              <div className="text-xs text-gray-700">Đã Thanh Toán</div>
              <div className="text-xs text-gray-400">{dayjs(order.NgayTao).format("HH:mm DD-MM-YYYY")}</div>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <div className="rounded-full bg-green-500 text-white w-10 h-10 flex items-center justify-center mb-1">
                <i className="fa fa-truck" />
              </div>
              <div className="text-xs text-gray-700">Đã Giao Cho ĐVVC</div>
              <div className="text-xs text-gray-400">{order.ThoiGianGiao ? dayjs(order.ThoiGianGiao).format("HH:mm DD-MM-YYYY") : "--"}</div>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <div className="rounded-full bg-green-500 text-white w-10 h-10 flex items-center justify-center mb-1">
                <i className="fa fa-check" />
              </div>
              <div className="text-xs text-gray-700">Đã Nhận Được Hàng</div>
              <div className="text-xs text-gray-400">{order.ThoiGianGiao ? dayjs(order.ThoiGianGiao).format("HH:mm DD-MM-YYYY") : "--"}</div>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <div className="rounded-full bg-green-500 text-white w-10 h-10 flex items-center justify-center mb-1">
                <i className="fa fa-star" />
              </div>
              <div className="text-xs text-gray-700">Đánh Giá</div>
            </div>
          </div> */}

          {/* Thông tin nhân viên */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
  {/* Cột trái: Thông tin người nhận */}
  <div className="bg-gray-50 rounded p-4">
    <div className="font-semibold mb-1">Thông tin người nhận</div>
    <div>Người nhận: {order.NguoiNhan}</div>
    <div>Địa chỉ: {order.DiaChiGiao}</div>
    <div>SĐT: {order.SDT || "Chưa có"}</div>
  </div>
  {/* Cột phải: Nhân viên duyệt và giao */}
  <div className="bg-gray-50 rounded p-4">
    <div className="font-semibold mb-1">Nhân viên xử lý</div>
    <div>
      <span className="font-medium">Duyệt đơn: </span>
      {nguoiDuyet}
    </div>
    <div>
      <span className="font-medium">Giao hàng: </span>
      {nguoiGiao}
    </div>
  </div>
</div>


          {/* Danh sách sản phẩm */}
          <div className="mb-6">
            <div className="font-semibold mb-2">Chi tiết đơn hàng</div>
            <div className="text-sm text-gray-500 mb-2">
                Ngày giao hàng dự kiến:{" "}
                {order.ThoiGianGiao
                ? dayjs(order.ThoiGianGiao).format("HH:mm DD-MM-YYYY")
                : "Chưa có"}
            </div>
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
          </div>

          {/* Tổng tiền và thao tác */}
          <div className="flex items-center justify-between mt-2">
            
            <div className="flex space-x-2">
              {status === "CHOXACNHAN" && (
                <Button variant="outline">Hủy đơn hàng</Button>
              )}
              {status === "HOANTAT" && (
                <>
                  <Button variant="outline">Đánh Giá</Button>
                  <Button variant="outline">Yêu Cầu Trả Hàng/Hoàn Tiền</Button>
                </>
              )}
            </div>
            <div>
              <span className="text-gray-600">Thành tiền: </span>
              <span className="font-bold text-lg text-brand-600">
                {formatPrice(total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}