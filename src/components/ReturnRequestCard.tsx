import {
  Calendar,
  User,
  Phone,
  Mail,
  Package,
  FileText,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { PhieuTraHang } from "../lib/data";

interface ReturnRequestCardProps {
  returnRequest: PhieuTraHang;
  onViewDetails?: () => void;
}

export function ReturnRequestCard({
  returnRequest,
  onViewDetails,
}: ReturnRequestCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      // hour: "2-digit",
      // minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Chờ duyệt", variant: "secondary" as const },
      approved: { label: "Đã duyệt", variant: "default" as const },
      rejected: { label: "Từ chối", variant: "destructive" as const },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap];
    return (
      <Badge variant={statusInfo?.variant || "secondary"}>
        {statusInfo?.label || status}
      </Badge>
    );
  };

  const totalAmount = returnRequest.SanPham.reduce(
    (sum, product) => sum + product.ThanhTien,
    0
  );

  return (
    <Card
      className="w-full hover:shadow-md transition-shadow cursor-pointer"
      onClick={onViewDetails}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Phiếu trả #{returnRequest.MaPhieuTra.toString().padStart(3, "0")}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4" />
              {formatDate(returnRequest.NgayTra)}
            </CardDescription>
          </div>
          {getStatusBadge(returnRequest.TrangThai)}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Customer Information */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              {returnRequest.KhachHang.TenKH.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {returnRequest.KhachHang.TenKH}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span>{returnRequest.KhachHang.SoDienThoai}</span>
              </div>
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span>{returnRequest.KhachHang.Email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Information */}
        <div className="flex items-center justify-between py-2 border-b">
          <span className="text-sm font-medium">Hóa đơn:</span>
          <Badge variant="outline">{returnRequest.SoHD}</Badge>
        </div>

        {/* Products */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4" />
            <span className="font-medium">
              Sản phẩm ({returnRequest.SanPham.length})
            </span>
          </div>
          <div className="space-y-2">
            {returnRequest.SanPham.map((product, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded"
              >
                <img
                  src={product.Hinh}
                  alt={product.TenSP}
                  className="w-12 h-12 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {product.TenSP}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    SL: {product.SoLuong} × {formatPrice(product.DonGia)}
                  </div>
                </div>
                <div className="text-sm font-medium">
                  {formatPrice(product.ThanhTien)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Amount */}
        <div className="flex items-center justify-between pt-2 border-t font-medium">
          <span>Tổng tiền trả:</span>
          <span className="text-lg">{formatPrice(totalAmount)}</span>
        </div>

        {/* Return Reason */}
        {returnRequest.LyDo && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <div className="font-medium text-sm text-yellow-800 dark:text-yellow-200">
                  Lý do trả hàng:
                </div>
                <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  {returnRequest.LyDo}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Staff Information */}
        {returnRequest.NVLap && (
          <div className="text-xs text-muted-foreground">
            Được xử lý bởi nhân viên ID: {returnRequest.NVLap}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
