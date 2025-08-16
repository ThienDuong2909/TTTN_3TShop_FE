import React, { useState, useEffect } from "react";
import { Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { addProductDetail, getSizes, getColors } from "../../services/api.js";

interface Size {
  MaKichThuoc: number;
  TenKichThuoc: string;
}

interface Color {
  MaMau: number;
  TenMau: string;
  MaHex: string;
  TrangThai: boolean;
}

interface AddProductDetailDialogProps {
  productId: number;
  onAdded: () => void;
}

export const AddProductDetailDialog: React.FC<AddProductDetailDialogProps> = ({
  productId,
  onAdded,
}) => {
  const [open, setOpen] = useState(false);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    // Fetch sizes
    const fetchSizes = async () => {
      try {
        const result = await getSizes();

        if (result) {
          // Check if result is an array or has a data property
          let sizesArray;
          if (Array.isArray(result)) {
            sizesArray = result;
          } else if (
            (result as any).data &&
            Array.isArray((result as any).data)
          ) {
            sizesArray = (result as any).data;
          } else if (
            (result as any).success &&
            (result as any).data &&
            Array.isArray((result as any).data)
          ) {
            sizesArray = (result as any).data;
          } else {
            console.error("Unexpected sizes response format:", result);
            return;
          }

          setSizes(sizesArray);
        }
      } catch (error) {
        console.error("Error fetching sizes:", error);
      }
    };

    // Fetch colors
    const fetchColors = async () => {
      try {
        const result = await getColors();

        if (result) {
          // Check if result is an array or has a data property
          let colorsArray;
          if (Array.isArray(result)) {
            colorsArray = result;
          } else if (
            (result as any).data &&
            Array.isArray((result as any).data)
          ) {
            colorsArray = (result as any).data;
          } else if (
            (result as any).success &&
            (result as any).data &&
            Array.isArray((result as any).data)
          ) {
            colorsArray = (result as any).data;
          } else {
            console.error("Unexpected colors response format:", result);
            return;
          }

          setColors(colorsArray.filter((c: Color) => c.TrangThai));
        }
      } catch (error) {
        console.error("Error fetching colors:", error);
      }
    };

    fetchSizes();
    fetchColors();
  }, [open]);

  const handleAdd = async () => {
    if (!selectedSize || !selectedColor || quantity < 1) return;

    setLoading(true);
    try {
      const body = {
        MaSP: productId,
        MaKichThuoc: selectedSize,
        MaMau: selectedColor,
        SoLuongTon: quantity,
      };

      const result = await addProductDetail(body);

      if (result && result.success) {
        toast.success("Đã thêm chi tiết sản phẩm thành công!");
        setOpen(false);
        setSelectedSize(null);
        setSelectedColor(null);
        setQuantity(1);
        onAdded();
      } else {
        toast.error(result?.message || "Thêm chi tiết sản phẩm thất bại");
      }
    } catch (error) {
      console.error("Error adding product detail:", error);

      // Xử lý lỗi authentication
      if ((error as any)?.message === "Authentication failed") {
        // Error đã được xử lý bởi interceptor, không cần thông báo thêm
        return;
      }

      // Xử lý các lỗi khác
      if ((error as any)?.response?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      } else {
        toast.error("Không thể kết nối đến server");
      }
    }
    setLoading(false);
  };

  return (
    <>
      <Button className="bg-[#825B32] text-white" onClick={() => setOpen(true)}>
        <Plus className="w-2 h-2 mr-2" /> Thêm chi tiết sản phẩm
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm chi tiết sản phẩm</DialogTitle>
            <DialogDescription>
              Chọn size, màu sắc và nhập số lượng để thêm biến thể mới cho sản
              phẩm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-[#825B32] font-medium">Kích thước</Label>
              <select
                className="w-full mt-1 p-2 border rounded text-sm"
                value={selectedSize ?? ""}
                onChange={(e) => setSelectedSize(Number(e.target.value))}
              >
                <option value="">Chọn kích thước</option>
                {sizes.map((size) => (
                  <option key={size.MaKichThuoc} value={size.MaKichThuoc}>
                    {size.TenKichThuoc}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-[#825B32] font-medium">Màu sắc</Label>
              <select
                className="w-full mt-1 p-2 border rounded text-sm"
                value={selectedColor ?? ""}
                onChange={(e) => setSelectedColor(Number(e.target.value))}
              >
                <option value="">Chọn màu sắc</option>
                {colors.map((color) => (
                  <option key={color.MaMau} value={color.MaMau}>
                    {color.TenMau}
                  </option>
                ))}
              </select>
              {/* Color preview */}
              {selectedColor && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs">Mã màu:</span>
                  <span
                    style={{
                      background: colors.find((c) => c.MaMau === selectedColor)
                        ?.MaHex,
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      border: "1px solid #ccc",
                      display: "inline-block",
                    }}
                  ></span>
                  <span className="text-xs">
                    {colors.find((c) => c.MaMau === selectedColor)?.MaHex}
                  </span>
                </div>
              )}
            </div>
            <div>
              <Label className="text-[#825B32] font-medium">Số lượng</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full mt-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              className="bg-[#825B32] text-white"
              onClick={handleAdd}
              disabled={
                loading || !selectedSize || !selectedColor || quantity < 1
              }
            >
              <Save className="w-4 h-4 mr-2" /> Thêm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
