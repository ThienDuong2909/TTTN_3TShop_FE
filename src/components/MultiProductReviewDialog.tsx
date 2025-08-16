import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatVietnameseCurrency } from "@/lib/utils";
import { submitMultipleReviews } from "@/services/api";
import { ArrowLeft, ArrowRight, CheckCircle, Star } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface ProductToReview {
  MaCTSP: number;
  TenSP: string;
  MauSac: string;
  KichThuoc: string;
  SoLuong: number;
  DonGia: number;
  MaCTDonDatHang: number;
  imageUrl?: string;
  existingReview?: {
    SoSao: number;
    MoTa: string;
  };
}

interface ProductReview {
  maCTDonDatHang: number;
  soSao: number;
  moTa: string;
}

interface MultiProductReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productsToReview: ProductToReview[];
  onReviewSubmitted?: () => void;
}

export const MultiProductReviewDialog: React.FC<
  MultiProductReviewDialogProps
> = ({ isOpen, onClose, productsToReview, onReviewSubmitted }) => {
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [reviews, setReviews] = useState<Record<number, ProductReview>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const currentProduct = productsToReview[currentProductIndex];
  const currentReview = reviews[currentProduct?.MaCTDonDatHang] || {
    maCTDonDatHang: currentProduct?.MaCTDonDatHang || 0,
    soSao: currentProduct?.existingReview?.SoSao || 0,
    moTa: currentProduct?.existingReview?.MoTa || "",
  };

  // Debug logging
  console.log("MultiProductReviewDialog - productsToReview:", productsToReview);
  console.log(
    "MultiProductReviewDialog - currentProductIndex:",
    currentProductIndex
  );
  console.log("MultiProductReviewDialog - currentProduct:", currentProduct);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen && productsToReview.length > 0) {
      setCurrentProductIndex(0);
      // Initialize reviews with existing reviews if any
      const initialReviews: Record<number, ProductReview> = {};
      productsToReview.forEach((product) => {
        if (product.existingReview) {
          initialReviews[product.MaCTDonDatHang] = {
            maCTDonDatHang: product.MaCTDonDatHang,
            soSao: product.existingReview.SoSao,
            moTa: product.existingReview.MoTa,
          };
        }
      });
      setReviews(initialReviews);
    } else {
      setCurrentProductIndex(0);
      setReviews({});
    }
  }, [isOpen, productsToReview]);

  const updateCurrentReview = (
    field: "soSao" | "moTa",
    value: number | string
  ) => {
    if (!currentProduct) return;

    setReviews((prev) => ({
      ...prev,
      [currentProduct.MaCTDonDatHang]: {
        ...currentReview,
        [field]: value,
      },
    }));
  };

  const hasReviewForProduct = (productIndex: number) => {
    const product = productsToReview[productIndex];
    if (!product) return false;
    const review = reviews[product.MaCTDonDatHang];
    return review && review.soSao > 0 && review.moTa.trim().length > 0;
  };

  const goToNextProduct = () => {
    if (currentProductIndex < productsToReview.length - 1) {
      setCurrentProductIndex(currentProductIndex + 1);
    }
  };

  const goToPreviousProduct = () => {
    if (currentProductIndex > 0) {
      setCurrentProductIndex(currentProductIndex - 1);
    }
  };

  const handleSubmitAllReviews = async () => {
    try {
      setIsSubmitting(true);

      // Validate all reviews
      const validReviews = Object.values(reviews).filter(
        (review) => review.soSao > 0 && review.moTa.trim().length > 0
      );

      if (validReviews.length === 0) {
        toast.error("Vui lòng hoàn thành ít nhất một đánh giá");
        return;
      }

      // Submit all valid reviews using the new batch API
      const reviewsToSubmit = validReviews.map((review) => ({
        maCTDonDatHang: review.maCTDonDatHang,
        moTa: review.moTa.trim(),
        soSao: review.soSao,
      }));

      await submitMultipleReviews(reviewsToSubmit);

      toast.success(`Gửi thành công ${validReviews.length} đánh giá sản phẩm!`);

      // Call callback to refresh parent data
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }

      handleClose();
    } catch (error: any) {
      console.error("Lỗi khi gửi đánh giá:", error);
      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra khi gửi đánh giá"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentProductIndex(0);
    setReviews({});
    setHoveredRating(0);
    onClose();
  };

  if (!isOpen) return null;

  if (!productsToReview || productsToReview.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Đánh giá sản phẩm</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-gray-600">Không có sản phẩm nào để đánh giá.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (!currentProduct) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Đánh giá sản phẩm</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-gray-600">Không thể tải thông tin sản phẩm.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const completedReviews = Object.values(reviews).filter(
    (review) => review.soSao >= 0 && review.moTa.trim().length > 0
  ).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Đánh giá sản phẩm</span>
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Đã hoàn thành: {completedReviews}/{productsToReview.length} sản phẩm
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {currentProduct?.imageUrl && (
                <div className="w-16 h-16 bg-white rounded overflow-hidden flex-shrink-0">
                  <img
                    src={currentProduct.imageUrl}
                    alt={currentProduct?.TenSP || "Sản phẩm"}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {currentProduct?.TenSP || "Không có tên sản phẩm"}
                </p>
                <p className="text-xs text-gray-600">
                  Màu: {currentProduct?.MauSac || "N/A"} | Kích thước:{" "}
                  {currentProduct?.KichThuoc || "N/A"}
                </p>
                <p className="text-xs text-gray-600">
                  Số lượng: {currentProduct?.SoLuong || 0} | Đơn giá:{" "}
                  {formatVietnameseCurrency(currentProduct?.DonGia)}
                </p>
              </div>
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Đánh giá của bạn *
            </label>
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => updateCurrentReview("soSao", star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="text-2xl focus:outline-none transition-colors disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  <Star
                    className={`w-7 h-7 ${
                      (hoveredRating || currentReview.soSao) >= star
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500">
              {currentReview.soSao > 0 &&
                `Bạn đã chọn ${currentReview.soSao} sao`}
            </p>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium mb-2">Nhận xét *</label>
            <Textarea
              value={currentReview.moTa}
              onChange={(e) => updateCurrentReview("moTa", e.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
              rows={4}
              className="w-full"
              disabled={isSubmitting}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {currentReview.moTa.length}/500 ký tự
            </p>
          </div>

          {/* Progress indicators */}
          {productsToReview.length > 1 && (
            <div className="flex justify-center space-x-2">
              {productsToReview.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full border-2 flex items-center justify-center ${
                    index === currentProductIndex
                      ? "border-blue-500 bg-blue-500"
                      : hasReviewForProduct(index)
                      ? "border-green-500 bg-green-500"
                      : "border-gray-300"
                  }`}
                >
                  {hasReviewForProduct(index) &&
                    index !== currentProductIndex && (
                      <CheckCircle className="w-2 h-2 text-white" />
                    )}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            {productsToReview.length > 1 && (
              <>
                <Button
                  variant="outline"
                  onClick={goToPreviousProduct}
                  disabled={currentProductIndex === 0 || isSubmitting}
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Trước
                </Button>
                <Button
                  variant="outline"
                  onClick={goToNextProduct}
                  disabled={
                    currentProductIndex === productsToReview.length - 1 ||
                    isSubmitting
                  }
                >
                  Tiếp
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </>
            )}
          </div>
          <Button
            onClick={handleSubmitAllReviews}
            disabled={completedReviews === 0 || isSubmitting}
            className="ml-auto"
          >
            {isSubmitting
              ? "Đang gửi..."
              : `Gửi ${completedReviews > 0 ? completedReviews : ""} đánh giá`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
