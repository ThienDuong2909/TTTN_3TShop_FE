import React from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

interface OrderCardProps {
  order: any;
  formatPrice: (price: number) => string;
  STATUS_MAP: Record<string, string>;
  hasReviews: (order: any) => boolean;
  handleCancelOrder: (order: any, event: React.MouseEvent) => void;
  handleViewReviews: (order: any) => void;
  handleReviewClick: (order: any) => void;
  handleReturnRequest: (order: any) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  formatPrice,
  STATUS_MAP,
  hasReviews,
  handleCancelOrder,
  handleViewReviews,
  handleReviewClick,
  handleReturnRequest,
}) => {
  const navigate = useNavigate();

  return (
    <div
      key={order.MaDDH}
      className="bg-white rounded-lg shadow p-4 cursor-pointer hover:ring-2 ring-brand-600 transition"
      onClick={() => navigate(`/orders/${order.MaDDH}`)}
    >
      <div className="flex items-center justify-between border-b pb-2 mb-2">
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-orange-500 text-white">
            Mã ĐH: {order.MaDDH}
          </Badge>
          <span className="text-gray-600 text-sm">
            Ngày đặt: {dayjs(order.NgayTao).format("DD-MM-YYYY")}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-green-100 text-green-700">
            {STATUS_MAP[order.TrangThaiDH?.TrangThai] ||
              order.TrangThaiDH?.Note}
          </Badge>
        </div>
      </div>

      {/* Danh sách sản phẩm */}
      {order.CT_DonDatHangs.map((ct: any) => {
        const images = ct.ChiTietSanPham?.SanPham?.AnhSanPhams || [];
        const mainImage = images.find((img: any) => img.AnhChinh) || images[0];
        const imageUrl =
          mainImage?.DuongDan ||
          "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=600&fit=crop";

        // Check if this product has been reviewed based on BinhLuans
        const hasProductReview = ct.BinhLuans && ct.BinhLuans.length > 0;

        return (
          <div
            key={ct.MaCTDDH}
            className="flex items-center py-2 border-b last:border-b-0"
          >
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
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-700 text-xs"
                  >
                    Đã đánh giá
                  </Badge>
                )}
              </div>
              <div className="text-sm text-gray-500">
                Phân loại: {ct.ChiTietSanPham?.SanPham?.TenSP} /{" "}
                {ct.ChiTietSanPham?.Mau?.TenMau} /{" "}
                {ct.ChiTietSanPham?.KichThuoc?.TenKichThuoc}
              </div>
              <div className="text-sm text-gray-500">x{ct.SoLuong}</div>
            </div>
            <div className="text-right min-w-[100px]">
              <div className="font-bold text-brand-600">
                {formatPrice(ct.DonGia)}
              </div>
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
        </div>
        <div>
          <span className="text-gray-600">Thành tiền: </span>
          <span className="font-bold text-lg text-brand-600">
            {formatPrice(
              order.CT_DonDatHangs.reduce(
                (sum: number, ct: any) => sum + Number(ct.DonGia) * ct.SoLuong,
                0
              )
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
