// src/components/RecommendationModal.tsx
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Sparkles, ChevronDown, ChevronUp, Plus, Minus, Star } from "lucide-react";
import { addToCartApi, checkStockAvailability } from "../services/api";
import { useApp } from "../contexts/AppContext";
import { toast } from "./ui/use-toast";

interface RecommendationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recommendations: any[];
  productNameMap: { [key: number]: string };
  onCartUpdate?: () => Promise<void>;
}

export function RecommendationModal({
  open,
  onOpenChange,
  recommendations,
  productNameMap,
  onCartUpdate,
}: RecommendationModalProps) {
  const { state, addToCart } = useApp();
  const [expandedProductId, setExpandedProductId] = useState<number | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<{
    [key: number]: {
      color: string;
      size: string;
      quantity: number;
      stock: number;
      maCTSP: number;
    };
  }>({});

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getAntecedentNames = (antecedentIds: number[]) => {
    return antecedentIds
      .map(id => productNameMap[id] || `SP #${id}`)
      .join(" & ");
  };

  const handleProductClick = (productId: number) => {
    setExpandedProductId(expandedProductId === productId ? null : productId);
  };

  // Process product data like in ProductDetail
  const processProduct = (product: any) => {
    const chiTietList = product.ChiTietSanPhams || [];

    // Build color-size-stock mapping
    const allColors = new Set<string>();
    const sizeMap: Record<string, Set<string>> = {};
    const stockMap: Record<string, { soLuong: number; maCTSP: number }> = {};

    for (const ct of chiTietList) {
      const hex = ct.Mau?.MaHex || "#000000";
      const size = ct.KichThuoc?.TenKichThuoc || "Free";

      allColors.add(hex);

      if (!sizeMap[hex]) sizeMap[hex] = new Set();
      sizeMap[hex].add(size);

      stockMap[`${hex}_${size}`] = {
        soLuong: ct.SoLuongTon,
        maCTSP: ct.MaCTSP,
      };
    }

    // Convert to arrays
    const sizeMapObj: Record<string, string[]> = {};
    Object.entries(sizeMap).forEach(([hex, sizes]) => {
      sizeMapObj[hex] = Array.from(sizes);
    });

    // Calculate price
    const giaGoc = Number(product.ThayDoiGia?.[0]?.Gia || 0);
    const giam = Number(product.CT_DotGiamGia?.[0]?.PhanTramGiam || 0);
    const giaSauGiam = giaGoc - (giaGoc * giam) / 100;

    // Get image
    const anhChinh = product.AnhSanPhams?.find((anh: any) => anh.AnhChinh === true);
    const fallbackImage = "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=600&fit=crop";
    const image = anhChinh?.DuongDan || fallbackImage;

    return {
      id: product.MaSP,
      name: product.TenSP,
      price: giaSauGiam,
      originalPrice: giam > 0 ? giaGoc : undefined,
      image,
      rating: product.BinhLuan?.avgRate || 0,
      reviews: product.BinhLuan?.luotBinhLuan || 0,
      colors: Array.from(allColors),
      sizeMap: sizeMapObj,
      stockMap,
    };
  };

  const handleColorChange = async (productId: number, color: string, product: any) => {
    const processedProduct = processProduct(product);
    const sizes = processedProduct.sizeMap[color] || [];
    const firstSize = sizes[0] || "";

    // Get stock info for first size
    const stockInfo = processedProduct.stockMap[`${color}_${firstSize}`];
    const stock = stockInfo?.soLuong || 0;
    const maCTSP = stockInfo?.maCTSP || 0;

    setSelectedVariants({
      ...selectedVariants,
      [productId]: {
        color,
        size: firstSize,
        quantity: 1,
        stock,
        maCTSP,
      },
    });
  };

  const handleSizeChange = async (productId: number, size: string, product: any) => {
    const current = selectedVariants[productId];
    if (!current) return;

    const processedProduct = processProduct(product);
    const stockInfo = processedProduct.stockMap[`${current.color}_${size}`];
    const stock = stockInfo?.soLuong || 0;
    const maCTSP = stockInfo?.maCTSP || 0;

    setSelectedVariants({
      ...selectedVariants,
      [productId]: {
        ...current,
        size,
        quantity: 1,
        stock,
        maCTSP,
      },
    });
  };

  const handleQuantityChange = (productId: number, delta: number) => {
    const current = selectedVariants[productId];
    if (!current) return;

    const newQuantity = Math.max(1, Math.min(current.quantity + delta, current.stock));
    
    setSelectedVariants({
      ...selectedVariants,
      [productId]: {
        ...current,
        quantity: newQuantity,
      },
    });
  };

  const handleAddToCart = async (product: any) => {
    const processedProduct = processProduct(product);
    const variant = selectedVariants[processedProduct.id];

    if (!variant || !variant.color || !variant.size) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn màu sắc và kích thước",
        variant: "destructive",
      });
      return;
    }

    if (variant.stock === 0) {
      toast({
        title: "Lỗi",
        description: "Sản phẩm đã hết hàng",
        variant: "destructive",
      });
      return;
    }

    try {
      // Thêm vào backend
      await addToCartApi({
        maKH: Number(state.user.id),
        maSP: processedProduct.id,
        soLuong: variant.quantity,
        maHex: variant.color,
        tenKichThuoc: variant.size,
      });

      // Add to local cart context
      addToCart(
        {
          id: processedProduct.id,
          name: processedProduct.name,
          price: processedProduct.price,
          originalPrice: processedProduct.originalPrice,
          image: processedProduct.image,
          rating: processedProduct.rating,
          reviews: processedProduct.reviews,
          discount: 0,
          isNew: false,
          isBestSeller: false,
          category: "",
          colors: processedProduct.colors,
          sizes: [],
        },
        variant.quantity,
        variant.color,
        variant.size
      );

      // Refresh cart từ backend
      if (onCartUpdate) {
        await onCartUpdate();
      }

      toast({
        title: "Thành công",
        description: `Đã thêm ${variant.quantity} sản phẩm vào giỏ hàng`,
      });

      // Reset selection và collapse
      const newVariants = { ...selectedVariants };
      delete newVariants[processedProduct.id];
      setSelectedVariants(newVariants);
      setExpandedProductId(null);
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Lỗi",
        description: "Không thể thêm sản phẩm vào giỏ hàng",
        variant: "destructive",
      });
    }
  };

  // Color name mapping
  const colorNames: Record<string, string> = {
    "#000000": "Đen",
    "#ffffff": "Trắng",
    "#dc2626": "Đỏ",
    "#3b82f6": "Xanh dương",
    "#22c55e": "Xanh lá",
    "#f59e0b": "Vàng",
    "#ec4899": "Hồng",
    "#a855f7": "Tím",
    "#6b7280": "Xám",
    "#7c2d12": "Nâu",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-600" />
            Gợi ý dành cho bạn
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {recommendations.map((group, groupIdx) => (
            <div key={`group-${groupIdx}`} className="space-y-4">
              {/* Group Title */}
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
                {/* <span>
                  Liên quan đến: <span className="text-brand-600">{getAntecedentNames(group.antecedent)}</span>
                </span> */}
                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
              </div>

              {/* Products List */}
              <div className="space-y-2">
                {group.products.map((product: any) => {
                  const processedProduct = processProduct(product);
                  const isExpanded = expandedProductId === processedProduct.id;
                  const variant = selectedVariants[processedProduct.id];

                  return (
                    <div
                      key={processedProduct.id}
                      className="border rounded-lg overflow-hidden transition-all duration-300"
                    >
                      {/* Product Header - Always Visible */}
                      <div
                        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => handleProductClick(processedProduct.id)}
                      >
                        <img
                          src={processedProduct.image}
                          alt={processedProduct.name}
                          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1">
                            {processedProduct.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-lg font-bold text-brand-600">
                              {formatPrice(processedProduct.price)}
                            </span>
                            {processedProduct.originalPrice && (
                              <span className="text-sm text-gray-500 line-through">
                                {formatPrice(processedProduct.originalPrice)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm text-gray-600">
                              {processedProduct.rating.toFixed(1)} ({processedProduct.reviews})
                            </span>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="border-t p-4 space-y-4 bg-gray-50 dark:bg-gray-800/50">
                          {/* Colors */}
                          {processedProduct.colors && processedProduct.colors.length > 0 && (
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Màu sắc: {variant?.color ? colorNames[variant.color] || "Khác" : "Chưa chọn"}
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {processedProduct.colors.map((color) => (
                                  <button
                                    key={color}
                                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                                      variant?.color === color
                                        ? "border-brand-600 ring-2 ring-brand-200 scale-110"
                                        : "border-gray-300 hover:border-gray-400"
                                    }`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => handleColorChange(processedProduct.id, color, product)}
                                    title={colorNames[color] || color}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Sizes */}
                          {variant?.color && processedProduct.sizeMap[variant.color] && (
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Kích thước: {variant.size || "Chưa chọn"}
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {processedProduct.sizeMap[variant.color].map((size) => (
                                  <Button
                                    key={size}
                                    variant={variant.size === size ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handleSizeChange(processedProduct.id, size, product)}
                                    className="min-w-[60px]"
                                  >
                                    {size}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Quantity */}
                          {variant?.size && (
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Số lượng
                              </label>
                              <div className="flex items-center gap-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuantityChange(processedProduct.id, -1)}
                                  disabled={variant.quantity <= 1}
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <span className="w-12 text-center font-medium">
                                  {variant.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuantityChange(processedProduct.id, 1)}
                                  disabled={variant.quantity >= variant.stock}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                              <p className={`text-sm mt-1 ${variant.stock > 0 ? 'text-gray-500' : 'text-red-500'}`}>
                                {variant.stock > 0 ? `Còn ${variant.stock} sản phẩm` : 'Hết hàng'}
                              </p>
                            </div>
                          )}

                          {/* Add to Cart Button */}
                          <Button
                            className="w-full bg-brand-600 hover:bg-brand-700"
                            onClick={() => handleAddToCart(product)}
                            disabled={!variant?.color || !variant?.size || variant?.stock === 0}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Thêm vào giỏ hàng {variant?.size && `- ${formatPrice(processedProduct.price * variant.quantity)}`}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}