import React, { useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, Clock, Truck, CheckCircle, Package } from "lucide-react";

interface OrderCardProps {
  order: any;
  formatPrice: (price: number) => string;
  STATUS_MAP: Record<string, any>; // Thay đổi từ Record<string, string> thành Record<string, any>
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
  const [isExpanded, setIsExpanded] = useState(false);

  // Logic hiển thị sản phẩm
  const allProducts = order.CT_DonDatHangs || [];
  const maxDisplayProducts = 2;
  const hasMoreProducts = allProducts.length > maxDisplayProducts;
  const displayedProducts = allProducts.slice(0, maxDisplayProducts);
  const hiddenProducts = allProducts.slice(maxDisplayProducts);
  const remainingCount = allProducts.length - maxDisplayProducts;

  // Lấy thông tin trạng thái
  const status = order.TrangThaiDH?.TrangThai;
  const statusInfo = STATUS_MAP[status] || { 
    label: order.TrangThaiDH?.Note, 
    color: "bg-gray-100 text-gray-800",
    icon: Package 
  };
  const StatusIcon = statusInfo.icon;

  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsExpanded(!isExpanded);
  };

  const renderProduct = (ct: any) => {
    const images = ct.ChiTietSanPham?.SanPham?.AnhSanPhams || [];
    const mainImage = images.find((img: any) => img.AnhChinh) || images[0];
    const imageUrl =
      mainImage?.DuongDan ||
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=600&fit=crop";

    // Check if this product has been reviewed based on BinhLuans
    const hasProductReview = ct.BinhLuans && ct.BinhLuans.length > 0;
    
    // Tính tổng giá cho sản phẩm này
    const donGia = Number(ct.DonGia);
    const soLuong = ct.SoLuong;
    const tongGia = donGia * soLuong;

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
          <div className="flex items-center gap-2 mt-2">
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
              Size: <strong>{ct.ChiTietSanPham?.KichThuoc?.TenKichThuoc}</strong>
            </span>
            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">
              Màu: <strong>{ct.ChiTietSanPham?.Mau?.TenMau}</strong>
            </span>
            <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs">
              Số lượng: <strong>{soLuong}</strong>
            </span>
          </div>
        </div>
        <div className="text-right min-w-[140px]">
          <div className="text-sm text-gray-500">
            {formatPrice(donGia)} x {soLuong}
          </div>
          <div className="font-bold text-brand-600">
            = {formatPrice(tongGia)}
          </div>
        </div>
      </div>
    );
  };

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
          <Badge className={`${statusInfo.color} px-3 py-1`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusInfo.label}
          </Badge>
        </div>
      </div>

      {/* Danh sách sản phẩm - Hiển thị luôn 2 sản phẩm đầu */}
      {displayedProducts.map(renderProduct)}

      {/* Sản phẩm ẩn với animation */}
      {hasMoreProducts && (
        <div 
          className={`overflow-hidden transition-all duration-500 ease-in-out ${
            isExpanded 
              ? 'max-h-[1000px] opacity-100' 
              : 'max-h-0 opacity-0'
          }`}
          style={{
            transform: isExpanded ? 'translateY(0)' : 'translateY(-10px)',
          }}
        >
          <div className="space-y-0">
            {hiddenProducts.map(renderProduct)}
          </div>
        </div>
      )}

      {/* Button Xem thêm/Thu gọn */}
      {hasMoreProducts && (
        <div className="flex justify-center py-2">
          <button
            onClick={toggleExpanded}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium transition-all duration-200 hover:scale-105"
          >
            <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
              <ChevronDown className="w-4 h-4" />
            </div>
            <span className="transition-all duration-200">
              {isExpanded ? 'Thu gọn' : `Xem thêm ${remainingCount} sản phẩm`}
            </span>
          </button>
        </div>
      )}

      {/* Tổng tiền và thao tác */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex space-x-2">
          {order.TrangThaiDH?.TrangThai === "CHOXACNHAN" && (
            <Button
              variant="outline"
              className="text-red-600 border-red-600 hover:bg-red-50 transition-colors duration-200"
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
                  className="text-blue-600 border-blue-600 hover:bg-blue-50 transition-colors duration-200"
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
                  className="transition-colors duration-200"
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
                className="transition-colors duration-200"
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