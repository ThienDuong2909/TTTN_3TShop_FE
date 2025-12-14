import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  Package,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { useApp } from "../../contexts/AppContext";
// @ts-ignore
import api from "../../services/fetch";
import { formatVietnameseCurrency } from "@/lib/utils";

// Import các modal components
import ReturnDetailsModal from "../../components/ReturnDetailsModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import PaymentCreationModal from "../../components/PaymentCreationModal";
import PaymentDetailModal from "../../components/PaymentDetailModal";

// Helper function to convert number to Vietnamese words
const convertNumberToWords = (num: number): string => {
  if (num === 0) return "không";

  const ones = [
    "",
    "một",
    "hai",
    "ba",
    "bốn",
    "năm",
    "sáu",
    "bảy",
    "tám",
    "chín",
  ];

  const tens = [
    "",
    "",
    "hai mươi",
    "ba mươi",
    "bốn mươi",
    "năm mươi",
    "sáu mươi",
    "bảy mươi",
    "tám mươi",
    "chín mươi",
  ];

  const scales = ["", "nghìn", "triệu", "tỷ"];

  if (num < 10) return ones[num];
  if (num < 100) {
    const ten = Math.floor(num / 10);
    const one = num % 10;
    if (ten === 1) {
      return one === 0 ? "mười" : `mười ${ones[one]}`;
    }
    return `${tens[ten]}${one > 0 ? ` ${ones[one]}` : ""}`;
  }

  // For larger numbers, convert recursively
  const groups = [];
  let temp = num;
  let scaleIndex = 0;

  while (temp > 0) {
    const group = temp % 1000;
    if (group > 0) {
      let groupStr = "";
      const hundreds = Math.floor(group / 100);
      const remainder = group % 100;

      if (hundreds > 0) {
        groupStr += `${ones[hundreds]} trăm`;
      }

      if (remainder > 0) {
        if (hundreds > 0) groupStr += " ";
        if (remainder < 10) {
          groupStr += `lẻ ${ones[remainder]}`;
        } else if (remainder < 20) {
          groupStr +=
            remainder === 10 ? "mười" : `mười ${ones[remainder % 10]}`;
        } else {
          const ten = Math.floor(remainder / 10);
          const one = remainder % 10;
          groupStr += `${tens[ten]}${one > 0 ? ` ${ones[one]}` : ""}`;
        }
      }

      if (scaleIndex > 0) {
        groupStr += ` ${scales[scaleIndex]}`;
      }

      groups.unshift(groupStr);
    }
    temp = Math.floor(temp / 1000);
    scaleIndex++;
  }

  return groups.join(" ");
};

interface Return {
  MaPhieuTra: number;
  SoHD: string;
  NgayTra: string;
  TrangThai: number;
  LyDo: string;
  PhieuChi?: any;
  HoaDon: {
    DonDatHang: {
      KhachHang: {
        TenKH: string;
        SDT: string;
        DiaChi?: string;
      };
      TenNguoiNhan?: string;
      SDTNguoiNhan?: string;
      DiaChiGiao?: string;
      CT_DonDatHangs: Array<{
        DonGia: number;
        SoLuongTra: number;
        ChiTietSanPham: {
          SKU: string;
          SanPham: {
            TenSP: string;
          };
          KichThuoc: {
            TenSize: string;
          };
          Mau: {
            TenMau: string;
            MaMau: string;
          };
        };
      }>;
    };
  };
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalRefundAmount: number;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export default function ReturnManagement() {
  const { state } = useApp();
  const user = state.user;
  const isAdmin = user?.role === "Admin";

  // State management
  const [activeTab, setActiveTab] = useState(1);
  const [returns, setReturns] = useState<Return[]>([]);
  const [filteredReturns, setFilteredReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPayment, setFilterPayment] = useState<"all" | "has" | "none">(
    "all"
  );

  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentDetailModal, setShowPaymentDetailModal] = useState(false);

