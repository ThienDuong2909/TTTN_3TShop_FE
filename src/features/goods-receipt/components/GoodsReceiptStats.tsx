import { Package, CheckCircle, Upload, Loader2 } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { formatPrice } from "../../../services/api";

interface GoodsReceiptStatsProps {
  stats: {
    pendingPOs: number;
    monthlyReceipts: number;
    totalValue: number;
  };
  loading: {
    goodsReceipts: boolean;
    purchaseOrders: boolean;
  };
}

export default function GoodsReceiptStats({ stats, loading }: GoodsReceiptStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Phiếu chờ nhập
              </p>
              <p className="text-2xl font-bold">
                {loading.purchaseOrders ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  stats.pendingPOs
                )}
              </p>
            </div>
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Đã nhập tháng này
              </p>
              <p className="text-2xl font-bold">
                {loading.goodsReceipts ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  stats.monthlyReceipts
                )}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Giá trị nhập kho
              </p>
              <p className="text-2xl font-bold">
                {loading.goodsReceipts ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  formatPrice(stats.totalValue)
                )}
              </p>
            </div>
            <Upload className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 