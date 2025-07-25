import { Package, Send, CheckCircle, FileText, Loader2 } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { formatPrice } from "../../../services/api";
import { PurchaseOrderStats as StatsType, PurchaseOrderLoading } from "../types";

interface PurchaseOrderStatsProps {
  stats: StatsType;
  loading: PurchaseOrderLoading;
}

export default function PurchaseOrderStats({ stats, loading }: PurchaseOrderStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Tổng đơn hàng
              </p>
              <p className="text-lg font-bold">
                {loading.purchaseOrders ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  stats.totalOrders
                )}
              </p>
            </div>
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Đơn nháp
              </p>
              <p className="text-lg font-bold">
                {loading.purchaseOrders ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  stats.draftOrders
                )}
              </p>
            </div>
            <FileText className="h-6 w-6 text-gray-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Chờ xử lý
              </p>
              <p className="text-lg font-bold">
                {loading.purchaseOrders ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  stats.pendingOrders
                )}
              </p>
            </div>
            <Send className="h-6 w-6 text-orange-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Hoàn thành
              </p>
              <p className="text-lg font-bold">
                {loading.purchaseOrders ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  stats.completedOrders
                )}
              </p>
            </div>
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Giá trị tổng
              </p>
              <p className="text-lg font-bold">
                {loading.purchaseOrders ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  formatPrice(stats.totalValue)
                )}
              </p>
            </div>
            <Package className="h-6 w-6 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Tháng này
              </p>
              <p className="text-lg font-bold">
                {loading.purchaseOrders ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  stats.monthlyOrders
                )}
              </p>
            </div>
            <FileText className="h-6 w-6 text-purple-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 