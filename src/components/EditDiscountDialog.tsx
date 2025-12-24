import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updatePromotion } from "@/services/api";

interface DiscountPeriod {
  MaDot: number;
  NgayBatDau: string;
  NgayKetThuc: string;
  MoTa: string;
  TrangThai: string;
}

interface EditDiscountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  discount: DiscountPeriod | null;
  onSuccess: () => void;
}

export function EditDiscountDialog({
  isOpen,
  onClose,
  discount,
  onSuccess,
}: EditDiscountDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    moTa: "",
    ngayBatDau: "",
    ngayKetThuc: "",
  });

  // Initialize form data when discount changes
  useEffect(() => {
    if (discount) {
      setFormData({
        moTa: discount.MoTa || "",
        ngayBatDau: discount.NgayBatDau
          ? new Date(discount.NgayBatDau).toISOString().split("T")[0]
          : "",
        ngayKetThuc: discount.NgayKetThuc
          ? new Date(discount.NgayKetThuc).toISOString().split("T")[0]
          : "",
      });
    }
  }, [discount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!discount) return;

    // Validation
    if (!formData.ngayBatDau || !formData.ngayKetThuc) {
      toast.error("Vui lòng nhập đầy đủ thời gian diễn ra đợt giảm giá");
      return;
    }

    if (new Date(formData.ngayBatDau) > new Date(formData.ngayKetThuc)) {
      toast.error("Ngày bắt đầu phải trước ngày kết thúc");
      return;
    }

    setLoading(true);
    try {
      const response = await updatePromotion(discount.MaDot, {
        ngayBatDau: formData.ngayBatDau,
        ngayKetThuc: formData.ngayKetThuc,
        moTa: formData.moTa || undefined,
      });

      if (response.success) {
        toast.success("Cập nhật đợt giảm giá thành công");
        onSuccess();
        onClose();
      } else {
        // Display error message from response.error field
        toast.error(
          response.error || response.message || "Cập nhật đợt giảm giá thất bại"
        );
      }
    } catch (error: any) {
      console.error("Error updating promotion:", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Có lỗi xảy ra khi cập nhật đợt giảm giá";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa đợt giảm giá</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin về đợt giảm giá #
            {discount?.MaDot.toString().padStart(3, "0")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="moTa">
                Mô tả <span className="text-muted-foreground">(Tùy chọn)</span>
              </Label>
              <Textarea
                id="moTa"
                placeholder="Nhập mô tả về đợt giảm giá..."
                value={formData.moTa}
                onChange={(e) =>
                  setFormData({ ...formData, moTa: e.target.value })
                }
                rows={3}
                disabled={loading}
              />
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="ngayBatDau">
                Ngày bắt đầu <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="ngayBatDau"
                  type="date"
                  value={formData.ngayBatDau}
                  onChange={(e) =>
                    setFormData({ ...formData, ngayBatDau: e.target.value })
                  }
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="ngayKetThuc">
                Ngày kết thúc <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="ngayKetThuc"
                  type="date"
                  value={formData.ngayKetThuc}
                  onChange={(e) =>
                    setFormData({ ...formData, ngayKetThuc: e.target.value })
                  }
                  className="pl-10"
                  required
                  disabled={loading}
                  min={formData.ngayBatDau}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
