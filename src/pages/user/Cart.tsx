import { RecommendationModal } from "@/components/RecommendationModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/contexts/AppContext";
import {
  checkStockAvailability,
  getCartItemsApi,
  getProductRecommendations,
  updateCartItemQuantity,
} from "@/services/api";
import { CartItem } from "@/types/cart-item.type";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner"; // Assuming toast is available, or use alert/console

export default function Cart() {
  const {
    state,
    setCartFromBackend,
    setLoading,
    clearCartFully,
    updateCartQuantity,
    removeFromCart,
    getCartTotal,
    toggleWishlist,
    isInWishlist,
    addToCart,
  } = useApp();

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [stockErrors, setStockErrors] = useState<{ [key: string]: string }>({});
  const [stockLimits, setStockLimits] = useState<{ [key: string]: number }>({});

  // Debounce refs
  const debounceTimers = useRef<{ [key: number]: any }>({});

  // Recommendation states
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [productNameMap, setProductNameMap] = useState<{
    [key: number]: string;
  }>({});
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Helper to process cart data from API response
  const processCartData = useCallback((items: any[]) => {
    const groupedMap = new Map<string, CartItem>();

    for (const item of items) {
      const productId = item.maCTSP;
      const color = item.mau?.hex;
      const size = item.kichThuoc?.ten;
      const donGia = Number(item.donGia ?? 0);

      const key = `${productId}-${color}-${size}-${donGia}`;

      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          product: {
            id: productId,
            name: item.sanPham?.tenSP || "Tên SP",
            price: donGia,
            originalPrice: undefined,
            image: item.anhSanPham,
            rating: 4.5,
            reviews: 0,
            discount: 0,
            isNew: false,
            isBestSeller: false,
            category: "",
            colors: [],
            sizes: [],
            mota: "",
            totalSold: 0,
          },
          quantity: item.soLuong,
          selectedColor: color,
          selectedSize: size,
        });
      } else {
        const existing = groupedMap.get(key)!;
        existing.quantity += item.soLuong;
      }
    }
    return Array.from(groupedMap.values());
  }, []);

  const refreshCart = async () => {
    try {
      if (!state.user) return;
      // Do not set global loading here to avoid full page flickering on small updates
      // setLoading(true); 
      const res = await getCartItemsApi(state.user.id);
      const cartItems = processCartData(res.items);
      setCartFromBackend(cartItems);
    } catch (err) {
      console.error("Lỗi khi refresh giỏ hàng:", err);
    }
  };

  useEffect(() => {
    const fetchCart = async () => {
      try {
        if (!state.user) return;

        setLoading(true);
        await refreshCart();
      } catch (err) {
        console.error("Lỗi khi lấy giỏ hàng:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [state.user]);

  // Fetch recommendations when cart changes
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!state.cart || state.cart.length === 0) {
        setRecommendations([]);
        return;
      }

      try {
        // Extract MaCTSP from cart items
        const cartItemIds = state.cart.map((item) => item.product.id);

        // Call recommendation API
        const response = await getProductRecommendations(
          cartItemIds,
          8,
          true,
          false
        );
        console.log("Product recommendations response:", response);

        if (response.success && response.data.recommendations.groups) {
          // Build product name map from ALL products in recommendations
          const nameMap: { [key: number]: string } = {};

          // First, add cart items
          state.cart.forEach((item) => {
            nameMap[item.product.id] = item.product.name;
          });

          // Then, add all products from recommendation groups to the map
          response.data.recommendations.groups.forEach((group: any) => {
            group.products.forEach((product: any) => {
              if (product.MaSP) {
                nameMap[product.MaSP] = product.TenSP;
              }
            });
            // Also map MaCTSP from antecedent if available
            group.antecedent.forEach((maCTSP: number) => {
              // Try to find product name from cart or existing products
              if (!nameMap[maCTSP]) {
                // Find in cart items
                const cartItem = state.cart.find(
                  (item) => item.product.id === maCTSP
                );
                if (cartItem) {
                  nameMap[maCTSP] = cartItem.product.name;
                }
              }
            });
          });

          setProductNameMap(nameMap);
          setRecommendations(response.data.recommendations.groups);
        }
      } catch (error) {
        console.error("Lỗi khi lấy gợi ý sản phẩm:", error);
      }
    };

    fetchRecommendations();
  }, [state.cart]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleQuantityChange = async (maCTSP: number, newQuantity: number) => {
    if (!state.user) return;

    // Clear existing timer for this product
    if (debounceTimers.current[maCTSP]) {
      clearTimeout(debounceTimers.current[maCTSP]);
    }

    // 1. Optimistic Update
    setStockErrors((prev) => {
      const updated = { ...prev };
      delete updated[maCTSP];
      return updated;
    });

    if (newQuantity <= 0) {
      updateCartQuantity(maCTSP, newQuantity);
    } else {
      updateCartQuantity(maCTSP, newQuantity);
    }

    // 2. Debounce API Call
    debounceTimers.current[maCTSP] = setTimeout(async () => {
      try {
        if (newQuantity > 0) {
          try {
            // Re-check stock from API to be safe before confirming update
            const stockRes = await checkStockAvailability(maCTSP);
            const availableStock = stockRes.soLuongTon;

            // Update local limit state so UI knows for next time
            setStockLimits((prev) => ({ ...prev, [maCTSP]: availableStock }));

            if (newQuantity > availableStock) {
              setStockErrors((prev) => ({
                ...prev,
                [maCTSP]: `Chỉ còn ${availableStock} sản phẩm`,
              }));

              // Revert UI to max available
              updateCartQuantity(maCTSP, availableStock);

              // Call API with max available
              await updateCartItemQuantity({
                maKH: Number(state.user!.id),
                maCTSP: maCTSP,
                soLuong: availableStock
              });

              return;
            }
          } catch (err) {
            console.error("Stock check failed:", err);
          }
        }

        // Call Update API
        const response = await updateCartItemQuantity({
          maKH: Number(state.user!.id),
          maCTSP: maCTSP,
          soLuong: newQuantity
        });

        if (response && (response.status === 'success' || response.data)) {
          // Update successful, sync state with server data
          if (response.data && response.data.items) {
            const processedItems = processCartData(response.data.items);
            setCartFromBackend(processedItems);
          }
        } else {
          console.error("Update failed:", response);
          refreshCart(); // Revert
          toast.error(response?.message || "Cập nhật thất bại");
        }

      } catch (error) {
        console.error("Error updating cart:", error);
        refreshCart(); // Revert
      }
    }, 800); // 800ms debounce
  };

  const applyCoupon = () => {
    const validCoupons = {
      SAVE10: 10,
      WELCOME20: 20,
      FASHION15: 15,
    };

    const upperCouponCode = couponCode.toUpperCase();
    if (validCoupons[upperCouponCode as keyof typeof validCoupons]) {
      setAppliedCoupon({
        code: upperCouponCode,
        discount: validCoupons[upperCouponCode as keyof typeof validCoupons],
      });
      setCouponCode("");
    } else {
      alert("Mã giảm giá không hợp lệ!");
    }
  };

  const subtotal = getCartTotal();
  const discountAmount = appliedCoupon
    ? (subtotal * appliedCoupon.discount) / 100
    : 0;
  const shippingFee = subtotal >= 500000 ? 0 : 30000;
  const total = subtotal - discountAmount + shippingFee;

  // Get antecedent product names
  const getAntecedentNames = (antecedentIds: number[]) => {
    const names = antecedentIds
      .map((id) => productNameMap[id] || `SP #${id}`)
      .filter(Boolean);

    return names.length > 0 ? names.join(" & ") : "Sản phẩm";
  };

  if (state.cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Giỏ hàng trống
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
            Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá và thêm những
            sản phẩm yêu thích!
          </p>
          <Link to="/">
            <Button className="bg-brand-600 hover:bg-brand-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tiếp tục mua sắm
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Giỏ hàng của bạn
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {state.cart.length} sản phẩm trong giỏ hàng
            </p>
          </div>

          {/* Recommendation Button */}
          {recommendations.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-brand-600 text-brand-600 hover:bg-brand-50"
              onClick={() => setShowRecommendations(true)}
            >
              <Sparkles className="w-4 h-4" />
              Gợi ý dành cho bạn
              <Badge
                variant="secondary"
                className="bg-brand-100 text-brand-700"
              >
                {recommendations.reduce(
                  (acc, group) => acc + group.products.length,
                  0
                )}
              </Badge>
            </Button>
          )}
        </div>
        <Link to="/">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tiếp tục mua sắm
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {state.cart.map((item) => (
            <Card
              key={`${item.product.id}-${item.selectedColor}-${item.selectedSize}`}
            >
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          <Link
                            to={`/product/${item.product.id}`}
                            className="hover:text-brand-600 dark:hover:text-brand-400"
                          >
                            {item.product.name}
                          </Link>
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {item.selectedColor && (
                            <Badge variant="outline">
                              <div
                                className="w-3 h-3 rounded-full mr-2"
                                style={{ backgroundColor: item.selectedColor }}
                              />
                              Màu
                            </Badge>
                          )}
                          {item.selectedSize && (
                            <Badge variant="outline">
                              Size: {item.selectedSize}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          removeFromCart(
                            item.product.id,
                            item.selectedColor,
                            item.selectedSize,
                            item.product.price
                          )
                        }
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-x-2">
                        <span className="font-bold text-brand-600 dark:text-brand-400">
                          {formatPrice(item.product.price)}
                        </span>
                        {item.product.originalPrice && (
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(item.product.originalPrice)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleQuantityChange(
                              item.product.id,
                              item.quantity - 1
                            )
                          }
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleQuantityChange(
                              item.product.id,
                              item.quantity + 1
                            )
                          }
                          disabled={
                            stockLimits[item.product.id] !== undefined &&
                            item.quantity >= stockLimits[item.product.id]
                          }
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {stockErrors[item.product.id] && (
                      <p className="text-sm text-red-500 mt-1">
                        {stockErrors[item.product.id]}
                      </p>
                    )}

                    <div className="text-right">
                      <span className="font-semibold">
                        Tổng: {formatPrice(item.product.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="pt-4">
            <Button
              variant="outline"
              onClick={clearCartFully}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Xóa tất cả
            </Button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Tóm tắt đơn hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Giảm giá ({appliedCoupon.discount}%)</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Phí vận chuyển</span>
                  <span>
                    {shippingFee === 0 ? (
                      <Badge variant="secondary" className="text-green-600">
                        Miễn phí
                      </Badge>
                    ) : (
                      formatPrice(shippingFee)
                    )}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Tổng cộng</span>
                <span className="text-brand-600 dark:text-brand-400">
                  {formatPrice(total)}
                </span>
              </div>

              {subtotal < 500000 && (
                <div className="text-sm text-gray-600 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  Mua thêm {formatPrice(500000 - subtotal)} để được miễn phí vận
                  chuyển!
                </div>
              )}

              <Link to="/checkout" className="block">
                <Button className="w-full bg-brand-600 hover:bg-brand-700">
                  Tiến hành thanh toán
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      <RecommendationModal
        open={showRecommendations}
        onOpenChange={setShowRecommendations}
        recommendations={recommendations}
        productNameMap={productNameMap}
        onCartUpdate={refreshCart}
      />
    </div>
  );
}
