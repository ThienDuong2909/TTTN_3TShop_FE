import { useState, useEffect } from "react";
import {
  Plus,
  Calendar,
  Tag,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Package,
  Search,
  Minus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  getAvailableProductsForPromotion,
  createPromotion,
  validatePromotionPeriod,
} from "../services/api";
import { toast } from "sonner";

// Local type definitions
interface ProductForDiscount {
  MaSP: number;
  TenSP: string;
  AnhSP: string;
  DanhMuc: string;
  GiaGoc: number;
  TrangThai: string;
  DaCoGiam?: boolean;
  PhanTramGiamHienTai?: number;
}

// Utility functions
const formatCurrency = (amount: number | string) => {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(numAmount);
};

const calculateDiscountedPrice = (
  originalPrice: number,
  discountPercent: number
) => {
  return originalPrice * (1 - discountPercent / 100);
};

interface CreateDiscountPeriodDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SelectedProduct {
  MaSP: number;
  PhanTramGiam: number;
}

export function CreateDiscountPeriodDialog({
  isOpen,
  onClose,
  onSuccess,
}: CreateDiscountPeriodDialogProps) {
  const [currentStep, setCurrentStep] = useState(1); // 1: Period Info, 2: Product Selection
  const [formData, setFormData] = useState({
    NgayBatDau: "",
    NgayKetThuc: "",
    MoTa: "",
    PhanTramGiamChung: 10, // Default 10% discount
  });
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    []
  );
  const [availableProducts, setAvailableProducts] = useState<
    ProductForDiscount[]
  >([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingPeriod, setIsValidatingPeriod] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load products when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen]);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await getAvailableProductsForPromotion();

      if (response.success) {
        // Transform API response to match our interface
        const products: ProductForDiscount[] = response.data.map(
          (product: any) => {
            // Find main image from AnhSanPhams array
            const mainImage = product.AnhSanPhams?.find(
              (img: any) => img.AnhChinh === true
            );

            // Get current price from ThayDoiGia array (latest entry)
            const latestPriceChange = product.ThayDoiGia?.[0];
            const currentPrice = latestPriceChange
              ? parseFloat(latestPriceChange.Gia)
              : 0;

            // Check if product already has discount from CT_DotGiamGia
            const hasDiscount =
              product.CT_DotGiamGia && product.CT_DotGiamGia.length > 0;
            const currentDiscountPercent = hasDiscount
              ? product.CT_DotGiamGia[0]?.PhanTramGiam || 0
              : 0;

            return {
              MaSP: product.MaSP,
              TenSP: product.TenSP,
              AnhSP: mainImage?.DuongDan || "/default-image.jpg",
              DanhMuc: product.LoaiSP?.TenLoai || "Khác",
              GiaGoc: currentPrice,
              TrangThai: product.TrangThai ? "active" : "inactive",
              DaCoGiam: hasDiscount,
              PhanTramGiamHienTai: currentDiscountPercent,
            };
          }
        );
        setAvailableProducts(products);
      } else {
        toast.error('"Không thể tải danh sách sản phẩm"');
      }
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Có lỗi xảy ra khi tải sản phẩm");
    } finally {
      setLoadingProducts(false);
    }
  };

  // Get unique categories
  const categories = Array.from(
    new Set(availableProducts.map((product) => product.DanhMuc))
  );

  // Filter products
  const filteredProducts = availableProducts.filter((product) => {
    const matchesSearch =
      searchTerm === "" ||
      product.TenSP.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.MaSP.toString().includes(searchTerm);

    const matchesCategory =
      categoryFilter === "all" || product.DanhMuc === categoryFilter;

    const matchesStatus = product.TrangThai === "active";

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    // Validate start date
    if (!formData.NgayBatDau) {
      newErrors.NgayBatDau = "Vui lòng chọn ngày bắt đầu";
    }

    // Validate end date
    if (!formData.NgayKetThuc) {
      newErrors.NgayKetThuc = "Vui lòng chọn ngày kết thúc";
    }

    // Validate date range
    if (formData.NgayBatDau && formData.NgayKetThuc) {
      const startDate = new Date(formData.NgayBatDau);
      const endDate = new Date(formData.NgayKetThuc);

      if (endDate <= startDate) {
        newErrors.NgayKetThuc = "Ngày kết thúc phải sau ngày bắt đầu";
      }

      // Check if start date is in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (startDate < today) {
        newErrors.NgayBatDau = "Ngày bắt đầu không thể trong quá khứ";
      }
    }

    // Validate description
    if (!formData.MoTa.trim()) {
      newErrors.MoTa = "Vui lòng nhập mô tả cho đợt giảm giá";
    } else if (formData.MoTa.trim().length < 10) {
      newErrors.MoTa = "Mô tả phải có ít nhất 10 ký tự";
    }

    // Validate common discount percentage
    if (
      !formData.PhanTramGiamChung ||
      formData.PhanTramGiamChung < 1 ||
      formData.PhanTramGiamChung > 99
    ) {
      newErrors.PhanTramGiamChung = "Phần trăm giảm giá phải từ 1% đến 99%";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isProductSelected = (MaSP: number): boolean => {
    return selectedProducts.some((p) => p.MaSP === MaSP);
  };

  const getProductDiscount = (MaSP: number): number => {
    const product = selectedProducts.find((p) => p.MaSP === MaSP);
    return product?.PhanTramGiam || 0;
  };

  const toggleProductSelection = (product: ProductForDiscount) => {
    setSelectedProducts((prev) => {
      const isSelected = prev.some((p) => p.MaSP === product.MaSP);

      if (isSelected) {
        return prev.filter((p) => p.MaSP !== product.MaSP);
      } else {
        return [
          ...prev,
          { MaSP: product.MaSP, PhanTramGiam: formData.PhanTramGiamChung },
        ]; // Use common discount
      }
    });
  };

  const updateProductDiscount = (MaSP: number, discount: number) => {
    const validDiscount = Math.max(1, Math.min(99, discount)); // Between 1-99%

    setSelectedProducts((prev) =>
      prev.map((p) =>
        p.MaSP === MaSP ? { ...p, PhanTramGiam: validDiscount } : p
      )
    );
  };

  const selectAllFiltered = () => {
    const newSelections = filteredProducts
      .filter((product) => !isProductSelected(product.MaSP))
      .map((product) => ({
        MaSP: product.MaSP,
        PhanTramGiam: formData.PhanTramGiamChung,
      })); // Use common discount

    setSelectedProducts((prev) => [...prev, ...newSelections]);
  };

  const deselectAll = () => {
    setSelectedProducts([]);
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        // Validate promotion period for conflicts
        try {
          setIsValidatingPeriod(true);
          const response = await validatePromotionPeriod(
            formData.NgayBatDau,
            formData.NgayKetThuc
          );

          if (response.success && response.data.valid) {
            // Period is valid, proceed to step 2
            setCurrentStep(2);
          } else {
            console.log("Response: ", response.data.message);
            toast.error(response.data.message);
          }
        } catch (error) {
          console.error("Error validating promotion period:", error);
          toast.error(
            "Có lỗi xảy ra khi kiểm tra thời gian. Vui lòng thử lại."
          );
        } finally {
          setIsValidatingPeriod(false);
        }
      }
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleSubmit = async () => {
    if (currentStep === 1) {
      handleNext();
      return;
    }

    setIsSubmitting(true);

    try {
      // Create discount period data for API
      const discountPeriodData = {
        ngayBatDau: formData.NgayBatDau,
        ngayKetThuc: formData.NgayKetThuc,
        moTa: formData.MoTa.trim(),
        danhSachSanPham: selectedProducts.map((selectedProduct) => ({
          maSP: selectedProduct.MaSP,
          phanTramGiam: selectedProduct.PhanTramGiam,
        })),
      };

      const response = await createPromotion(discountPeriodData);

      if (response.success) {
        toast.success(
          `Đã tạo đợt giảm giá với ${selectedProducts.length} sản phẩm thành công.`
        );

        onSuccess();
        handleClose();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi tạo đợt giảm giá. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setCurrentStep(1);
      setFormData({
        NgayBatDau: "",
        NgayKetThuc: "",
        MoTa: "",
        PhanTramGiamChung: 10,
      });
      setSelectedProducts([]);
      setSearchTerm("");
      setCategoryFilter("all");
      setErrors({});
      onClose();
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === "PhanTramGiamChung" ? parseInt(value) : value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Calculate duration
  const getDuration = () => {
    if (formData.NgayBatDau && formData.NgayKetThuc) {
      const start = new Date(formData.NgayBatDau);
      const end = new Date(formData.NgayKetThuc);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} ngày`;
    }
    return "";
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="flex flex-row gap-14">
        {/* Start Date */}
        <div className="space-y-2">
          <Label htmlFor="startDate">Ngày bắt đầu *</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.NgayBatDau}
            onChange={(e) => handleInputChange("NgayBatDau", e.target.value)}
            className={errors.NgayBatDau ? "border-red-500" : ""}
          />
          {errors.NgayBatDau && (
            <div className="flex items-center gap-1 text-red-500">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{errors.NgayBatDau}</span>
            </div>
          )}
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <Label htmlFor="endDate">Ngày kết thúc *</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.NgayKetThuc}
            onChange={(e) => handleInputChange("NgayKetThuc", e.target.value)}
            className={errors.NgayKetThuc ? "border-red-500" : ""}
          />
          {errors.NgayKetThuc && (
            <div className="flex items-center gap-1 text-red-500">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{errors.NgayKetThuc}</span>
            </div>
          )}
        </div>
      </div>

      {/* Duration Display */}
      {getDuration() && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">
              Thời gian: {getDuration()}
            </span>
          </div>
        </div>
      )}

      {/* Common Discount Percentage */}
      <div className="space-y-2">
        <Label htmlFor="commonDiscount">Phần trăm giảm giá chung *</Label>
        <div className="flex items-center gap-2">
          <Input
            id="commonDiscount"
            type="number"
            min="0"
            max="99"
            value={formData.PhanTramGiamChung}
            onChange={(e) =>
              handleInputChange("PhanTramGiamChung", e.target.value)
            }
            className={`w-24 ${
              errors.PhanTramGiamChung ? "border-red-500" : ""
            }`}
          />
          <span className="text-sm text-muted-foreground">%</span>
          <div className="text-sm text-muted-foreground">
            (Áp dụng mặc định cho tất cả sản phẩm được chọn)
          </div>
        </div>
        {errors.PhanTramGiamChung && (
          <div className="flex items-center gap-1 text-red-500">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{errors.PhanTramGiamChung}</span>
          </div>
        )}
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
            <Tag className="h-4 w-4" />
            <span className="text-sm">
              Sản phẩm được chọn sẽ có giảm giá {formData.PhanTramGiamChung}%
              theo mặc định. Bạn có thể điều chỉnh riêng lẻ cho từng sản phẩm ở
              bước tiếp theo.
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Mô tả đợt giảm giá *</Label>
        <Textarea
          id="description"
          placeholder="Nhập mô tả chi tiết về đợt giảm giá (ví dụ: Khuyến mại đầu năm, Sale Valentine, v.v.)"
          value={formData.MoTa}
          onChange={(e) => handleInputChange("MoTa", e.target.value)}
          rows={3}
          className={errors.MoTa ? "border-red-500" : ""}
        />
        <div className="flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            Tối thiểu 10 ký tự
          </div>
          <div className="text-xs text-muted-foreground">
            {formData.MoTa.length}/500
          </div>
        </div>
        {errors.MoTa && (
          <div className="flex items-center gap-1 text-red-500">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{errors.MoTa}</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      {/* Period Summary */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="font-medium mb-2">Thông tin đợt giảm giá</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Thời gian:</span>
            <div className="font-medium">
              {new Date(formData.NgayBatDau).toLocaleDateString("vi-VN")} -{" "}
              {new Date(formData.NgayKetThuc).toLocaleDateString("vi-VN")}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Thời lượng:</span>
            <div className="font-medium">{getDuration()}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Giảm giá chung:</span>
            <div className="font-medium text-green-600">
              {formData.PhanTramGiamChung}%
            </div>
          </div>
        </div>
        <div className="mt-2">
          <span className="text-muted-foreground">Mô tả:</span>
          <div className="font-medium">{formData.MoTa}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Selection Actions */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAllFiltered}>
            Chọn tất cả ({filteredProducts.length})
          </Button>
          <Button variant="outline" size="sm" onClick={deselectAll}>
            Bỏ chọn tất cả
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedProducts((prev) =>
                prev.map((p) => ({
                  ...p,
                  PhanTramGiam: formData.PhanTramGiamChung,
                }))
              );
            }}
            disabled={selectedProducts.length === 0}
          >
            <Tag className="h-3 w-3 mr-1" />
            Áp dụng giảm giá {formData.PhanTramGiamChung}% cho tất cả
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Đã chọn: {selectedProducts.length} sản phẩm
        </div>
      </div>

      {/* Products Table */}
      <div className="border rounded-lg max-h-60 overflow-y-auto">
        {loadingProducts ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-sm text-gray-600">Đang tải sản phẩm...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Chọn</TableHead>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Giá gốc</TableHead>
                <TableHead>Giảm giá (%)</TableHead>
                <TableHead>Giá sau giảm</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const isSelected = isProductSelected(product.MaSP);
                  const discountPercent = getProductDiscount(product.MaSP);
                  const discountedPrice = isSelected
                    ? calculateDiscountedPrice(product.GiaGoc, discountPercent)
                    : product.GiaGoc;

                  return (
                    <TableRow
                      key={product.MaSP}
                      className={isSelected ? "bg-blue-50/50" : ""}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() =>
                            toggleProductSelection(product)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={product.AnhSP}
                            alt={product.TenSP}
                            className="w-10 h-10 object-cover rounded"
                          />
                          <div>
                            <div className="font-medium text-sm">
                              {product.TenSP}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ID: {product.MaSP}
                            </div>
                            {product.DaCoGiam && (
                              <div className="flex items-center gap-1 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  Đã có giảm giá {product.PhanTramGiamHienTai}%
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {product.DanhMuc}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-sm">
                          {formatCurrency(product.GiaGoc)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {isSelected ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                              disabled={discountPercent <= 1}
                              onClick={() =>
                                updateProductDiscount(
                                  product.MaSP,
                                  discountPercent - 1
                                )
                              }
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              max="99"
                              value={discountPercent}
                              onChange={(e) =>
                                updateProductDiscount(
                                  product.MaSP,
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="h-6 w-12 text-center text-xs px-1"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                              disabled={discountPercent >= 99}
                              onClick={() =>
                                updateProductDiscount(
                                  product.MaSP,
                                  discountPercent + 1
                                )
                              }
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isSelected ? (
                          <span className="font-medium text-green-600 text-sm">
                            {formatCurrency(discountedPrice)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            -
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-8 w-8 text-gray-400" />
                      <p className="text-muted-foreground">
                        {searchTerm || categoryFilter !== "all"
                          ? "Không tìm thấy sản phẩm phù hợp"
                          : "Không có sản phẩm khả dụng"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Selected Products Summary */}
      {selectedProducts.length > 0 && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <h3 className="font-medium mb-2 text-green-800 dark:text-green-200">
            Tóm tắt sản phẩm đã chọn ({selectedProducts.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-green-700 dark:text-green-300">
                Giảm giá trung bình:
              </span>
              <span className="font-medium ml-2">
                {(
                  selectedProducts.reduce((sum, p) => sum + p.PhanTramGiam, 0) /
                  selectedProducts.length
                ).toFixed(1)}
                %
              </span>
            </div>
            <div>
              <span className="text-green-700 dark:text-green-300">
                Tổng tiết kiệm dự kiến:
              </span>
              <span className="font-medium ml-2">
                {formatCurrency(
                  selectedProducts.reduce((sum, selectedProduct) => {
                    const product = availableProducts.find(
                      (p) => p.MaSP === selectedProduct.MaSP
                    );
                    if (!product) return sum;
                    const discount =
                      product.GiaGoc * (selectedProduct.PhanTramGiam / 100);
                    return sum + discount;
                  }, 0)
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Tạo đợt giảm giá mới
            <Badge variant="outline" className="ml-2">
              Bước {currentStep}/2
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {currentStep === 1
              ? "Thiết lập thông tin cơ bản cho đợt giảm giá"
              : "Chọn sản phẩm và thiết lập mức giảm giá"}
          </DialogDescription>
        </DialogHeader>

        {currentStep === 1 ? renderStep1() : renderStep2()}

        {/* Important Notes for Step 1 */}
        {currentStep === 1 && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                  Lưu ý:
                </div>
                <ul className="text-yellow-700 dark:text-yellow-300 space-y-1">
                  <li>
                    • Thiết lập thời gian, mô tả và mức giảm giá chung cho đợt
                    giảm giá
                  </li>
                  <li>
                    • Hệ thống sẽ kiểm tra xung đột thời gian với các đợt giảm
                    giá khác
                  </li>
                  <li>• Bước tiếp theo sẽ cho phép chọn sản phẩm cụ thể</li>
                  <li>
                    • Có thể điều chỉnh giảm giá riêng lẻ cho từng sản phẩm
                  </li>
                  <li>
                    • Có thể chỉnh sửa thông tin trước khi đợt giảm giá bắt đầu
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting || isValidatingPeriod}
          >
            Hủy
          </Button>
          {currentStep === 2 && (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting || isValidatingPeriod}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isValidatingPeriod}
          >
            {isSubmitting ? (
              <>
                <Calendar className="h-4 w-4 mr-2 animate-spin" />
                Đang tạo...
              </>
            ) : isValidatingPeriod ? (
              <>
                <Calendar className="h-4 w-4 mr-2 animate-spin" />
                Đang kiểm tra...
              </>
            ) : currentStep === 1 ? (
              <>
                Tiếp theo
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Tạo đợt giảm giá
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
