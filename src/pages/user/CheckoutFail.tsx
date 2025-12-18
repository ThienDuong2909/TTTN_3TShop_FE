import { useNavigate, useSearchParams } from "react-router-dom";
import { XCircle } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../../components/ui/card";

export default function CheckoutFail() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const orderCode = searchParams.get("orderCode");
    const reason = searchParams.get("reason") || "Không xác định";

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
                    <div className="space-y-4">
                        <p className="text-center text-gray-600 dark:text-gray-300">
                            Đơn hàng của bạn chưa được thanh toán thành công.
                        </p>

                        {orderCode && (
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    <span className="font-medium">Mã đơn hàng:</span> {orderCode}
                                </p>
                            </div>
                        )}

                        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                            <p className="text-sm text-orange-800 dark:text-orange-200">
                                <span className="font-medium">Lý do:</span> {reason}
                            </p>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                💡 <strong>Các lý do có thể:</strong>
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li>Bạn đã hủy thanh toán</li>
                                    <li>Phiên thanh toán đã hết hạn</li>
                                    <li>Lỗi kết nối ngân hàng</li>
                                    <li>Thông tin thanh toán không hợp lệ</li>
                                </ul>
                            </p>
                        </div>

                        <div className="flex gap-4 pt-4">
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
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
