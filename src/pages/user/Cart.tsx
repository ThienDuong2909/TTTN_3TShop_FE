import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Separator } from "../../components/ui/separator";
import { Badge } from "../../components/ui/badge";
import { useApp } from "../../contexts/AppContext";
import { getCartItemsApi, checkStockAvailability } from "../../services/api";
import type { Product } from "../../components/ProductCard";
import type { CartItem } from "../../libs/data";
export default function Cart() {
  const { state, setCartFromBackend, setLoading, clearCartFully } = useApp();

  useEffect(() => {
    const fetchCart = async () => {
      try {
        if (!state.user) return;

        setLoading(true);

        const res = await getCartItemsApi(state.user.id);
        console.log("Cart items from backend:", res);
        const groupedMap = new Map<string, CartItem>();

        for (const item of res.items) {
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

        // ✅ Set chính xác giỏ hàng từ backend
        setCartFromBackend(Array.from(groupedMap.values()));
      } catch (err) {
        console.error("Lỗi khi lấy giỏ hàng:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [state.user]);

  const { updateCartQuantity, removeFromCart, getCartTotal } = useApp();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };
  const [stockErrors, setStockErrors] = useState<{ [key: string]: string }>({});
  const [stockLimits, setStockLimits] = useState<{ [key: string]: number }>({});

  const handleQuantityChange = async (maCTSP: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const result = await checkStockAvailability(maCTSP);
      const availableStock = result.soLuongTon;
      const key = `${maCTSP}`;

      if (newQuantity > availableStock) {
        setStockErrors((prev) => ({
          ...prev,
          [key]: `Chỉ còn ${availableStock} sản phẩm trong kho`,
        }));
        setStockLimits((prev) => ({ ...prev, [key]: availableStock }));
        return;
      }

      // Nếu số lượng <= tồn kho thì xóa lỗi và cập nhật
      setStockErrors((prev) => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
      setStockLimits((prev) => ({ ...prev, [key]: availableStock }));

      updateCartQuantity(maCTSP, newQuantity);
    } catch (error) {
      console.error("Lỗi kiểm tra kho:", error);
      alert("Không thể kiểm tra tồn kho.");
    }
  };

  const applyCoupon = () => {
    // Mock coupon validation
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Giỏ hàng của bạn
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {state.cart.length} sản phẩm trong giỏ hàng
          </p>
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
                  {/* Product Image */}
                  <div className="w-full sm:w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Product Details */}
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

                    {/* Price and Quantity */}
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

                      {/* Quantity Controls */}
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

                    {/* Subtotal */}
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

          {/* Clear Cart Button */}
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
              {/* Coupon Code */}
              {/* <div className="space-y-2">
                <label className="text-sm font-medium">Mã giảm giá</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nhập mã giảm giá"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <Button variant="outline" onClick={applyCoupon}>
                    Áp dụng
                  </Button>
                </div>
                {appliedCoupon && (
                  <div className="flex items-center justify-between text-green-600 dark:text-green-400">
                    <span className="text-sm">
                      Mã {appliedCoupon.code} (-{appliedCoupon.discount}%)
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAppliedCoupon(null)}
                      className="h-auto p-1 text-xs"
                    >
                      Bỏ
                    </Button>
                  </div>
                )}
              </div> */}

              <Separator />

              {/* Price Breakdown */}
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

              {/* Total */}
              <div className="flex justify-between text-lg font-bold">
                <span>Tổng cộng</span>
                <span className="text-brand-600 dark:text-brand-400">
                  {formatPrice(total)}
                </span>
              </div>

              {/* Free Shipping Notice */}
              {subtotal < 500000 && (
                <div className="text-sm text-gray-600 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  Mua thêm {formatPrice(500000 - subtotal)} để được miễn phí vận
                  chuyển!
                </div>
              )}

              {/* Checkout Button */}
              <Link to="/checkout" className="block">
                <Button className="w-full bg-brand-600 hover:bg-brand-700">
                  Tiến hành thanh toán
                </Button>
              </Link>

              {/* Payment Methods */}
              {/* <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Chúng tôi chấp nhận
                </p>
                <div className="flex justify-center space-x-2">
                  <div className="bg-white border rounded px-2 py-1 text-xs font-medium">
                    VISA
                  </div>
                  <div className="bg-white border rounded px-2 py-1 text-xs font-medium">
                    MASTER
                  </div>
                  <div className="bg-white border rounded px-2 py-1 text-xs font-medium">
                    COD
                  </div>
                  <div className="bg-white border rounded px-2 py-1 text-xs font-medium">
                    MOMO
                  </div>
                </div>
              </div> */}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
