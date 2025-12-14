import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  DollarSign,
  FileText,
  Package,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import { useApp } from "../../contexts/AppContext";
import { convertNumberToWords, formatVietnameseCurrency } from "@/lib/utils";
import PaymentCreationModal from "../../components/PaymentCreationModal";
import PaymentDetailModal from "../../components/PaymentDetailModal";
import {
  getReturnSlipsByStatus,
  updateReturnSlipStatus,
  createReturnPayment,
  getReturnRequestsByStatus,
} from "../../services/api";
import { toast } from "sonner";

export default function ReturnManagement() {
  const { state } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [returnRequests, setReturnRequests] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "approve" | "reject" | null
  >(null);
  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1); // 1: Chờ duyệt, 2: Đã duyệt, 3: Từ chối
  const [showPaymentCreationModal, setShowPaymentCreationModal] =
    useState(false);
  const [showPaymentDetailModal, setShowPaymentDetailModal] = useState(false);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<
    "all" | "with-payment" | "without-payment"
  >("all");

  // Fetch return requests from API
  useEffect(() => {
    const fetchReturnRequests = async () => {
      setLoading(true);
      try {
        const response = await getReturnRequestsByStatus(activeTab);
        if (response && response.data && response.data.data) {
          setReturnRequests(response.data.data);
          setPagination(response.data.pagination);
        } else {
          setReturnRequests([]);
          setPagination(null);
        }
      } catch (err) {
        setError("Không thể tải danh sách phiếu trả hàng");
        console.error("Error fetching return requests:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReturnRequests();

    // Reset payment filter when switching tabs
    if (activeTab !== 2) {
      setPaymentFilter("all");
    }
  }, [activeTab]);

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

  const isPermitted =
    state.user.role === "Admin" || state.user.role === "NhanVienCuaHang";

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
      // minute: "2-digit",
      // second: "2-digit",
    });
  };

  const getStatusBadge = (status: number) => {
    const statusMap = {
      1: { label: "Chờ duyệt", variant: "secondary" as const },
      2: { label: "Đã duyệt", variant: "default" as const },
      3: { label: "Từ chối", variant: "destructive" as const },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap];
    return (
      <Badge variant={statusInfo?.variant || "secondary"}>
        {statusInfo?.label || `Trạng thái ${status}`}
      </Badge>
    );
  };

  // Filter return requests based on search and payment filter
  const filteredReturns = returnRequests.filter((returnRequest) => {
    const matchesSearch =
      searchTerm === "" ||
      returnRequest.MaPhieuTra.toString().includes(searchTerm) ||
      returnRequest.SoHD.includes(searchTerm) ||
      returnRequest.HoaDon.DonDatHang.KhachHang.TenKH.toLowerCase().includes(
        searchTerm.toLowerCase()
      ) ||
      returnRequest.HoaDon.DonDatHang.KhachHang.SDT.includes(searchTerm);

    // Payment filter (only apply in approved tab)
    let matchesPaymentFilter = true;
    if (activeTab === 2) {
      if (paymentFilter === "with-payment") {
        matchesPaymentFilter = !!returnRequest.PhieuChi;
      } else if (paymentFilter === "without-payment") {
        matchesPaymentFilter = !returnRequest.PhieuChi;
      }
    }

    return matchesSearch && matchesPaymentFilter;
  });

  // Statistics - we'll need to fetch all statuses for the stats
  const [allReturnRequests, setAllReturnRequests] = useState<any[]>([]);

  // Fetch all return requests for statistics
  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
          getReturnRequestsByStatus(1),
          getReturnRequestsByStatus(2),
          getReturnRequestsByStatus(3),
        ]);

        const allData = [
          ...(pendingRes?.data?.data || []),
          ...(approvedRes?.data?.data || []),
          ...(rejectedRes?.data?.data || []),
        ];

        setAllReturnRequests(allData);
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };

    fetchAllStats();
  }, []);

  const stats = {
    total: allReturnRequests.length,
    pending: allReturnRequests.filter((r) => r.TrangThai === 1).length,
    approved: allReturnRequests.filter((r) => r.TrangThai === 2).length,
    rejected: allReturnRequests.filter((r) => r.TrangThai === 3).length,
    approvedWithPayment: allReturnRequests.filter(
      (r) => r.TrangThai === 2 && r.PhieuChi !== null
    ).length,
    approvedWithoutPayment: allReturnRequests.filter(
      (r) => r.TrangThai === 2 && r.PhieuChi === null
    ).length,
    totalRefundAmount: allReturnRequests.reduce((sum, returnRequest) => {
      console.log("Return: ", allReturnRequests);
      if (returnRequest.HoaDon?.DonDatHang?.CT_DonDatHangs) {
        const orderTotal =
          returnRequest.HoaDon.DonDatHang.CT_DonDatHangs.reduce(
            (ctSum: number, ct: any) =>
              ctSum + Number(ct.DonGia) * ct.SoLuongTra,
            0
          );
        return sum + orderTotal;
      }
      return sum;
    }, 0),
  };

  const handleViewDetails = (returnRequest: any) => {
    setSelectedReturn(returnRequest);
    setShowDetailsModal(true);
  };

  const handleApproveReturn = async (returnRequest: any) => {
    setSelectedReturn(returnRequest);
    setConfirmAction("approve");
    setShowConfirmModal(true);
  };

  const handleRejectReturn = async (returnRequest: any) => {
    setSelectedReturn(returnRequest);
    setConfirmAction("reject");
    setShowConfirmModal(true);
  };

  const executeAction = async () => {
    if (!selectedReturn || !confirmAction) return;

    setIsUpdatingStatus(true);
    try {
      const status = confirmAction === "approve" ? 2 : 3;
      const response = await updateReturnSlipStatus(selectedReturn.MaPhieuTra, {
        trangThaiPhieu: status,
      });

      if (response.success) {
        // Refresh the current tab data
        const fetchResponse = await getReturnRequestsByStatus(activeTab);
        if (fetchResponse && fetchResponse.data && fetchResponse.data.data) {
          setReturnRequests(fetchResponse.data.data);
          setPagination(fetchResponse.data.pagination);
        }

        const actionText = confirmAction === "approve" ? "Duyệt" : "Từ chối";
        alert(`${actionText} phiếu trả thành công!`);

        // Refresh stats
        const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
          getReturnSlipsByStatus(1),
          getReturnSlipsByStatus(2),
          getReturnSlipsByStatus(3),
        ]);

        const allData = [
          ...(pendingRes?.data?.data || []),
          ...(approvedRes?.data?.data || []),
          ...(rejectedRes?.data?.data || []),
        ];

        setAllReturnRequests(allData);

        // Close modals
        setShowConfirmModal(false);
        setShowDetailsModal(false);
      } else {
        const actionText = confirmAction === "approve" ? "duyệt" : "từ chối";
        alert(`Có lỗi xảy ra khi ${actionText} phiếu trả: ` + response.message);
      }
    } catch (err: any) {
      console.error(`Error ${confirmAction}ing return:`, err);
      const actionText = confirmAction === "approve" ? "duyệt" : "từ chối";
      alert(
        `Có lỗi xảy ra khi ${actionText} phiếu trả: ` +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Payment handling functions
  const handleCreatePayment = async () => {
    setIsCreatingPayment(true);
    try {
      // Calculate total amount to refund
      const soTien =
        selectedReturn?.HoaDon?.DonDatHang?.CT_DonDatHangs?.reduce(
          (sum: number, item: any) =>
            sum + Number(item.DonGia || 0) * (item.SoLuongTra || 0),
          0
        ) || 0;

      const response = await createReturnPayment({
        maPhieuTra: selectedReturn.MaPhieuTra,
        soTien: soTien,
      });

      if (response && response.success) {
        toast.success("Tạo phiếu chi thành công!");

        // Refresh current tab data
        const fetchReturnRequestsAfterPayment = async () => {
          setLoading(true);
          try {
            const response = await getReturnRequestsByStatus(activeTab);
            if (response && response.data && response.data.data) {
              setReturnRequests(response.data.data);
              setPagination(response.data.pagination);
            }
          } catch (err) {
            console.error("Error fetching return requests:", err);
          } finally {
            setLoading(false);
          }
        };

        // Refresh statistics data
        const refreshStats = async () => {
          try {
            const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
              getReturnSlipsByStatus(1),
              getReturnSlipsByStatus(2),
              getReturnSlipsByStatus(3),
            ]);

            const allData = [
              ...(pendingRes?.data?.data || []),
              ...(approvedRes?.data?.data || []),
              ...(rejectedRes?.data?.data || []),
            ];

            setAllReturnRequests(allData);
          } catch (err) {
            console.error("Error fetching stats:", err);
          }
        };

        // Execute both refresh operations
        await Promise.all([fetchReturnRequestsAfterPayment(), refreshStats()]);
        setShowPaymentCreationModal(false);
      } else {
        alert(`Có lỗi xảy ra khi tạo phiếu chi: ${response.message}`);
      }
    } catch (err: any) {
      toast.error(
        `Có lỗi xảy ra khi tạo phiếu chi: ${
          err.response?.data?.message || err.message
        }`
      );
    } finally {
      setIsCreatingPayment(false);
    }
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
              Xử lý yêu cầu trả hàng - duyệt hoặc từ chối phiếu trả
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

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab(1)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 1
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Chờ duyệt
              {stats.pending > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-yellow-500 rounded-full">
                  {stats.pending}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab(2)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 2
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Đã duyệt
              {stats.approved > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-green-500 rounded-full">
                  {stats.approved}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab(3)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 3
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Từ chối
              {stats.rejected > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                  {stats.rejected}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Tìm kiếm theo mã phiếu trả, số hóa đơn, tên khách hàng, số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {/* Payment Filter - Only show in approved tab */}
          {activeTab === 2 && (
            <Select
              value={paymentFilter}
              onValueChange={(
                value: "all" | "with-payment" | "without-payment"
              ) => setPaymentFilter(value)}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Lọc theo phiếu chi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center justify-between w-full">
                    <span>Tất cả</span>
                    <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                      {stats.approved}
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="without-payment">
                  <div className="flex items-center justify-between w-full">
                    <span>Chưa có phiếu chi</span>
                    <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                      {stats.approvedWithoutPayment}
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="with-payment">
                  <div className="flex items-center justify-between w-full">
                    <span>Đã có phiếu chi</span>
                    <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      {stats.approvedWithPayment}
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Return Requests Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {activeTab === 1
                    ? "Phiếu trả chờ duyệt"
                    : activeTab === 2
                    ? "Phiếu trả đã duyệt"
                    : "Phiếu trả bị từ chối"}
                </CardTitle>
                <CardDescription>
                  {activeTab === 1
                    ? "Danh sách các phiếu trả hàng đang chờ xử lý. Nhấn vào dòng để xem chi tiết."
                    : activeTab === 2
                    ? `Danh sách các phiếu trả hàng đã được duyệt. ${
                        paymentFilter === "without-payment"
                          ? "Hiển thị phiếu trả chưa có phiếu chi."
                          : paymentFilter === "with-payment"
                          ? "Hiển thị phiếu trả đã có phiếu chi."
                          : "Nhấn vào dòng để xem chi tiết."
                      }`
                    : "Danh sách các phiếu trả hàng bị từ chối. Nhấn vào dòng để xem chi tiết."}
                </CardDescription>
              </div>

              {/* Filter Status Indicator */}
              {activeTab === 2 && paymentFilter !== "all" && (
                <div className="flex items-center gap-2">
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      paymentFilter === "without-payment"
                        ? "bg-red-100 text-red-700 border border-red-200"
                        : "bg-green-100 text-green-700 border border-green-200"
                    }`}
                  >
                    {paymentFilter === "without-payment"
                      ? "Chưa có phiếu chi"
                      : "Đã có phiếu chi"}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPaymentFilter("all")}
                    className="h-6 w-6 p-0"
                  >
                    ✕
                  </Button>
                </div>
              )}
            </div>
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
                    <TableHead>Mã phiếu trả</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Tổng tiền hoàn</TableHead>
                    <TableHead>Ngày trả</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReturns.map((returnRequest) => (
                    <TableRow
                      key={returnRequest.MaPhieuTra}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      onClick={() => handleViewDetails(returnRequest)}
                    >
                      <TableCell className="font-medium">
                        #{returnRequest.MaPhieuTra.toString().padStart(3, "0")}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {returnRequest.HoaDon.DonDatHang.KhachHang.TenKH}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {returnRequest.HoaDon.DonDatHang.KhachHang.SDT}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>
                            {(() => {
                              const products =
                                returnRequest.HoaDon?.DonDatHang
                                  ?.CT_DonDatHangs;
                              const count = products?.length || 0;
                              return count;
                            })()}{" "}
                            sản phẩm
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const products =
                            returnRequest.HoaDon?.DonDatHang?.CT_DonDatHangs;
                          const total =
                            products?.reduce((sum: number, ct: any) => {
                              const itemTotal =
                                Number(ct.DonGia || 0) * (ct.SoLuongTra || 0);
                              return sum + itemTotal;
                            }, 0) || 0;

                          return formatVietnameseCurrency(total, "VND");
                        })()}
                      </TableCell>
                      <TableCell>{formatDate(returnRequest.NgayTra)}</TableCell>
                      <TableCell>
                        {getStatusBadge(returnRequest.TrangThai)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {returnRequest.TrangThai === 1 &&
                            activeTab === 1 &&
                            isPermitted && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApproveReturn(returnRequest);
                                  }}
                                  disabled={isUpdatingStatus}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Duyệt
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRejectReturn(returnRequest);
                                  }}
                                  disabled={isUpdatingStatus}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Từ chối
                                </Button>
                              </>
                            )}
                          {returnRequest.TrangThai === 2 &&
                            activeTab === 2 &&
                            isPermitted && (
                              <>
                                {returnRequest.PhieuChi ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedReturn(returnRequest);
                                      setShowPaymentDetailModal(true);
                                    }}
                                  >
                                    <DollarSign className="h-3 w-3 mr-1" />
                                    Xem phiếu chi
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedReturn(returnRequest);
                                      setShowPaymentCreationModal(true);
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    <DollarSign className="h-3 w-3 mr-1" />
                                    Tạo phiếu chi
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
              {searchTerm
                ? "Thử thay đổi bộ lọc để xem thêm kết quả"
                : "Chưa có yêu cầu trả hàng nào"}
            </p>
          </div>
        )}

        {/* Pagination info */}
        {/* {pagination && (
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-300 text-center">
            Hiển thị {filteredReturns.length} / {pagination.totalItems} kết quả
            {pagination.totalPages > 1 && (
              <span>
                {" "}
                - Trang {pagination.currentPage} / {pagination.totalPages}
              </span>
            )}
          </div>
        )} */}
      </div>

      {/* Return Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-6xl max-h-[88vh] overflow-y-auto">
          <DialogHeader className="pb-2 bg-white dark:bg-gray-950 border-b">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              Chi tiết phiếu trả hàng
            </DialogTitle>
          </DialogHeader>

          <div className="px-1 pb-4">
            {selectedReturn && (
              <div className="space-y-6">
                {/* Status Bar */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Trạng thái:</span>
                    {getStatusBadge(selectedReturn.TrangThai)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Tổng hoàn trả: </span>
                    <span className="font-bold text-green-600">
                      {formatPrice(
                        selectedReturn?.HoaDon?.DonDatHang?.CT_DonDatHangs?.reduce(
                          (sum: number, item: any) =>
                            sum + Number(item.DonGia) * item.SoLuongTra,
                          0
                        ) || 0
                      )}
                    </span>
                  </div>
                </div>

                {/* Information Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Return Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Thông tin phiếu trả
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Mã phiếu trả:
                          </span>
                          <span className="font-mono font-semibold text-sm">
                            #{selectedReturn.MaPhieuTra.toString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Số hóa đơn:
                          </span>
                          <span className="font-mono text-sm">
                            {selectedReturn.SoHD}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Ngày trả:
                          </span>
                          <span className="text-sm">
                            {formatDate(selectedReturn.NgayTra)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Customer Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Thông tin khách hàng mua
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Tên khách hàng:
                          </span>
                          <span
                            className="font-semibold text-right max-w-32 text-sm"
                            title={
                              selectedReturn.HoaDon.DonDatHang.KhachHang.TenKH
                            }
                          >
                            {selectedReturn.HoaDon.DonDatHang.KhachHang.TenKH}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Số điện thoại:
                          </span>
                          <span className="font-mono text-sm">
                            {selectedReturn.HoaDon.DonDatHang.KhachHang.SDT}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Delivery Address Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Thông tin địa chỉ giao hàng
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Tên người nhận:
                          </span>
                          <span
                            className="font-semibold text-right max-w-32 text-sm"
                            title={
                              selectedReturn.HoaDon.DonDatHang.NguoiNhan ||
                              selectedReturn.HoaDon.DonDatHang.KhachHang.TenKH
                            }
                          >
                            {selectedReturn.HoaDon.DonDatHang.NguoiNhan ||
                              selectedReturn.HoaDon.DonDatHang.KhachHang.TenKH}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            SĐT người nhận:
                          </span>
                          <span className="font-mono text-sm">
                            {selectedReturn.HoaDon.DonDatHang.SDT ||
                              selectedReturn.HoaDon.DonDatHang.KhachHang.SDT}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Địa chỉ giao hàng:
                          </span>
                          <span className="text-sm leading-relaxed bg-gray-50 dark:bg-gray-800 p-2 rounded">
                            {selectedReturn.HoaDon.DonDatHang.DiaChiGiao ||
                              "Không có địa chỉ giao hàng"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Return Reason */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Lý do trả hàng</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                      <p className="text-sm text-gray-800 font-semibold dark:text-gray-200 leading-relaxed">
                        {selectedReturn.LyDo || "Không có lý do cụ thể"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Products Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Danh sách sản phẩm trả hàng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-sm">Sản phẩm</TableHead>
                          <TableHead className="text-center text-sm">
                            Thuộc tính
                          </TableHead>
                          <TableHead className="text-right text-sm">
                            Đơn giá
                          </TableHead>
                          <TableHead className="text-center text-sm">
                            SL trả
                          </TableHead>
                          <TableHead className="text-right text-sm">
                            Thành tiền
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedReturn?.HoaDon?.DonDatHang?.CT_DonDatHangs?.map(
                          (item: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>
                                <div>
                                  <div className="font-medium text-sm">
                                    {item.ChiTietSanPham.SanPham.TenSP}
                                  </div>
                                  <div className="text-sm text-gray-500 font-mono">
                                    SKU: {item.ChiTietSanPham.SanPham.MaSP}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="space-y-2">
                                  {/* Size */}
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="text-sm px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded font-medium">
                                      {item.ChiTietSanPham.KichThuoc
                                        ?.TenKichThuoc || "N/A"}
                                    </div>
                                  </div>
                                  {/* Color with preview */}
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="flex items-center gap-1">
                                      {item.ChiTietSanPham.Mau?.MaHex && (
                                        <div
                                          className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
                                          style={{
                                            backgroundColor:
                                              item.ChiTietSanPham.Mau.MaHex,
                                          }}
                                          title={
                                            item.ChiTietSanPham.Mau?.TenMau ||
                                            "N/A"
                                          }
                                        ></div>
                                      )}
                                      <span className="text-sm px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded">
                                        {item.ChiTietSanPham.Mau?.TenMau ||
                                          "N/A"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {formatPrice(Number(item.DonGia))}
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded text-sm font-medium">
                                  {item.SoLuongTra}
                                </span>
                              </TableCell>
                              <TableCell className="text-right font-mono font-medium text-sm">
                                {formatPrice(
                                  Number(item.DonGia) * item.SoLuongTra
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        ) || (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              className="text-center text-gray-500"
                            >
                              Không có dữ liệu sản phẩm
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>

                    {/* Table Footer */}
                    <div className="border-t bg-gray-50 dark:bg-gray-800 px-3 py-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Tổng{" "}
                          {selectedReturn?.HoaDon?.DonDatHang?.CT_DonDatHangs?.reduce(
                            (sum: number, item: any) => sum + item.SoLuongTra,
                            0
                          ) || 0}{" "}
                          sản phẩm
                        </span>
                        <div className="text-right">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Tổng tiền hoàn trả
                          </div>
                          <div className="text-lg font-bold text-green-600">
                            {formatPrice(
                              selectedReturn?.HoaDon?.DonDatHang?.CT_DonDatHangs?.reduce(
                                (sum: number, item: any) =>
                                  sum + Number(item.DonGia) * item.SoLuongTra,
                                0
                              ) || 0
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t bottom-0 bg-white dark:bg-gray-950 z-10">
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-gray-500">
                {selectedReturn?.TrangThai === 1 && (
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    Đang chờ xử lý
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Đóng
                </Button>
                {selectedReturn?.TrangThai === 1 &&
                  activeTab === 1 &&
                  isPermitted && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApproveReturn(selectedReturn)}
                        disabled={isUpdatingStatus}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Duyệt
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRejectReturn(selectedReturn)}
                        disabled={isUpdatingStatus}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Từ chối
                      </Button>
                    </>
                  )}
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              {confirmAction === "approve" ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Xác nhận duyệt phiếu trả
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  Xác nhận từ chối phiếu trả
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {selectedReturn && (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between col-span-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        Mã phiếu trả:
                      </span>
                      <span className="font-mono font-semibold">
                        #{selectedReturn.MaPhieuTra}
                      </span>
                    </div>
                    <div className="flex justify-between col-span-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        Số hóa đơn:
                      </span>
                      <span className="font-mono">{selectedReturn.SoHD}</span>
                    </div>
                    <div className="flex justify-between col-span-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        Khách hàng:
                      </span>
                      <span className="font-medium">
                        {selectedReturn.HoaDon.DonDatHang.KhachHang.TenKH}
                      </span>
                    </div>
                    <div className="flex justify-between col-span-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        Số tiền hoàn trả:
                      </span>
                      <span className="font-bold text-green-600">
                        {formatPrice(
                          selectedReturn?.HoaDon?.DonDatHang?.CT_DonDatHangs?.reduce(
                            (sum: number, item: any) =>
                              sum + Number(item.DonGia) * item.SoLuongTra,
                            0
                          ) || 0
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action specific message */}
                <div
                  className={`border rounded-lg p-3 ${
                    confirmAction === "approve"
                      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                  }`}
                >
                  <p
                    className={`text-sm font-medium ${
                      confirmAction === "approve"
                        ? "text-green-800 dark:text-green-200"
                        : "text-red-800 dark:text-red-200"
                    }`}
                  >
                    {confirmAction === "approve" ? (
                      <>
                        <strong>Xác nhận duyệt:</strong> Phiếu trả này sẽ được
                        duyệt và trạng thái sẽ chuyển thành "Đã duyệt". Bạn có
                        chắc chắn muốn tiếp tục?
                      </>
                    ) : (
                      <>
                        <strong>Xác nhận từ chối:</strong> Phiếu trả này sẽ bị
                        từ chối và trạng thái sẽ chuyển thành "Từ chối". Bạn có
                        chắc chắn muốn tiếp tục?
                      </>
                    )}
                  </p>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2">
                  <p>
                    <strong>Lưu ý:</strong> Hành động này không thể hoàn tác.
                    Vui lòng kiểm tra kỹ thông tin trước khi xác nhận.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              disabled={isUpdatingStatus}
            >
              Hủy
            </Button>
            <Button
              onClick={executeAction}
              disabled={isUpdatingStatus}
              className={
                confirmAction === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {isUpdatingStatus ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Đang xử lý...
                </>
              ) : (
                <>
                  {confirmAction === "approve" ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Xác nhận duyệt
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Xác nhận từ chối
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Creation Modal */}
      <PaymentCreationModal
        open={showPaymentCreationModal}
        onOpenChange={setShowPaymentCreationModal}
        selectedReturn={selectedReturn}
        isCreatingPayment={isCreatingPayment}
        formatPrice={formatPrice}
        onCreatePayment={handleCreatePayment}
      />

      {/* Payment Detail Modal */}
      <PaymentDetailModal
        open={showPaymentDetailModal}
        onOpenChange={setShowPaymentDetailModal}
        selectedReturn={selectedReturn}
        formatVietnameseCurrency={formatVietnameseCurrency}
        convertNumberToWords={convertNumberToWords}
      />
    </div>
  );
}
