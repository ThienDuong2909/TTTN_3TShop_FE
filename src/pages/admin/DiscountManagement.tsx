import {
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  Package,
  Plus,
  Tag,
  Trash2,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { CreateDiscountPeriodDialog } from "../../components/CreateDiscountDialog";
import { DiscountPeriodDetailDialog } from "../../components/DiscountDetailDialog";
import { EditDiscountDialog } from "../../components/EditDiscountDialog";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { deletePromotion, getPromotions } from "../../services/api";
// import { useApp } from "../context/AppContext";

// Simple mock user state for testing
const mockUser = {
  role: "Admin",
};

// Types based on API response
interface DiscountPeriod {
  MaDot: number;
  NgayBatDau: string;
  NgayKetThuc: string;
  MoTa: string;
  CT_DotGiamGia: Array<{
    MaCTDGG: number;
    MaDot: number;
    MaSP: number;
    PhanTramGiam: string;
    SanPham: {
      MaSP: number;
      TenSP: string;
      AnhSanPhams: Array<{
        DuongDan: string;
      }>;
      ThayDoiGia: Array<{
        Gia: string;
        NgayApDung: string;
      }>;
    };
  }>;
  TrangThai: string;
  SoLuongSanPham: number;
}

// Utility functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("vi-VN");
};

const calculateDiscountStatus = (
  startDate: string,
  endDate: string
): string => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Reset time to compare only dates
  now.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (now < start) {
    return "Chưa bắt đầu";
  } else if (now > end) {
    return "Đã kết thúc";
  } else {
    return "Đang diễn ra";
  }
};