  // Selected items and actions
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject">(
    "approve"
  );
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);

  // Statistics and pagination
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalRefundAmount: 0,
  });
  const [pagination] = useState<Pagination | null>(null);

  // Utility functions
  const formatPrice = (price: number) => {
    return price.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });
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

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Chờ duyệt
          </Badge>
        );
      case 2:
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Đã duyệt
          </Badge>
        );
      case 3:
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            Từ chối
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            Không xác định
          </Badge>
        );
    }
  };

  // API functions
  const fetchReturns = async (status?: number) => {
    try {
      setLoading(true);
      let url = "/return/requests";
      if (status) {
        url += `?status=${status}`;
      }
      console.log("URL: ", url);
      const response = await api.get(url);

      if (response.data?.success) {
        const returnsData = response.data.data || [];
        console.log("Data: ", returnsData);
        setReturns(returnsData);

        // Calculate statistics
        const stats = returnsData.reduce(
          (acc: Stats, returnItem: Return) => {
            acc.total++;
            if (returnItem.TrangThai === 1) acc.pending++;
            else if (returnItem.TrangThai === 2) acc.approved++;
            else if (returnItem.TrangThai === 3) acc.rejected++;

            // Calculate refund amount for approved returns
            if (returnItem.TrangThai === 2) {
              const refundAmount =
                returnItem?.HoaDon?.DonDatHang?.CT_DonDatHangs?.reduce(
                  (sum: number, item: any) =>
                    sum + Number(item.DonGia || 0) * (item.SoLuongTra || 0),
                  0
                ) || 0;
              acc.totalRefundAmount += refundAmount;
            }

            return acc;
          },
          {
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
            totalRefundAmount: 0,
          }
        );

        setStats(stats);
        setError(null);
      } else {
        throw new Error(response.data?.message || "Failed to fetch returns");
      }
    } catch (err: any) {
      console.error("Error fetching returns:", err);
      setError(err?.response?.data?.message || "Có lỗi xảy ra khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const updateReturnStatus = async (returnId: number, status: number) => {
    try {
      setIsUpdatingStatus(true);
      const response = await api.put(`/return/${returnId}/approve`, {
        TrangThai: status,
      });

      if (response.data?.success) {
        await fetchReturns(activeTab);
        setShowConfirmModal(false);
        setSelectedReturn(null);
      } else {
        throw new Error(response.data?.message || "Failed to update status");
      }
    } catch (err: any) {
      console.error("Error updating return status:", err);
      alert(
        err?.response?.data?.message || "Có lỗi xảy ra khi cập nhật trạng thái"
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const createPaymentSlip = async (returnRequest: Return) => {
    try {
      setIsCreatingPayment(true);

      const refundAmount =
        returnRequest?.HoaDon?.DonDatHang?.CT_DonDatHangs?.reduce(
          (sum: number, item: any) =>
            sum + Number(item.DonGia || 0) * (item.SoLuongTra || 0),
          0
        ) || 0;

      const response = await api.post("/phieu-chi", {
        MaPhieuTra: returnRequest.MaPhieuTra,
        SoTien: refundAmount,
        NgayChi: new Date().toISOString(),
        MaNV: user?.id || 1,
      });

      if (response.data?.success) {
        await fetchReturns(activeTab);
        setShowPaymentModal(false);
        setSelectedReturn(null);
        alert("Tạo phiếu chi thành công!");
      } else {
        throw new Error(
          response.data?.message || "Failed to create payment slip"
        );
      }
    } catch (err: any) {
      console.error("Error creating payment slip:", err);
      alert(err?.response?.data?.message || "Có lỗi xảy ra khi tạo phiếu chi");
    } finally {
      setIsCreatingPayment(false);
    }
  };

  // Event handlers
  const handleViewDetails = (returnRequest: Return) => {
    setSelectedReturn(returnRequest);
    setShowDetailsModal(true);
  };

  const handleApproveReturn = (returnRequest: Return) => {
    setSelectedReturn(returnRequest);
    setConfirmAction("approve");
    setShowConfirmModal(true);
  };

  const handleRejectReturn = (returnRequest: Return) => {
    setSelectedReturn(returnRequest);
    setConfirmAction("reject");
    setShowConfirmModal(true);
  };

  const handleCreatePaymentSlip = (returnRequest: Return) => {
    setSelectedReturn(returnRequest);
    setShowPaymentModal(true);
  };

  const handleViewPaymentSlip = (returnRequest: Return) => {
    setSelectedReturn(returnRequest);
    setShowPaymentDetailModal(true);
  };

  const executeAction = () => {
    if (!selectedReturn) return;

    const status = confirmAction === "approve" ? 2 : 3;
    updateReturnStatus(selectedReturn.MaPhieuTra, status);
  };

  const handleCreatePayment = () => {
    if (!selectedReturn) return;
    createPaymentSlip(selectedReturn);
  };

  // Effects
  useEffect(() => {
    // Fetch returns based on active tab
    fetchReturns(activeTab);
  }, [activeTab]);

  useEffect(() => {
    let filtered = returns.filter((returnItem) => {
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const customerName =
          returnItem?.HoaDon?.DonDatHang?.KhachHang?.TenKH?.toLowerCase() || "";
        const customerPhone =
          returnItem?.HoaDon?.DonDatHang?.KhachHang?.SDT || "";
        const returnId = returnItem.MaPhieuTra.toString();
        const invoiceNumber = returnItem.SoHD?.toLowerCase() || "";

        if (
          !customerName.includes(searchLower) &&
          !customerPhone.includes(searchLower) &&
          !returnId.includes(searchLower) &&
          !invoiceNumber.includes(searchLower)
        ) {
          return false;
        }
      }

      // Filter by payment status (only for approved tab)
      if (activeTab === 2 && filterPayment !== "all") {
        if (filterPayment === "has" && !returnItem.PhieuChi) return false;
        if (filterPayment === "none" && returnItem.PhieuChi) return false;
      }

      return true;
    });

    setFilteredReturns(filtered);
  }, [returns, activeTab, searchTerm, filterPayment]);

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
          {/* Bộ lọc phiếu chi chỉ hiển thị ở tab Đã duyệt */}
          {activeTab === 2 && (
            <div className="flex items-center gap-2">
              <span className="text-sm">Phiếu chi:</span>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={filterPayment}
                onChange={(e) =>
                  setFilterPayment(e.target.value as "all" | "has" | "none")
                }
              >
                <option value="all">Tất cả</option>
                <option value="has">Đã có phiếu chi</option>
                <option value="none">Chưa có phiếu chi</option>
              </select>
            </div>
          )}
        </div>

        {/* Return Requests Table */}
        <Card>
          <CardHeader>
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
                ? "Danh sách các phiếu trả hàng đã được duyệt. Nhấn vào dòng để xem chi tiết."
                : "Danh sách các phiếu trả hàng bị từ chối. Nhấn vào dòng để xem chi tiết."}
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
                    <TableHead>Mã phiếu trả</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Số SP</TableHead>
                    <TableHead>Tiền hoàn trả</TableHead>
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
                        #{returnRequest.MaPhieuTra.toString()}
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
                            {returnRequest.HoaDon?.DonDatHang?.CT_DonDatHangs
                              ?.length || 0}{" "}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatPrice(
                          returnRequest.HoaDon?.DonDatHang?.CT_DonDatHangs?.reduce(
                            (sum: number, ct: any) =>
                              sum +
                              Number(ct.DonGia || 0) * (ct.SoLuongTra || 0),
                            0
                          ) || 0
                        )}
                      </TableCell>
                      <TableCell>{formatDate(returnRequest.NgayTra)}</TableCell>
                      <TableCell>
                        {getStatusBadge(returnRequest.TrangThai)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {returnRequest.TrangThai === 1 &&
                            activeTab === 1 &&
                            isAdmin && (
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
                            isAdmin && (
                              <>
                                {returnRequest.PhieuChi === null ? (
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCreatePaymentSlip(returnRequest);
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    <DollarSign className="h-3 w-3 mr-1" />
                                    Tạo phiếu chi
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewPaymentSlip(returnRequest);
                                    }}
                                  >
                                    <FileText className="h-3 w-3 mr-1" />
                                    Xem phiếu chi
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

      {/* Modal Components */}
      <ReturnDetailsModal
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        selectedReturn={selectedReturn}
        activeTab={activeTab}
        isAdmin={isAdmin}
        isUpdatingStatus={isUpdatingStatus}
        formatPrice={formatPrice}
        formatDate={formatDate}
        getStatusBadge={getStatusBadge}
        onApproveReturn={handleApproveReturn}
        onRejectReturn={handleRejectReturn}
        onCreatePaymentSlip={handleCreatePaymentSlip}
        onViewPaymentSlip={handleViewPaymentSlip}
      />

      <ConfirmationModal
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        selectedReturn={selectedReturn}
        confirmAction={confirmAction}
        isUpdatingStatus={isUpdatingStatus}
        formatPrice={formatPrice}
        onExecuteAction={executeAction}
      />

      <PaymentCreationModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        selectedReturn={selectedReturn}
        isCreatingPayment={isCreatingPayment}
        formatPrice={formatPrice}
        onCreatePayment={handleCreatePayment}
      />

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
