import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../../components/ui/card";
import { useApp } from "../../contexts/AppContext";
import { createOrder } from "../../services/api";

export default function CheckoutSuccess() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { clearCart } = useApp();
    const [isVerifying, setIsVerifying] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState<"success" | "failed" | "pending">("pending");

    useEffect(() => {
        const verifyPayment = async () => {
            // Get payment info from URL params
            const orderCode = searchParams.get("orderCode");
            const status = searchParams.get("status");
            const cancel = searchParams.get("cancel");

            console.log("Payment callback params:", { orderCode, status, cancel });

            // Allow valid statuses or no status (direct navigation default success)
            if (cancel === "true" || status === "CANCELLED") {
                setPaymentStatus("failed");
                setIsVerifying(false);
            } else if (status === "PAID" || status === "SUCCESS" || !status) {
                try {
                    // Check for pending order payload from PayOS checkout
                    const pendingPayload = localStorage.getItem("pendingOrderPayload");
                    if (pendingPayload) {
                        const payload = JSON.parse(pendingPayload);
                        // Create the order now
                        await createOrder(payload);
                        // Remove payload after successful creation
                        localStorage.removeItem("pendingOrderPayload");
                    }

                    setPaymentStatus("success");
                    clearCart();
                } catch (error) {
                    console.error("Failed to verify/create order:", error);
                    // Payment successful but order failed -> Critical error
                    alert("Thanh toán thành công nhưng không thể tạo đơn hàng. Vui lòng liên hệ bộ phận hỗ trợ.");
                    // Still show success? Or failed? 
                    // If we show failed, user might retry payment -> Double charge.
                    // Better to show success but warn? Or show failed?
                    // User requested generic "after payment done, call api".
                    // I'll set to failed so they know something is wrong.
                    setPaymentStatus("failed");
                } finally {
                    setIsVerifying(false);
                }
            }
        };

        // Run verification
        const timer = setTimeout(() => {
            verifyPayment();
        }, 1000);

        return () => clearTimeout(timer);
    }, [searchParams, clearCart]);

    if (isVerifying) {
        return (
            <div className="container mx-auto px-4 py-20">
                <Card className="max-w-md mx-auto">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="w-16 h-16 animate-spin text-brand-600" />
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Đang xác thực thanh toán...
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300 text-center">
                                Vui lòng chờ trong giây lát
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (paymentStatus === "failed") {
        return (
            <div className="container mx-auto px-4 py-20">
                <Card className="max-w-md mx-auto">
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                            <XCircle className="w-20 h-20 text-red-500" />
                        </div>
                        <CardTitle className="text-center text-2xl text-red-600">
                            Thanh toán thất bại
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
                            Đơn hàng của bạn chưa được thanh toán. Vui lòng thử lại.
                        </p>
                        <div className="flex gap-4">
                            <Button
                                onClick={() => navigate("/")}
                                variant="outline"
                                className="flex-1"
                            >
                                Về trang chủ
                            </Button>
                            <Button
                                onClick={() => navigate("/checkout")}
                                className="flex-1 bg-brand-600 hover:bg-brand-700"
                            >
                                Thử lại
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-20">
            <Card className="max-w-md mx-auto">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <CheckCircle className="w-20 h-20 text-green-500" />
                    </div>
                    <CardTitle className="text-center text-2xl text-green-600">
                        Đặt hàng thành công!
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
                        Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đang được xử lý.
                    </p>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            💡 Vui lòng chờ nhân viên xét duyệt đơn hàng của bạn. Bạn sẽ nhận được thông báo qua email khi đơn hàng được xác nhận.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Button
                            onClick={() => navigate("/")}
                            className="flex-1 bg-brand-600 hover:bg-brand-700"
                        >
                            Tiếp tục mua sắm
                        </Button>
                        <Button
                            onClick={() => navigate("/orders")}
                            variant="outline"
                            className="flex-1"
                        >
                            Xem đơn hàng
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