export default function DiscountManagement() {
  // const { state } = useApp(); // Comment out if AppContext is not available
  const state = { user: mockUser }; // Use mock for testing
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [discountPeriods, setDiscountPeriods] = useState<DiscountPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<DiscountPeriod | null>(
    null
  );
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [periodToDelete, setPeriodToDelete] = useState<DiscountPeriod | null>(
    null
  );
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [periodToEdit, setPeriodToEdit] = useState<DiscountPeriod | null>(null);

  // Load discount periods from API
  useEffect(() => {
    loadDiscountPeriods();
  }, []);

  const loadDiscountPeriods = async () => {
    try {
      setLoading(true);
      const response = await getPromotions();

      if (response.success) {
        // Calculate status for each period based on dates
        const periodsWithCalculatedStatus = response.data.data.map(
          (period: DiscountPeriod) => ({
            ...period,
            TrangThai: calculateDiscountStatus(
              period.NgayBatDau,
              period.NgayKetThuc
            ),
          })
        );

        setDiscountPeriods(periodsWithCalculatedStatus);
      } else {
        toast.error(response.message || "Không thể tải danh sách đợt giảm giá");
      }
    } catch (error: any) {
      console.error("Error loading discount periods:", error);
      toast.error("Có lỗi xảy ra khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  // Check if user has permission to access admin
  if (
    !state.user ||
    (state.user.role !== "Admin" && state.user.role !== "NhanVienCuaHang")
  ) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Không có quyền truy cập
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Bạn cần đăng nhập với tài khoản admin hoặc nhân viên để truy cập
            trang này.
          </p>
          <Link to="/login">
            <Button>Đăng nhập</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isAdmin =
    state.user.role === "Admin" || state.user.role === "NhanVienCuaHang";

  const getStatusBadge = (status: string) => {
    const statusMap = {
      "Đang diễn ra": {
        label: "Đang hoạt động",
        variant: "default" as const,
        icon: CheckCircle,
      },
      "Chưa bắt đầu": {
        label: "Chưa bắt đầu",
        variant: "secondary" as const,
        icon: Clock,
      },
      "Đã kết thúc": {
        label: "Đã kết thúc",
        variant: "destructive" as const,
        icon: XCircle,
      },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap];
    if (!statusInfo) return null;

    const Icon = statusInfo.icon;

    return (
      <Badge variant={statusInfo.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {statusInfo.label}
      </Badge>
    );
  };

  // Filter discount periods based on search and status
  const filteredPeriods = discountPeriods.filter((period) => {
    const matchesSearch =
      searchTerm === "" ||
      period.MoTa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      period.MaDot.toString().includes(searchTerm);

    let matchesStatus = true;
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        matchesStatus = period.TrangThai === "Đang diễn ra";
      } else if (statusFilter === "inactive") {
        matchesStatus = period.TrangThai === "Chưa bắt đầu";
      } else if (statusFilter === "expired") {
        matchesStatus = period.TrangThai === "Đã kết thúc";
      }
    }

    return matchesSearch && matchesStatus;
  });

  // Statistics
  const stats = {
    total: discountPeriods.length,
    active: discountPeriods.filter((p) => p.TrangThai === "Đang diễn ra")
      .length,
    inactive: discountPeriods.filter((p) => p.TrangThai === "Chưa bắt đầu")
      .length,
    expired: discountPeriods.filter((p) => p.TrangThai === "Đã kết thúc")
      .length,
    totalProducts: discountPeriods.reduce(
      (sum, p) => sum + (p.CT_DotGiamGia?.length || 0),
      0
    ),
  };

  const handleViewDetails = (period: DiscountPeriod) => {
    // Ensure the period has the calculated status
    const periodWithCalculatedStatus = {
      ...period,
      TrangThai: calculateDiscountStatus(period.NgayBatDau, period.NgayKetThuc),
    };
    setSelectedPeriod(periodWithCalculatedStatus);
    setShowDetailDialog(true);
  };

  const handleDetailClose = () => {
    setShowDetailDialog(false);
    setSelectedPeriod(null);
  };

  const handleDeleteDiscount = (period: DiscountPeriod) => {
    setPeriodToDelete(period);
    setShowDeleteDialog(true);
  };

  const handleEditDiscount = (period: DiscountPeriod) => {
    setPeriodToEdit(period);
    setShowEditDialog(true);
  };

  const confirmDeleteDiscount = async () => {
    if (!periodToDelete) return;

    try {
      const response = await deletePromotion(periodToDelete.MaDot);
      console.log("Delete response:", response);

      if (response.success) {
        toast.success("Xóa đợt giảm giá thành công");
        // Reload the data
        loadDiscountPeriods();
      } else {
        toast.error("Không thể xóa đợt giảm giá");
      }
    } catch (error: any) {
      console.error("Error deleting discount period:", error);
      toast.error("Có lỗi xảy ra khi xóa đợt giảm giá");
    } finally {
      setShowDeleteDialog(false);
      setPeriodToDelete(null);
    }
  };

  const handleCreateDiscount = () => {
    setShowCreateDialog(true);
  };
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Quản lý giảm giá sản phẩm
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Tạo và quản lý các đợt giảm giá cho sản phẩm
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tổng đợt giảm giá
              </CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Đang hoạt động
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.active}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Chưa bắt đầu
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.inactive}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đã kết thúc</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.expired}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tổng sản phẩm
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions and Filters */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            <div className="flex-1 max-w-sm">
              <Input
                placeholder="Tìm kiếm theo mô tả, mã đợt..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="inactive">Chưa bắt đầu</SelectItem>
                <SelectItem value="expired">Đã kết thúc</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreateDiscount}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo đợt giảm giá
          </Button>
        </div>

        {/* Discount Periods Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách đợt giảm giá</CardTitle>
            <CardDescription>
              Quản lý các đợt giảm giá và sản phẩm áp dụng
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đợt</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPeriods.map((period) => (
                  <TableRow key={period.MaDot}>
                    <TableCell className="font-medium">
                      #{period.MaDot.toString().padStart(3, "0")}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="font-medium truncate">
                          {period.MoTa || "Không có mô tả"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(period.NgayBatDau)} -{" "}
                          {formatDate(period.NgayKetThuc)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        <span>
                          {period.CT_DotGiamGia?.length || 0} sản phẩm
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(period.TrangThai)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(period)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        {isAdmin && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditDiscount(period)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            {/* Hide Delete button for active promotions */}
                            {period.TrangThai !== "Đang diễn ra" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteDiscount(period)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* No results */}
        {filteredPeriods.length === 0 && !loading && (
          <div className="text-center py-8">
            <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Không tìm thấy đợt giảm giá
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {searchTerm || statusFilter !== "all"
                ? "Thử thay đổi bộ lọc để xem thêm kết quả"
                : "Chưa có đợt giảm giá nào"}
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        )}

        {/* Dialog Components */}
        <CreateDiscountPeriodDialog
          isOpen={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => {
            setShowCreateDialog(false);
            loadDiscountPeriods();
          }}
        />

        {selectedPeriod && (
          <DiscountPeriodDetailDialog
            isOpen={showDetailDialog}
            onClose={handleDetailClose}
            period={selectedPeriod}
            onRefresh={loadDiscountPeriods}
          />
        )}

        {/* Edit Discount Dialog */}
        {periodToEdit && (
          <EditDiscountDialog
            isOpen={showEditDialog}
            onClose={() => {
              setShowEditDialog(false);
              setPeriodToEdit(null);
            }}
            discount={periodToEdit}
            onSuccess={() => {
              setShowEditDialog(false);
              setPeriodToEdit(null);
              loadDiscountPeriods();
            }}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                Xác nhận xóa đợt giảm giá
              </DialogTitle>
              <DialogDescription>
                Hành động này không thể hoàn tác. Đợt giảm giá và tất cả thông
                tin liên quan sẽ bị xóa vĩnh viễn.
              </DialogDescription>
            </DialogHeader>

            {periodToDelete && (
              <div className="py-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Thông tin đợt giảm giá:
                  </h4>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    <p>
                      <span className="font-medium">Mã đợt:</span> #
                      {periodToDelete.MaDot.toString().padStart(3, "0")}
                    </p>
                    <p>
                      <span className="font-medium">Mô tả:</span>{" "}
                      {periodToDelete.MoTa || "Không có mô tả"}
                    </p>
                    <p>
                      <span className="font-medium">Thời gian:</span>{" "}
                      {formatDate(periodToDelete.NgayBatDau)} -{" "}
                      {formatDate(periodToDelete.NgayKetThuc)}
                    </p>
                    <p>
                      <span className="font-medium">Số sản phẩm:</span>{" "}
                      {periodToDelete.CT_DotGiamGia?.length || 0} sản phẩm
                    </p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setPeriodToDelete(null);
                }}
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteDiscount}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Xóa đợt giảm giá
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
