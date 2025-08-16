import { useState, useEffect } from "react";
import { Package, Plus, Search, CheckCircle, Minus } from "lucide-react";
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
  addProductToPromotion,
} from "../services/api";
import { useToast } from "../hooks/use-toast";

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

interface DotGiamGia {
  MaDot: number;
  NgayBatDau: string;
  NgayKetThuc: string;
  MoTa: string;
  TrangThai: string;
  SoLuongSanPham?: number;
  CT_DotGiamGia?: Array<any>;
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

interface AddProductToDiscountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  period: DotGiamGia;
  onSuccess: () => void;
}

interface SelectedProduct {
  MaSP: number;
  PhanTramGiam: number;
}

export function AddProductToDiscountDialog({
  isOpen,
  onClose,
  period,
  onSuccess,
}: AddProductToDiscountDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    []
  );
  const [availableProducts, setAvailableProducts] = useState<
    ProductForDiscount[]
  >([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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
          (product: any) => ({
            MaSP: product.MaSP,
            TenSP: product.TenSP,
            AnhSP: product.AnhChinh || "/default-image.jpg", // Updated field name
            DanhMuc: product.TenLoaiSP || "Khác", // Updated field name
            GiaGoc: parseFloat(product.GiaHienTai?.toString() || "0"), // Updated field name
            TrangThai: product.TrangThai ? "active" : "inactive",
            DaCoGiam: product.DaCoGiam || false,
            PhanTramGiamHienTai: product.PhanTramGiamHienTai || 0,
          })
        );
        setAvailableProducts(products);
      } else {
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách sản phẩm",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading products:", error);
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi tải sản phẩm",
        variant: "destructive",
      });
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
        return [...prev, { MaSP: product.MaSP, PhanTramGiam: 10 }]; // Default 10% discount
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

  const handleSubmit = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ít nhất một sản phẩm",
        variant: "destructive",
      });
      return;
    }

    // Validate all discount percentages
    const invalidProducts = selectedProducts.filter(
      (p) => p.PhanTramGiam < 1 || p.PhanTramGiam > 99
    );

    if (invalidProducts.length > 0) {
      toast({
        title: "Lỗi",
        description: "Phần trăm giảm giá phải từ 1% đến 99%",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data in the required format
      const requestData = {
        danhSachSanPham: selectedProducts.map((selectedProduct) => ({
          maSP: selectedProduct.MaSP,
          phanTramGiam: selectedProduct.PhanTramGiam,
        })),
      };

      // Call API to add all products to the promotion in one request
      const result = await addProductToPromotion(period.MaDot, requestData);

      if (!result.success) {
        throw new Error(result.message || "Failed to add products");
      }

      toast({
        title: "Thành công",
        description: `Đã thêm ${selectedProducts.length} sản phẩm vào đợt giảm giá`,
      });

      onSuccess();
      handleClose();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi thêm sản phẩm. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSearchTerm("");
      setCategoryFilter("all");
      setSelectedProducts([]);
      onClose();
    }
  };

  const selectAllFiltered = () => {
    const newSelections = filteredProducts
      .filter((product) => !isProductSelected(product.MaSP))
      .map((product) => ({ MaSP: product.MaSP, PhanTramGiam: 10 }));

    setSelectedProducts((prev) => [...prev, ...newSelections]);
  };

  const deselectAll = () => {
    setSelectedProducts([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Thêm sản phẩm vào đợt giảm giá
          </DialogTitle>
          <DialogDescription>
            Chọn sản phẩm và thiết lập phần trăm giảm giá cho đợt khuyến mại #
            {period.MaDot.toString().padStart(3, "0")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
            </div>
            <div className="text-sm text-muted-foreground">
              Đã chọn: {selectedProducts.length} sản phẩm
            </div>
          </div>

          {/* Products Table */}
          <div className="border rounded-lg max-h-96 overflow-y-auto">
            {loadingProducts ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                <p className="mt-2 text-sm text-gray-600">
                  Đang tải sản phẩm...
                </p>
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
                        ? calculateDiscountedPrice(
                            product.GiaGoc,
                            discountPercent
                          )
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
                                className="w-12 h-12 object-cover rounded"
                              />
                              <div>
                                <div className="font-medium">
                                  {product.TenSP}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  ID: {product.MaSP}
                                </div>
                                {product.DaCoGiam && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Đã có giảm giá {product.PhanTramGiamHienTai}
                                    %
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.DanhMuc}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
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
                                  className="h-6 w-16 text-center text-xs px-1"
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
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isSelected ? (
                              <span className="font-medium text-green-600">
                                {formatCurrency(discountedPrice)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
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
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h3 className="font-medium mb-2 text-blue-800 dark:text-blue-200">
                Tóm tắt sản phẩm đã chọn ({selectedProducts.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 dark:text-blue-300">
                    Giảm giá trung bình:
                  </span>
                  <span className="font-medium ml-2">
                    {(
                      selectedProducts.reduce(
                        (sum, p) => sum + p.PhanTramGiam,
                        0
                      ) / selectedProducts.length
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">
                    Tổng tiết kiệm dự kiến:
                  </span>
                  <span className="font-medium ml-2 text-green-600">
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

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedProducts.length === 0}
          >
            {isSubmitting ? (
              <>
                <Package className="h-4 w-4 mr-2 animate-spin" />
                Đang thêm...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Thêm {selectedProducts.length} sản phẩm
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
