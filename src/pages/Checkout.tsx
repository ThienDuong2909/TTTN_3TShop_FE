import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, CreditCard } from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { useApp } from "../contexts/AppContext";
import { createOrder as apiCreateOrder } from "../services/api";

declare global {
  interface Window {
    paypal: any;
  }
}

export default function Checkout() {
  const { state, getCartTotal, clearCart } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState(state.user?.name || "");
  const [address, setAddress] = useState(state.user?.address || "");
  const [errors, setErrors] = useState<{ name?: string; address?: string }>({});
  const paypalContainerRef = useRef<HTMLDivElement>(null);

  const subtotal = getCartTotal();
  const shippingFee = subtotal >= 500000 ? 0 : 30000;
  const total = subtotal + shippingFee;

  useEffect(() => {
    if (!state.user) {
      navigate("/login", { state: { from: "/checkout" } });
    }
  }, [state.user]);

  useEffect(() => {
    if (!window.paypal || state.cart.length === 0 || !paypalContainerRef.current) return;

    if (paypalContainerRef.current) {
      paypalContainerRef.current.innerHTML = "";
    }

    window.paypal
      .Buttons({
        createOrder: (data: any, actions: any) => {
          const newErrors: typeof errors = {};
          if (!name.trim()) newErrors.name = "Vui lòng nhập họ và tên";
          if (!address.trim()) newErrors.address = "Vui lòng nhập địa chỉ giao hàng";
          setErrors(newErrors);

          if (Object.keys(newErrors).length > 0) {
            return actions.reject();
          }

          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  value: (total / 23000).toFixed(2),
                  currency_code: "USD",
                },
              },
            ],
          });
        },
        onApprove: async (data: any, actions: any) => {
          const details = await actions.order.capture();
          await handlePlaceOrder();
        },
        onError: (err: any) => {
          alert("Lỗi trong quá trình thanh toán.");
          console.error(err);
        },
        style: {
          layout: "vertical",
          color: "gold",
          shape: "rect",
          label: "paypal",
        },
        disableFunding: ["card", "credit", "sepa", "sofort", "giropay", "eps", "bancontact", "ideal", "mybank", "p24", "venmo", "blik"],
      })
      .render(paypalContainerRef.current);
  }, [total, name, address]); // Thêm name, address vào dependency để re-render khi thay đổi

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = "Vui lòng nhập họ và tên";
    if (!address.trim()) newErrors.address = "Vui lòng nhập địa chỉ giao hàng";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (validate()) {
      try {
        const payload = {
          maKH: state.user?.id,
          nguoiNhan: name,
          diaChiGiao: address,
          dsSanPham: state.cart.map((item) => ({
            maCTSP: item.product.id,
            soLuong: item.quantity,
            // MaHex: item.selectedColor,
            // TenKichThuoc: item.selectedSize,
          })),
        };
        console.log("payload", payload);

        await apiCreateOrder(payload);
        clearCart();
        alert("Đặt hàng thành công!");
        navigate("/");
      } catch (err) {
        alert("Lỗi khi gửi đơn hàng về server.");
        console.error(err);
      }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  if (state.cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Không có sản phẩm nào để thanh toán
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán.
        </p>
        <Button onClick={() => navigate("/")}>Quay lại trang chủ</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Xác nhận đơn hàng</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin người nhận</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Họ và tên</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">Địa chỉ giao hàng</label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={errors.address ? "border-red-500" : ""}
                />
                {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address}</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sản phẩm đặt hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {state.cart.map((item, index) => (
                <div key={index} className="flex gap-4 items-center">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-20 h-20 rounded-lg object-cover border"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {item.product.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 flex flex-wrap gap-2 mt-1">
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
                        <Badge variant="outline">Size: {item.selectedSize}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-sm font-medium">{item.quantity} x</div>
                  <div className="font-semibold text-brand-600 dark:text-brand-400">
                    {formatPrice(item.product.price * item.quantity)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="sticky top-4 h-fit">
          <CardHeader>
            <CardTitle>Tóm tắt đơn hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Tạm tính</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
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
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Tổng cộng</span>
              <span className="text-brand-600 dark:text-brand-400">{formatPrice(total)}</span>
            </div>

            <div ref={paypalContainerRef} className="w-full mt-4"></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}