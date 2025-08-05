import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { submitReview } from "@/services/api";
import { toast } from "sonner";

interface ProductToReview {
  maCTSP: number;
  tenSP: string;
  tenMau: string;
  tenKichThuoc: string;
  soLuong: number;
  donGia: number;
  maCTDonDatHang: number;
  existingReview?: {
    soSao: number;
    moTa: string;
  };
}

interface SimpleReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productToReview: ProductToReview | null;
  onReviewSubmitted?: () => void;
}

export const SimpleReviewDialog: React.FC<SimpleReviewDialogProps> = ({
  isOpen,
  onClose,
  productToReview,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState<any>(null);

  // Reset form when dialog opens/closes or product changes
  useEffect(() => {
    if (isOpen && productToReview) {
      if (productToReview.existingReview) {
        setRating(productToReview.existingReview.soSao);
        setComment(productToReview.existingReview.moTa);
        setExistingReview(productToReview.existingReview);
      } else {
        setRating(0);
        setComment("");
        setExistingReview(null);
      }
    } else {
      setRating(0);
      setComment("");
      setExistingReview(null);
    }
  }, [isOpen, productToReview]);

  const handleSubmit = async () => {
    if (!productToReview) {
      toast.error("Không tìm thấy thông tin sản phẩm");
      return;
    }

    if (rating === 0) {
      toast.error("Vui lòng chọn số sao đánh giá");
      return;
    }

    if (!comment.trim()) {
      toast.error("Vui lòng nhập nhận xét về sản phẩm");
      return;
    }

    try {
      setIsSubmitting(true);

      const reviewData = {
        MaCTDonDatHang: productToReview.maCTDonDatHang,
        MoTa: comment.trim(),
        SoSao: rating,
      };

      await submitReview(reviewData);

      toast.success(
        existingReview
          ? "Cập nhật đánh giá thành công!"
          : "Gửi đánh giá thành công!"
      );

      // Call callback to refresh parent data
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }

      handleCancel();
    } catch (error: any) {
      console.error("Lỗi khi gửi đánh giá:", error);
      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra khi gửi đánh giá"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setRating(0);
    setComment("");
    setExistingReview(null);
    onClose();
  };

  if (!productToReview) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingReview ? "Chỉnh sửa đánh giá" : "Đánh giá sản phẩm"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="font-medium text-sm">{productToReview.tenSP}</p>
            <p className="text-xs text-gray-600">
              Màu: {productToReview.tenMau} | Kích thước:{" "}
              {productToReview.tenKichThuoc}
            </p>
            <p className="text-xs text-gray-600">
              Số lượng: {productToReview.soLuong} | Đơn giá:{" "}
              {productToReview.donGia.toLocaleString()}₫
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Đánh giá của bạn *
            </label>
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="text-2xl focus:outline-none transition-colors disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  <Star
                    className={`w-6 h-6 ${
                      (hoveredRating || rating) >= star
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500">
              {rating > 0 && `Bạn đã chọn ${rating} sao`}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nhận xét *</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
              rows={4}
              className="w-full"
              disabled={isSubmitting}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/500 ký tự
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || !comment.trim() || isSubmitting}
          >
            {isSubmitting
              ? "Đang gửi..."
              : existingReview
              ? "Cập nhật"
              : "Gửi đánh giá"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
