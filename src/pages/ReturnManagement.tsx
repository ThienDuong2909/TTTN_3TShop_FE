import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  Package,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useApp } from "../contexts/AppContext";
// @ts-ignore
import api from "../services/fetch";

export default function ReturnManagement() {
  const { state } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [returnRequests, setReturnRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch return requests from API
  useEffect(() => {
    const fetchReturnRequests = async () => {
      setLoading(true);
      try {
        const response = await api.get("/return/requests");
        const data = response.data;
        if (data && data.data && data.data.returnRequests) {
          setReturnRequests(data.data.returnRequests);
        } else {
          setReturnRequests([]);
        }
      } catch (err) {
        setError("Không thể tải danh sách phiếu trả hàng");
        console.error("Error fetching return requests:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReturnRequests();
  }, []);

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

  const isAdmin = state.user.role === "Admin";

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      TRAHANG: { label: "Chờ duyệt", variant: "secondary" as const },
      COMPLETED: { label: "Đã duyệt", variant: "default" as const },
      REJECTED: { label: "Từ chối", variant: "destructive" as const },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap];
    return (
      <Badge variant={statusInfo?.variant || "secondary"}>
        {statusInfo?.label || status}
      </Badge>
    );
  };

  // Filter return requests based on search and status
  const filteredReturns = returnRequests.filter((returnRequest) => {
    const matchesSearch =
      searchTerm === "" ||
      returnRequest.MaDDH.toString().includes(searchTerm) ||
      returnRequest.KhachHang.TenKH.toLowerCase().includes(
        searchTerm.toLowerCase()
      ) ||
      returnRequest.KhachHang.SDT.includes(searchTerm);

    const apiStatus = returnRequest.TrangThaiDH.TrangThai;
    let filterStatus = "";
    if (apiStatus === "TRAHANG") filterStatus = "pending";
    else if (apiStatus === "COMPLETED") filterStatus = "approved";
    else if (apiStatus === "REJECTED") filterStatus = "rejected";

    const matchesStatus =
      statusFilter === "all" || filterStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Statistics
  const stats = {
    total: returnRequests.length,
    pending: returnRequests.filter((r) => r.TrangThaiDH.TrangThai === "TRAHANG")
      .length,
    approved: returnRequests.filter(
      (r) => r.TrangThaiDH.TrangThai === "COMPLETED"
    ).length,
    rejected: returnRequests.filter(
      (r) => r.TrangThaiDH.TrangThai === "REJECTED"
    ).length,
    totalRefundAmount: returnRequests.reduce(
      (sum, order) => sum + order.TongTien,
      0
    ),
  };

  const handleViewDetails = (returnRequest: any) => {
    console.log("Viewing details for:", returnRequest);
    // TODO: Implement view details modal
  };

  const handleApproveReturn = (returnRequest: any) => {
    console.log("Approving return for:", returnRequest);
    // TODO: Implement approval logic
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Quản lý phiếu trả hàng
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Xử lý yêu cầu trả hàng và tạo phiếu chi hoàn tiền
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tổng phiếu trả
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chờ duyệt</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đã duyệt</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.approved}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Từ chối</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.rejected}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tổng hoàn tiền
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {formatPrice(stats.totalRefundAmount)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Tìm kiếm theo mã hóa đơn, tên khách hàng, số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="pending">Chờ duyệt</SelectItem>
              <SelectItem value="approved">Đã duyệt</SelectItem>
              <SelectItem value="rejected">Từ chối</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Lọc
          </Button>
        </div>

        {/* Return Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách phiếu trả hàng</CardTitle>
            <CardDescription>
              Quản lý và xử lý các yêu cầu trả hàng từ khách hàng
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p>Đang tải dữ liệu...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-500">{error}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã đơn hàng</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Tổng tiền</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReturns.map((returnRequest) => (
                    <TableRow key={returnRequest.MaDDH}>
                      <TableCell className="font-medium">
                        #{returnRequest.MaDDH.toString().padStart(3, "0")}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {returnRequest.KhachHang.TenKH}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {returnRequest.KhachHang.SDT}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          <span>
                            {returnRequest.CT_DonDatHangs.length} sản phẩm
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatPrice(returnRequest.TongTien)}
                      </TableCell>
                      <TableCell>{formatDate(returnRequest.NgayTao)}</TableCell>
                      <TableCell>
                        {getStatusBadge(returnRequest.TrangThaiDH.TrangThai)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(returnRequest)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          {returnRequest.TrangThaiDH.TrangThai === "TRAHANG" &&
                            isAdmin && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleApproveReturn(returnRequest)
                                }
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Duyệt
                              </Button>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* No results */}
        {filteredReturns.length === 0 && !loading && (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Không tìm thấy phiếu trả hàng
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {searchTerm || statusFilter !== "all"
                ? "Thử thay đổi bộ lọc để xem thêm kết quả"
                : "Chưa có yêu cầu trả hàng nào"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
