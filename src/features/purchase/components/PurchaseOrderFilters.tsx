import { Input } from "../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { PurchaseOrderFilters as PurchaseOrderFiltersType } from "../types";

interface PurchaseOrderFiltersProps {
  filters: PurchaseOrderFiltersType;
  onFilterChange: (key: keyof PurchaseOrderFiltersType, value: string) => void;
}

export default function PurchaseOrderFilters({
  filters,
  onFilterChange,
}: PurchaseOrderFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bộ lọc và tìm kiếm</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Tìm kiếm theo mã phiếu hoặc nhà cung cấp..."
              value={filters.searchQuery}
              onChange={(e) => onFilterChange("searchQuery", e.target.value)}
            />
          </div>
          <Select
            value={filters.statusFilter}
            onValueChange={(value) => onFilterChange("statusFilter", value)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="draft">Nháp</SelectItem>
              <SelectItem value="sent">Đã gửi</SelectItem>
              <SelectItem value="confirmed">Đã xác nhận</SelectItem>
              <SelectItem value="partially_received">Nhập một phần</SelectItem>
              <SelectItem value="completed">Hoàn thành</SelectItem>
              <SelectItem value="cancelled">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
} 