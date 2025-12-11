// filepath: e:\ThucTap\TTTN_3TShop_FE\frontend\src\pages\Checkout.tsx
// Checkout with success modal
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Loader2 } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { Badge } from "../../components/ui/badge";
import { useApp } from "../../contexts/AppContext";
import {
  createOrder as apiCreateOrder,
  createPayOSLink,
  getCurrentExchangeRate,
  getProvinces,
  getWards,
  Province,
  Ward,
} from "../../services/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import dayjs from "dayjs";
declare global {
  interface Window {
    paypal: any;
  }
}

import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { Label } from "../../components/ui/label";

export default function Checkout() {
  const { state, getCartTotal, clearCart, refreshCart } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState(state.user?.name || "");
  const [address, setAddress] = useState(state.user?.address || "");
  const [phone, setPhone] = useState("");
  const [deliveryTime, setDeliveryTime] = useState(
    new Date().toISOString().slice(0, 16)
  ); // Default to current date and time
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "paypal" | "qr">("cod");
  const [errors, setErrors] = useState<{
    name?: string;
    address?: string;
    phone?: string;
  }>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef(name);
  const addressRef = useRef(address);
  const phoneRef = useRef(phone);
  const deliveryTimeRef = useRef(deliveryTime);

  const [usdRate, setUsdRate] = useState(23000);
  const [payOSUrl, setPayOSUrl] = useState("");
  const [isPayOSOpen, setIsPayOSOpen] = useState(false);

  // Update PayOS config whenever it changes so `openPayOS` uses latest config? 
  // Actually usePayOS accepts config. If config changes, does it update? 
  // Usually hooks react to state changes. 
  // But we need to set checkout URL *after* getting it from backend.
  // We might need to call open() only when config is ready. 
  // UseEffect to trigger open if ready? Or ref?
  // Let's rely on setting state, and then in a useEffect, if checkoutUrl is present and we just set it, open it.
  // Or just calling open() might work if the hook updates its internal ref. 
  // Re-reading docs: "usePayOS chấp nhận một đối số là Object... trả về {open, exit}".
  // If we update state, component re-renders, usePayOS gets new config.




  // Address split state
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string>("");
  const [selectedWardCode, setSelectedWardCode] = useState<string>("");
  const [houseNumber, setHouseNumber] = useState<string>("");
  const [filteredWards, setFilteredWards] = useState<Ward[]>([]);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isLoadingCart, setIsLoadingCart] = useState(false);

  // Fetch address data
  useEffect(() => {
    const fetchAddressData = async () => {
      setIsLoadingAddress(true);
      try {
        const [provincesData, wardsData] = await Promise.all([
          getProvinces(),
          getWards(),
        ]);
        // Filter only Ho Chi Minh City (Code 79)
        const hcmCity = provincesData.filter((p) => p.code === 79);
        setProvinces(hcmCity);
        setWards(wardsData);

        // Auto select HCM City if available
        if (hcmCity.length > 0) {
          setSelectedProvinceCode(hcmCity[0].code.toString());
        }
      } catch (error) {
        console.error("Error fetching address data:", error);
      } finally {
        setIsLoadingAddress(false);
      }
    };
    fetchAddressData();
  }, []);

  // Filter wards when province changes
  useEffect(() => {
    if (selectedProvinceCode) {
      const filtered = wards.filter(
        (w) => w.province_code === Number(selectedProvinceCode)
      );
      setFilteredWards(filtered);
      setSelectedWardCode("");
    } else {
      setFilteredWards([]);
      setSelectedWardCode("");
    }
  }, [selectedProvinceCode, wards]);

  // Update full address string
  useEffect(() => {
    if (selectedProvinceCode && selectedWardCode && houseNumber) {
      const province = provinces.find(
        (p) => p.code === Number(selectedProvinceCode)
      );
      const ward = wards.find((w) => w.code === Number(selectedWardCode));

      if (province && ward) {
        const fullAddress = `${houseNumber}, ${ward.name}, ${province.name}`;
        setAddress(fullAddress);
        addressRef.current = fullAddress;
      }
    }
  }, [selectedProvinceCode, selectedWardCode, houseNumber, provinces, wards]);


  const subtotal = getCartTotal();
  const shippingFee = subtotal >= 500000 ? 0 : 30000;
  const total = subtotal + shippingFee;

  useEffect(() => {
    if (!state.user) {
      navigate("/login", { state: { from: "/checkout" } });
    }
  }, [state.user]);

  // Refresh cart if empty and user exists (handle reload)
  useEffect(() => {
    const fetchCart = async () => {
      if (state.user && state.cart.length === 0) {
        setIsLoadingCart(true);
        try {
          await refreshCart();
        } catch (error) {
          console.error("Failed to refresh cart:", error);
        } finally {
          setIsLoadingCart(false);
        }
      }
    };
    fetchCart();
  }, [state.user, state.cart.length]);
  useEffect(() => {
    getCurrentExchangeRate()
      .then((rate) => {
        if (rate) {
        }
        console.log("Current USD exchange rate:", rate);
        setUsdRate(rate);
      })
      .catch(() => setUsdRate(23000));
  }, []);

  useEffect(() => {
    if (
      !window.paypal ||
      state.cart.length === 0 ||
      !paypalContainerRef.current
    )
      return;

    paypalContainerRef.current.innerHTML = "";

    window.paypal
      .Buttons({
        createOrder: (data, actions) => {
          const currentName = nameRef.current.trim();
          const currentAddress = addressRef.current.trim();
          const currentPhone = phoneRef.current.trim();
          console.log("Current Name:", currentName);
          console.log("Current Address:", currentAddress);
          console.log("Current Phone:", currentPhone);
          const newErrors: typeof errors = {};
          if (!currentName) newErrors.name = "Vui lòng nhập họ và tên";
          if (!currentAddress)
            newErrors.address = "Vui lòng nhập địa chỉ giao hàng";
          if (!/^\d{10}$/.test(currentPhone))
            newErrors.phone = "Số điện thoại phải có 10 chữ số";

          setErrors(newErrors);

          if (Object.keys(newErrors).length > 0) {
            return actions.reject();
          }

          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  value: (total / usdRate).toFixed(2),
                  currency_code: "USD",
                },
              },
            ],
          });
        },
        onApprove: async (data, actions) => {
          const details = await actions.order.capture();
          await handlePlaceOrder(
            nameRef.current,
            addressRef.current,
            phoneRef.current,
            deliveryTimeRef.current,
            "paypal"
          );
        },
        onError: (err) => {
          console.error(err);
        },
      })
      .render(paypalContainerRef.current);
  }, [total, usdRate]);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = "Vui lòng nhập họ và tên";
    if (!address.trim()) newErrors.address = "Vui lòng nhập địa chỉ giao hàng";
    if (!/^\d{10}$/.test(phone.trim()))
      newErrors.phone = "Số điện thoại phải có 10 chữ số";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handlePlaceOrder = async (
    nameValue = name,
    addressValue = address,
    phoneValue = phone,
    deliveryTimeValue = deliveryTime,
    paymentMethodArg = "cod" // Default or explicit
  ) => {
    try {
      const payload = {
        maKH: state.user?.id,
        nguoiNhan: nameValue,
        diaChiGiao: addressValue,
        SDT: phoneValue,
        thoiGianGiao: deliveryTimeValue,
        dsSanPham: state.cart.map((item) => ({
          maCTSP: item.product.id,
          soLuong: item.quantity,
        })),
        phuongThucThanhToan: paymentMethodArg,
      };

      const response = await apiCreateOrder(payload);

      // Handle PayOS (QR) Payment
      if (paymentMethodArg === "qr") {
        const orderId = response.data?.MaDDH || response.data?.id;

        if (orderId) {
          try {
            // This call should return the checkoutUrl from backend
            const payOSRes = await createPayOSLink(orderId);
            console.log("PayOS Response:", payOSRes);

            if (payOSRes.data && payOSRes.data.checkoutUrl) {
              // Open PayOS checkout page in new tab
              window.open(payOSRes.data.checkoutUrl, '_blank');

              // Clear cart and show success message
              clearCart();
              setShowSuccessModal(true);
              return;
            }
          } catch (payOSError: any) {
            console.error("PayOS Error:", payOSError);
            console.error("PayOS Error Response:", payOSError.response?.data);
            const errorMsg = payOSError.response?.data?.message || payOSError.message || "Lỗi không xác định";
            alert(`Lỗi khi tạo link thanh toán PayOS: ${errorMsg}`);
          }
        }
      }

      clearCart();
      setShowSuccessModal(true);
    } catch (err) {
      alert("Lỗi khi gửi đơn hàng về server.");
      console.error(err);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Thêm trước return:
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const minDateTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  if (state.cart.length === 0 && !showSuccessModal) {
    if (isLoadingCart) {
      return (
        <div className="container mx-auto px-4 py-20 text-center flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <span className="ml-2 text-gray-600">Đang tải giỏ hàng...</span>
        </div>
      );
    }

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
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
        Xác nhận đơn hàng
      </h1>

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
                  onChange={(e) => {
                    setName(e.target.value);
                    nameRef.current = e.target.value;
                  }}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Địa chỉ giao hàng</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 mt-2">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 flex items-center gap-2">
                      Tỉnh / Thành phố
                      {isLoadingAddress && <Loader2 className="h-3 w-3 animate-spin text-gray-400" />}
                    </label>
                    <Select
                      value={selectedProvinceCode}
                      onValueChange={setSelectedProvinceCode}
                      disabled={isLoadingAddress}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn Tỉnh / Thành phố" />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map((province) => (
                          <SelectItem
                            key={province.code}
                            value={province.code.toString()}
                          >
                            {province.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-gray-500">Phường / Xã</label>
                    <Select
                      value={selectedWardCode}
                      onValueChange={setSelectedWardCode}
                      disabled={!selectedProvinceCode}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn Phường / Xã" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredWards.map((ward) => (
                          <SelectItem
                            key={ward.code}
                            value={ward.code.toString()}
                          >
                            {ward.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-gray-500">Số nhà, tên đường</label>
                  <Input
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    placeholder="Số nhà, tên đường..."
                    className={errors.address ? "border-red-500" : ""}
                  />
                </div>

                {/* Hidden input to store the full address for form submission if needed, 
                    but we are updating 'address' state directly so it might not be strictly necessary 
                    to show the full address, but maybe good for verification */}
                {address && (
                  <p className="text-xs text-gray-500 mt-2">
                    Địa chỉ đầy đủ: {address}
                  </p>
                )}

                {errors.address && (
                  <p className="text-sm text-red-500 mt-1">{errors.address}</p>
                )}
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium">Số điện thoại</label>
                  <Input
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      phoneRef.current = e.target.value;
                    }}
                    className={errors.phone ? "border-red-500" : ""}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                  )}
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium">
                    Thời gian giao hàng
                  </label>
                  <Input
                    type="datetime-local"
                    min={minDateTime}
                    value={deliveryTime}
                    onChange={(e) => {
                      setDeliveryTime(e.target.value);
                      deliveryTimeRef.current = e.target.value;
                    }}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {deliveryTime
                      ? "Đã chọn: " +
                      dayjs(deliveryTime).format("HH:mm DD-MM-YYYY")
                      : ""}
                  </div>
                </div>
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
                        <Badge variant="outline">
                          Size: {item.selectedSize}
                        </Badge>
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
              <span className="text-brand-600 dark:text-brand-400">
                {formatPrice(total)}
              </span>
            </div>
            {/* <div className="space-y-4">
              <Button
                className="w-full bg-brand-600 hover:bg-brand-700"
                onClick={handlePlaceOrder}
              >
                Xác nhận đặt hàng (Thanh toán COD)
              </Button>
            </div> 
            */}
            <div className="space-y-4 pt-4">
              {/*
              <Button
                className="w-full bg-brand-600 hover:bg-brand-700 h-12 text-lg"
                onClick={() => {
                  if (validate()) {
                    handlePlaceOrder(name, address, phone, deliveryTime, "qr");
                  }
                }}
              >
                Thanh toán qua PayOS (QR)
              </Button>
            */}

              {/* PayPal Container - Always show */}
              <div
                ref={paypalContainerRef}
                className="w-full"
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showSuccessModal}>
        <DialogContent className="text-center">
          <DialogHeader>
            <DialogTitle className="text-green-600 text-xl font-bold">
              Đặt hàng thành công!
            </DialogTitle>
          </DialogHeader>
          <p className="text-gray-600 mt-2">
            Vui lòng chờ nhân viên xét duyệt đơn hàng của bạn.
          </p>
          <DialogFooter className="mt-6">
            <Button onClick={() => navigate("/")}>Tiếp tục mua sắm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  );
}
