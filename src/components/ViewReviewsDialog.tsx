import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import dayjs from "dayjs";

interface ReviewItem {
  MaBL: number;
  MaCTDDH: number;
  MoTa: string;
  SoSao: number;
  NgayBinhLuan: string;
  KhachHang: {
    MaKH: number;
    TenKH: string;
  };
  SanPham: {
    MaSP: number;
    TenSP: string;
    ChiTiet: {
      MaCTSP: number;
      KichThuoc: {
        MaKichThuoc: number;
        TenKichThuoc: string;
      };
      MauSac: {
        MaMau: number;
        TenMau: string;
        MaHex: string;
      };
    };
    HinhAnh: {
      MaAnh: number;
      TenFile: string;
      DuongDan: string;
      AnhChinh: boolean;
      ThuTu: number;
    };
  };
  ThongTinDonHang: {
    SoLuong: number;
    DonGia: number;
    ThanhTien: number;
  };
}

interface ViewReviewsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reviews: ReviewItem[];
  orderCode: string;
}

export const ViewReviewsDialog: React.FC<ViewReviewsDialogProps> = ({
  isOpen,
  onClose,
  reviews,
  orderCode,
}) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between text-xl font-bold">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center">
                <Star className="w-4 h-4 text-white fill-white" />
              </div>
              <span>Đánh giá của bạn</span>
            </div>
            <Badge
              variant="outline"
              className="bg-brand-600 text-white border-brand-600"
            >
              Đơn hàng #{orderCode}
            </Badge>
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            Bạn đã đánh giá {reviews.length} sản phẩm trong đơn hàng này
          </p>
        </DialogHeader>

        {/* Summary */}
        {reviews.length > 0 && (
          <div className="mt-6 p-4 bg-brand-50 rounded-lg border border-brand-100 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-brand-800">
                  Đánh giá tổng quan
                </p>
                <p className="text-sm text-brand-600">
                  Điểm trung bình:{" "}
                  <span className="font-semibold">
                    {(
                      reviews.reduce((sum, r) => sum + r.SoSao, 0) /
                      reviews.length
                    ).toFixed(1)}{" "}
                    sao
                  </span>
                  {" • "}
                  <span>{reviews.length} đánh giá</span>
                </p>
              </div>
              <div className="flex items-center gap-1">
                {renderStars(
                  Math.round(
                    reviews.reduce((sum, r) => sum + r.SoSao, 0) /
                      reviews.length
                  )
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto mt-4">
          <div className="space-y-4 pr-2">
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Chưa có đánh giá
                </h3>
                <p className="text-gray-500">
                  Bạn chưa đánh giá sản phẩm nào trong đơn hàng này
                </p>
              </div>
            ) : (
              reviews.map((review) => (
                <div
                  key={review.MaBL}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                >
                  {/* Product Info with Image */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={review.SanPham.HinhAnh.DuongDan}
                        alt={review.SanPham.TenSP}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {review.SanPham.TenSP}
                      </h4>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {review.SanPham.ChiTiet.MauSac.TenMau}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {review.SanPham.ChiTiet.KichThuoc.TenKichThuoc}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span>SL: {review.ThongTinDonHang.SoLuong}</span>
                        <span className="mx-2">•</span>
                        <span>
                          {review.ThongTinDonHang.DonGia.toLocaleString(
                            "vi-VN"
                          )}
                          ₫
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 mb-2">
                        {renderStars(review.SoSao)}
                      </div>
                      <p className="text-xs text-gray-500">
                        {dayjs(review.NgayBinhLuan).format("DD/MM/YYYY HH:mm")}
                      </p>
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-brand-600 mb-3">
                    <p className="text-gray-700 leading-relaxed">
                      {review.MoTa}
                    </p>
                  </div>

                  {/* Rating Summary */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={review.SoSao >= 4 ? "default" : "secondary"}
                        className={
                          review.SoSao >= 4
                            ? "bg-green-100 text-green-800 border-green-200"
                            : review.SoSao >= 3
                            ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                            : "bg-red-100 text-red-800 border-red-200"
                        }
                      >
                        {review.SoSao} sao
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {review.SoSao >= 4
                          ? "Rất hài lòng"
                          : review.SoSao >= 3
                          ? "Hài lòng"
                          : review.SoSao >= 2
                          ? "Bình thường"
                          : "Không hài lòng"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
