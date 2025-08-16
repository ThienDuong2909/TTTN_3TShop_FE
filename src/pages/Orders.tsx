import { useState, useEffect, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "../components/AdminHeader";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Search,
  Check,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  ChevronLeft,
  ChevronRight,
  Users,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Undo2,
  FileText,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import {
  getOrdersByStatus,
  getOrderStatistics,
  updateOrderStatus,
  updateBatchOrderStatus,
  getAvailableDeliveryStaff,
  updateOrderDeliveryStaff,
  updateBatchOrderCompletion,
  updateOrderCompletion,
  createInvoice,
} from "../services/api";
import { Checkbox } from "../components/ui/checkbox";
import { InvoiceView } from "../components/Invoice";
import {
  BatchApprovalModal,
  CancelOrderModal,
  SingleOrderApprovalModal,
  DeliveryAssignmentModal,
  BatchCompleteOrdersModal,
  SingleOrderCompleteModal,
  InvoiceCreationModal,
} from "../components/orders";

// Delivery Staff interface
interface DeliveryStaff {
  MaNV: number;
  TenNV: string;
  DiaChi: string;
  SoDonDangGiao: number;
  KhuVucPhuTrach: string | null;
}

// Order interfaces
interface OrderCustomer {
  MaKH: number;
  TenKH: string;
  SDT: string;
  DiaChi: string;
  CCCD: string;
}

interface OrderEmployee {
  MaNV: number;
  TenNV: string;
}

interface OrderStatus {
  MaTTDH: number;
  TrangThai: string;
}

interface OrderProduct {
  MaSP: number;
  TenSP: string;
  MoTa: string;
}

interface OrderSize {
  MaKichThuoc: number;
  TenKichThuoc: string;
}

interface OrderColor {
  MaMau: number;
  TenMau: string;
  MaHex: string;
}

interface OrderProductDetail {
  MaCTSP: number;
  MaSP: number;
  MaKichThuoc: number;
  MaMau: number;
  SoLuongTon: number;
  SanPham: OrderProduct;
  KichThuoc: OrderSize;
  Mau: OrderColor;
}

interface OrderItem {
  MaCTDDH: number;
  MaDDH: number;
  MaCTSP: number;
  SoLuong: number;
  DonGia: string;
  MaPhieuTra: number | null;
  SoLuongTra: number;
  ChiTietSanPham: OrderProductDetail;
}

interface Order {
  MaDDH: number;
  MaKH: number;
  MaNV_Duyet: number;
  MaNV_Giao: number | null;
  NgayTao: string;
  DiaChiGiao: string;
  ThoiGianGiao: string;
  NguoiNhan: string;
  SDT: string; // Số điện thoại của đơn hàng
  MaTTDH: number;
  TongTien: number;
  KhachHang: OrderCustomer;
  NguoiDuyet: OrderEmployee;
  NguoiGiao: OrderEmployee | null;
  TrangThaiDH: OrderStatus;
  CT_DonDatHangs: OrderItem[];
  HoaDon: Invoice | null;
}

interface Invoice {
  SoHD: string;
  NgayLap: string;
}

// Memoized SearchInput component to prevent focus loss
const SearchInput = memo(
  ({
    value,
    onChange,
    disabled,
    placeholder,
  }: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled: boolean;
    placeholder: string;
  }) => {
    return (
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="text-sm focus:outline-none focus:ring-0"
        />
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";

// Utility function to normalize Vietnamese text for search
const normalizeVietnameseText = (text: string): string => {
  if (!text) return "";

  // Convert to lowercase
  let normalized = text.toLowerCase();

  // Remove Vietnamese diacritics
  normalized = normalized
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
    .replace(/[èéẹẻẽêềếệểễ]/g, "e")
    .replace(/[ìíịỉĩ]/g, "i")
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
    .replace(/[ùúụủũưừứựửữ]/g, "u")
    .replace(/[ỳýỵỷỹ]/g, "y")
    .replace(/[đ]/g, "d")
    .replace(/[ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ]/g, "a")
    .replace(/[ÈÉẸẺẼÊỀẾỆỂỄ]/g, "e")
    .replace(/[ÌÍỊỈĨ]/g, "i")
    .replace(/[ÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ]/g, "o")
    .replace(/[ÙÚỤỦŨƯỪỨỰỬỮ]/g, "u")
    .replace(/[ỲÝỴỶỸ]/g, "y")
    .replace(/[Đ]/g, "d");

  // Remove extra spaces and trim
  normalized = normalized.replace(/\s+/g, " ").trim();

  return normalized;
};

export default function Orders() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("1");
  const [sortBy, setSortBy] = useState<string | null>(null); // null means no sorting
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC" | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]); // Store all orders for client-side processing
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });

  // Approval states
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvingOrders, setApprovingOrders] = useState(false);

  // Cancel order states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<number | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState(false);

  // Single order approval states
  const [showSingleApprovalModal, setShowSingleApprovalModal] = useState(false);
  const [orderToApprove, setOrderToApprove] = useState<number | null>(null);
  const [approvingSingleOrder, setApprovingSingleOrder] = useState(false);

  // Delivery assignment states
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [orderToAssign, setOrderToAssign] = useState<Order | null>(null);
  const [deliveryStaff, setDeliveryStaff] = useState<DeliveryStaff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<number | null>(null);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [assigningOrder, setAssigningOrder] = useState(false);

  // Complete order states
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completingOrders, setCompletingOrders] = useState(false);
  const [showSingleCompleteModal, setShowSingleCompleteModal] = useState(false);
  const [orderToComplete, setOrderToComplete] = useState<number | null>(null);
  const [completingSingleOrder, setCompletingSingleOrder] = useState(false);

  // Invoice states
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [orderToCreateInvoice, setOrderToCreateInvoice] =
    useState<Order | null>(null);
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  // Invoice view states
  const [showInvoiceView, setShowInvoiceView] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null);

  // Statistics state
  const [stats, setStats] = useState({
    total: 0,
    placed: 0, // Đã đặt (status 1)
    approved: 0, // Đã duyệt (status 2)
    shipping: 0, // Đang giao hàng (status 3)
    completed: 0, // Hoàn tất (status 4)
    cancelled: 0, // Hủy (status 5)
    returned: 0, // Trả hàng (status 7)
  });

  // Order status mapping
  const ORDER_STATUSES = {
    "1": { label: "Đã đặt", color: "secondary", icon: Clock },
    "2": { label: "Đã duyệt", color: "default", icon: CheckCircle },
    "3": { label: "Đang giao", color: "default", icon: Package },
    "4": { label: "Hoàn tất", color: "outline", icon: CheckCircle },
    "5": { label: "Hủy", color: "destructive", icon: XCircle },
    "7": { label: "Trả hàng", color: "secondary", icon: Undo2 },
  };

  // Process orders on client-side (search, sort, filter)
  const processOrders = useCallback(
    (
      ordersToProcess: Order[],
      searchTerm: string,
      sortField: string | null,
      sortDirection: "asc" | "desc" | null,
      currentPage: number = 1
    ) => {
      let processed = [...ordersToProcess];

      // Apply search filter
      if (searchTerm.trim()) {
        const normalizedSearchTerm = normalizeVietnameseText(searchTerm);
        processed = processed.filter((order) => {
          // Normalize all searchable fields
          const normalizedOrderId = normalizeVietnameseText(
            order.MaDDH?.toString() || ""
          );
          const normalizedRecipientName = normalizeVietnameseText(
            order.NguoiNhan || ""
          );
          const normalizedPhone = normalizeVietnameseText(order.SDT || "");
          const normalizedCustomerName = normalizeVietnameseText(
            order.KhachHang?.TenKH || ""
          );

          // Check if search term matches any of the normalized fields
          return (
            normalizedOrderId.includes(normalizedSearchTerm) ||
            normalizedRecipientName.includes(normalizedSearchTerm) ||
            normalizedPhone.includes(normalizedSearchTerm) ||
            normalizedCustomerName.includes(normalizedSearchTerm)
          );
        });
      }

      // Apply sorting only if sortField and sortDirection are provided
      if (sortField && sortDirection) {
        processed.sort((a, b) => {
          let aValue: any;
          let bValue: any;

          switch (sortField) {
            case "MaDDH":
              aValue = a.MaDDH || 0;
              bValue = b.MaDDH || 0;
              break;
            case "NgayTao":
              aValue = new Date(a.NgayTao);
              bValue = new Date(b.NgayTao);
              break;
            case "TongTien":
              aValue = Number(a.TongTien) || 0;
              bValue = Number(b.TongTien) || 0;
              break;
            case "NguoiNhan":
              aValue = a.NguoiNhan || "";
              bValue = b.NguoiNhan || "";
              break;
            case "SoLuong":
              aValue =
                a.CT_DonDatHangs?.reduce(
                  (total, item) => total + item.SoLuong,
                  0
                ) || 0;
              bValue =
                b.CT_DonDatHangs?.reduce(
                  (total, item) => total + item.SoLuong,
                  0
                ) || 0;
              break;
            default:
              return 0; // No sorting for unknown fields
          }

          if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
          if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
          return 0;
        });
      }

      // Store filtered result for reference (no need to set state)
      // setFilteredOrders(processed);

      // Apply pagination
      const totalItems = processed.length;
      const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
      const startIndex = (currentPage - 1) * pagination.itemsPerPage;
      const endIndex = startIndex + pagination.itemsPerPage;
      const paginatedOrders = processed.slice(startIndex, endIndex);

      setOrders(paginatedOrders);
      setPagination((prev) => ({
        ...prev,
        totalItems,
        totalPages: Math.max(totalPages, 1),
        currentPage: Math.min(currentPage, Math.max(totalPages, 1)),
      }));
    },
    [pagination.itemsPerPage]
  );

  // Fetch orders by status (simplified - no server-side processing)
  const fetchOrdersByStatus = useCallback(async (status: string) => {
    try {
      setLoading(true);

      const result = await getOrdersByStatus(status);

      if (result && result.success && result.data) {
        const fetchedOrders = result.data.orders || result.data || [];
        setAllOrders(fetchedOrders);
        // Clear current orders while loading new data
        setOrders([]);
        // Let useEffect handle the processing
      } else {
        setAllOrders([]);
        setOrders([]);
        setPagination((prev) => ({
          ...prev,
          totalItems: 0,
          totalPages: 1,
          currentPage: 1,
        }));
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Có lỗi xảy ra khi tải dữ liệu");
      setAllOrders([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []); // Remove processOrders dependency

  // Fetch statistics for all order statuses
  const fetchOrderStatistics = useCallback(async () => {
    try {
      const result = await getOrderStatistics();
      if (result && result.success && result.data) {
        setStats({
          total: result.data.total || 0,
          placed: result.data[1] || 0,
          approved: result.data[2] || 0,
          shipping: result.data[3] || 0,
          completed: result.data[4] || 0,
          cancelled: result.data[5] || 0,
          returned: result.data[7] || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching order statistics:", error);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchOrderStatistics();
  }, [fetchOrderStatistics]);

  // Fetch orders when activeTab changes
  useEffect(() => {
    fetchOrdersByStatus(activeTab);
  }, [activeTab]); // Remove fetchOrdersByStatus from dependency to avoid cycle

  // Handle tab change
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setSearchTerm("");
    setSortBy(null);
    setSortOrder(null);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    // Don't call fetchOrdersByStatus here, let useEffect handle it
  };

  // Re-process orders when pagination currentPage changes
  useEffect(() => {
    if (allOrders.length > 0) {
      // Filter orders by current active tab status
      const statusId = parseInt(activeTab);
      const filteredByStatus = allOrders.filter(
        (order) => order.MaTTDH === statusId
      );

      // Process the filtered orders
      processOrders(
        filteredByStatus,
        searchTerm,
        sortBy,
        sortOrder?.toLowerCase() as "asc" | "desc" | null,
        pagination.currentPage
      );
    }
  }, [
    pagination.currentPage,
    processOrders,
    activeTab,
    allOrders,
    searchTerm,
    sortBy,
    sortOrder,
  ]);

  // Handle search with debounce (only for searchTerm changes)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (allOrders.length > 0) {
        // Filter orders by current active tab status
        const statusId = parseInt(activeTab);
        const filteredByStatus = allOrders.filter(
          (order) => order.MaTTDH === statusId
        );

        // Process the filtered orders
        processOrders(
          filteredByStatus,
          searchTerm,
          sortBy,
          sortOrder?.toLowerCase() as "asc" | "desc" | null,
          1
        );
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]); // Only trigger on searchTerm changes

  // Handle sort changes
  useEffect(() => {
    if (allOrders.length > 0) {
      // Filter orders by current active tab status
      const statusId = parseInt(activeTab);
      const filteredByStatus = allOrders.filter(
        (order) => order.MaTTDH === statusId
      );

      // Process the filtered orders
      processOrders(
        filteredByStatus,
        searchTerm,
        sortBy,
        sortOrder?.toLowerCase() as "asc" | "desc" | null,
        1
      );
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    }
  }, [sortBy, sortOrder]); // Only trigger on sort changes

  // Handle when allOrders data changes (new data loaded)
  useEffect(() => {
    if (allOrders.length > 0) {
      // Filter orders by current active tab status
      const statusId = parseInt(activeTab);
      const filteredByStatus = allOrders.filter(
        (order) => order.MaTTDH === statusId
      );

      // Process the filtered orders
      processOrders(
        filteredByStatus,
        searchTerm,
        sortBy,
        sortOrder?.toLowerCase() as "asc" | "desc" | null,
        1
      );
    } else {
      // If no orders, clear the display
      setOrders([]);
      setPagination((prev) => ({
        ...prev,
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
      }));
    }
  }, [allOrders]); // Only trigger on allOrders changes

  // Handle search input change
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    []
  );

  // Handle sort change with 3 states: ASC -> DESC -> null (no sort)
  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      if (sortOrder === "ASC") {
        setSortOrder("DESC");
      } else if (sortOrder === "DESC") {
        setSortBy(null);
        setSortOrder(null);
      } else {
        setSortOrder("ASC");
      }
    } else {
      setSortBy(field);
      setSortOrder("ASC");
    }
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  // Render sort icon for table headers
  const renderSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }

    if (sortOrder === "ASC") {
      return <ArrowUp className="h-4 w-4 text-primary" />;
    } else if (sortOrder === "DESC") {
      return <ArrowDown className="h-4 w-4 text-primary" />;
    }

    return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, currentPage: newPage }));
  };

  // Handle order selection for approval
  const handleOrderSelection = (orderId: number, checked: boolean) => {
    setSelectedOrders((prev) => {
      const newSelection = new Set(prev);
      if (checked) {
        newSelection.add(orderId);
      } else {
        newSelection.delete(orderId);
      }
      return newSelection;
    });
  };

  // Handle select all orders
  const handleSelectAllOrders = (checked: boolean) => {
    if (checked) {
      const orderIds = orders
        .filter((order) => order.MaTTDH === 1) // Only orders with status "Đã đặt"
        .map((order) => order.MaDDH);
      setSelectedOrders(new Set(orderIds));
    } else {
      setSelectedOrders(new Set());
    }
  };

  // Open approval modal
  const handleApproveOrders = () => {
    if (selectedOrders.size === 0) {
      toast.error("Vui lòng chọn ít nhất một đơn hàng để duyệt");
      return;
    }
    setShowApprovalModal(true);
  };

  // Confirm order approval
  const confirmApproveOrders = async () => {
    try {
      setApprovingOrders(true);

      // Get user info from localStorage or context (assuming user ID is 1 for now)
      const userId = 1; // You should get this from your auth context

      const ordersToApprove = Array.from(selectedOrders).map((orderId) => ({
        id: orderId,
        maTTDH: 2, // Status "Đã duyệt"
        maNVDuyet: userId,
      }));

      console.log("Approving orders:", ordersToApprove);

      const result = await updateBatchOrderStatus({ orders: ordersToApprove });

      if (result && result.success) {
        toast.success(`Đã duyệt thành công ${result.data.success} đơn hàng`);

        if (result.data.failed > 0) {
          toast.warning(`${result.data.failed} đơn hàng duyệt thất bại`);
        }

        // Refresh data
        await fetchOrderStatistics();
        await fetchOrdersByStatus(activeTab);

        // Clear selection
        setSelectedOrders(new Set());
      } else {
        toast.error(result?.message || "Có lỗi xảy ra khi duyệt đơn hàng");
      }
    } catch (error) {
      console.error("Error approving orders:", error);
      toast.error("Không thể kết nối đến server");
    } finally {
      setApprovingOrders(false);
      setShowApprovalModal(false);
    }
  };

  // Handle cancel order
  const handleCancelOrder = (orderId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click
    setOrderToCancel(orderId);
    setShowCancelModal(true);
  };

  const confirmCancelOrder = async () => {
    if (!orderToCancel) return;

    try {
      setCancellingOrder(true);

      // Get user info from localStorage or context (assuming user ID is 1 for now)
      const userId = 1; // You should get this from your auth context

      const result = await updateOrderStatus(orderToCancel, {
        maTTDH: 5, // Status "Hủy"
        maNVDuyet: userId,
      });

      if (result && result.success) {
        toast.success("Đã hủy đơn hàng thành công");

        // Refresh data
        await fetchOrderStatistics();
        await fetchOrdersByStatus(activeTab);
      } else {
        toast.error(result?.message || "Có lỗi xảy ra khi hủy đơn hàng");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("Không thể kết nối đến server");
    } finally {
      setCancellingOrder(false);
      setShowCancelModal(false);
      setOrderToCancel(null);
    }
  };

  // Handle row click to view order detail
  const handleRowClick = (orderId: number) => {
    navigate(`/admin/orders/${orderId}`);
  };

  // Handle order approval - Show confirmation modal
  const handleApproveOrder = (orderId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click
    setOrderToApprove(orderId);
    setShowSingleApprovalModal(true);
  };

  // Confirm single order approval
  const confirmApproveOrder = async () => {
    if (!orderToApprove) return;

    try {
      setApprovingSingleOrder(true);

      // Get user info from localStorage or context (assuming user ID is 1 for now)
      const userId = 1; // You should get this from your auth context

      const result = await updateOrderStatus(orderToApprove, {
        maTTDH: 2, // Status "Đã duyệt"
        maNVDuyet: userId,
      });

      if (result && result.success) {
        toast.success("Đã duyệt đơn hàng thành công");

        // Refresh data
        await fetchOrderStatistics();
        await fetchOrdersByStatus(activeTab);
      } else {
        toast.error(result?.message || "Có lỗi xảy ra khi duyệt đơn hàng");
      }
    } catch (error) {
      console.error("Error approving order:", error);
      toast.error("Không thể kết nối đến server");
    } finally {
      setApprovingSingleOrder(false);
      setShowSingleApprovalModal(false);
      setOrderToApprove(null);
    }
  };

  // Handle delivery assignment - Show delivery staff modal
  const handleAssignDelivery = async (
    order: Order,
    event: React.MouseEvent
  ) => {
    event.stopPropagation(); // Prevent row click
    setOrderToAssign(order);
    setShowDeliveryModal(true);

    // Fetch available delivery staff
    try {
      setLoadingStaff(true);
      const result = await getAvailableDeliveryStaff(order.DiaChiGiao);

      if (result && result.success) {
        setDeliveryStaff(result.data || []);
        console.log("Delivery staff data:", result.data);
        console.log("API response:", result);
        // Pre-select current delivery staff if exists
        if (order.MaNV_Giao) {
          setSelectedStaff(order.MaNV_Giao);
        }
      } else {
        toast.error(
          result?.message || "Không thể tải danh sách nhân viên giao hàng"
        );
        setDeliveryStaff([]);
      }
    } catch (error) {
      console.error("Error fetching delivery staff:", error);
      toast.error("Không thể kết nối đến server");
      setDeliveryStaff([]);
    } finally {
      setLoadingStaff(false);
    }
  };

  // Confirm delivery assignment
  const confirmAssignDelivery = async () => {
    if (!orderToAssign || !selectedStaff) return;

    try {
      setAssigningOrder(true);

      const result = await updateOrderDeliveryStaff(orderToAssign.MaDDH, {
        maNVGiao: selectedStaff,
      });

      if (result && result.success) {
        const message = orderToAssign.MaNV_Giao
          ? "Đã thay đổi nhân viên giao hàng thành công"
          : "Đã phân công nhân viên giao hàng thành công";
        toast.success(message);

        // Refresh data
        await fetchOrderStatistics();
        await fetchOrdersByStatus(activeTab);

        // Close modal and reset states
        setShowDeliveryModal(false);
        setOrderToAssign(null);
        setSelectedStaff(null);
        setDeliveryStaff([]);
      } else {
        toast.error(result?.message || "Có lỗi xảy ra khi phân công nhân viên");
      }
    } catch (error) {
      console.error("Error assigning delivery staff:", error);
      toast.error("Không thể kết nối đến server");
    } finally {
      setAssigningOrder(false);
    }
  };

  // Handle complete orders - Show confirmation modal
  const handleCompleteOrders = () => {
    if (selectedOrders.size === 0) {
      toast.error("Vui lòng chọn ít nhất một đơn hàng để hoàn tất");
      return;
    }
    setShowCompleteModal(true);
  };

  // Confirm complete orders
  const confirmCompleteOrders = async () => {
    try {
      setCompletingOrders(true);

      // Get user info from localStorage or context (assuming user ID is 1 for now)
      const userId = 1; // You should get this from your auth context

      const ordersToComplete = Array.from(selectedOrders).map((orderId) => ({
        id: orderId,
        maTTDH: 4, // Status "Hoàn tất"
        maNVDuyet: userId,
      }));

      console.log("Completing orders:", ordersToComplete);

      const result = await updateBatchOrderCompletion(ordersToComplete);

      if (result && result.success) {
        toast.success(`Đã hoàn tất thành công ${result.data.success} đơn hàng`);

        if (result.data.failed > 0) {
          toast.warning(`${result.data.failed} đơn hàng hoàn tất thất bại`);
        }

        await fetchOrderStatistics();
        await fetchOrdersByStatus(activeTab);

        // Clear selection
        setSelectedOrders(new Set());
      } else {
        toast.error(result?.message || "Có lỗi xảy ra khi hoàn tất đơn hàng");
      }
    } catch (error) {
      console.error("Error completing orders:", error);
      toast.error("Không thể kết nối đến server");
    } finally {
      setCompletingOrders(false);
      setShowCompleteModal(false);
    }
  };

  // Handle complete single order
  const handleCompleteOrder = (orderId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click
    setOrderToComplete(orderId);
    setShowSingleCompleteModal(true);
  };

  // Confirm single order completion
  const confirmCompleteOrder = async () => {
    if (!orderToComplete) return;

    try {
      setCompletingSingleOrder(true);
      const userId = 1;

      const result = await updateOrderCompletion(orderToComplete, {
        maTTDH: 4,
        maNVDuyet: userId,
      });

      if (result && result.success) {
        toast.success("Đã hoàn tất đơn hàng thành công");

        // Refresh data
        await fetchOrderStatistics();
        await fetchOrdersByStatus(activeTab);
      } else {
        toast.error(result?.message || "Có lỗi xảy ra khi hoàn tất đơn hàng");
      }
    } catch (error) {
      console.error("Error completing order:", error);
      toast.error("Không thể kết nối đến server");
    } finally {
      setCompletingSingleOrder(false);
      setShowSingleCompleteModal(false);
      setOrderToComplete(null);
    }
  };

  useEffect(() => {
    setSelectedOrders(new Set());
  }, [activeTab]);

  const handleCreateInvoice = (order: Order, event: React.MouseEvent) => {
    event.stopPropagation();
    setOrderToCreateInvoice(order);
    setShowInvoiceModal(true);
  };

  const confirmCreateInvoice = async () => {
    if (!orderToCreateInvoice) return;

    try {
      setCreatingInvoice(true);
      const userId = 1;

      const invoiceData = {
        maDDH: orderToCreateInvoice.MaDDH,
        maNVLap: userId,
      };

      console.log("Creating invoice with data:", invoiceData);

      const result = await createInvoice(invoiceData);

      console.log("Invoice creation result:", result);

      if (result && result.success) {
        toast.success("Đã tạo hóa đơn thành công");

        // Refresh data to get updated order with invoice information
        await fetchOrderStatistics();
        await fetchOrdersByStatus(activeTab);
      } else {
        console.error("Invoice creation failed:", result);
        toast.error(result?.message || "Có lỗi xảy ra khi tạo hóa đơn");
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Không thể kết nối đến server");
    } finally {
      setCreatingInvoice(false);
      setShowInvoiceModal(false);
      setOrderToCreateInvoice(null);
    }
  };

  // Handle view invoice detail
  const handleViewInvoice = (
    invoiceNumber: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    setInvoiceNumber(invoiceNumber);
    setShowInvoiceView(true);
  };

  const getStatusBadge = (statusId: number) => {
    const status =
      ORDER_STATUSES[statusId.toString() as keyof typeof ORDER_STATUSES];
    if (!status) return <Badge variant="secondary">Không xác định</Badge>;

    switch (statusId) {
      case 1:
        return <Badge variant="secondary">{status.label}</Badge>;
      case 2:
        return <Badge variant="default">{status.label}</Badge>;
      case 3:
        return (
          <Badge variant="default" className="bg-blue-600">
            {status.label}
          </Badge>
        );
      case 4:
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            {status.label}
          </Badge>
        );
      case 5:
        return <Badge variant="destructive">{status.label}</Badge>;
      case 7:
        return (
          <Badge
            variant="secondary"
            className="text-orange-600 border-orange-600 bg-orange-50"
          >
            {status.label}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status.label}</Badge>;
    }
  };

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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate total items in order
  const getTotalItems = (order: Order) => {
    return (
      order.CT_DonDatHangs?.reduce((total, item) => total + item.SoLuong, 0) ||
      0
    );
  };

  const statisticsCards = [
    {
      title: "Tổng đơn hàng",
      value: stats.total,
      icon: Package,
      color: "text-blue-600",
    },
    {
      title: "Đã đặt",
      value: stats.placed,
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      title: "Đã duyệt",
      value: stats.approved,
      icon: CheckCircle,
      color: "text-blue-600",
    },
    {
      title: "Đang giao",
      value: stats.shipping,
      icon: Package,
      color: "text-purple-600",
    },
    {
      title: "Hoàn tất",
      value: stats.completed,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Hủy",
      value: stats.cancelled,
      icon: XCircle,
      color: "text-red-600",
    },
    {
      title: "Trả hàng",
      value: stats.returned,
      icon: Undo2,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader title="Quản lý đơn hàng" />

      <main className="py-6">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-6">
            {statisticsCards.map((stat, index) => (
              <Card key={index} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        {stat.title}
                      </p>
                      <p className="text-xl font-bold">{stat.value}</p>
                    </div>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Orders Management */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Danh sách đơn hàng</CardTitle>
              <CardDescription>
                Quản lý tất cả đơn hàng trong hệ thống theo trạng thái
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Order Status Tabs */}
              <Tabs
                value={activeTab}
                onValueChange={handleTabChange}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-6 mb-6">
                  <TabsTrigger value="1" className="text-xs">
                    Đã đặt ({stats.placed})
                  </TabsTrigger>
                  <TabsTrigger value="2" className="text-xs">
                    Đã duyệt ({stats.approved})
                  </TabsTrigger>
                  <TabsTrigger value="3" className="text-xs">
                    Đang giao ({stats.shipping})
                  </TabsTrigger>
                  <TabsTrigger value="4" className="text-xs">
                    Hoàn tất ({stats.completed})
                  </TabsTrigger>
                  <TabsTrigger value="5" className="text-xs">
                    Hủy ({stats.cancelled})
                  </TabsTrigger>
                  <TabsTrigger value="7" className="text-xs">
                    Trả hàng ({stats.returned})
                  </TabsTrigger>
                </TabsList>

                {/* Search Controls */}
                <div className="flex justify-start mb-6">
                  <SearchInput
                    value={searchTerm}
                    onChange={handleSearchChange}
                    disabled={loading}
                    placeholder="Tìm kiếm theo tên, mã đơn hàng, số điện thoại"
                  />
                </div>

                {/* Tab Contents */}
                {Object.keys(ORDER_STATUSES).map((statusId) => (
                  <TabsContent key={statusId} value={statusId}>
                    {loading ? (
                      <div className="flex justify-center items-center py-12">
                        <div className="text-sm text-muted-foreground">
                          Đang tải dữ liệu...
                        </div>
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="flex justify-center items-center py-12">
                        <div className="text-sm text-muted-foreground">
                          Không có đơn hàng nào trong trạng thái này
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Approval Actions - Only show for "Đã đặt" tab */}
                        {activeTab === "1" && (
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={
                                  selectedOrders.size > 0 &&
                                  selectedOrders.size ===
                                    orders.filter((order) => order.MaTTDH === 1)
                                      .length
                                }
                                onCheckedChange={handleSelectAllOrders}
                                disabled={loading}
                              />
                              <span className="text-sm text-muted-foreground">
                                Chọn tất cả (
                                {
                                  orders.filter((order) => order.MaTTDH === 1)
                                    .length
                                }{" "}
                                đơn hàng)
                              </span>
                            </div>
                            <Button
                              onClick={handleApproveOrders}
                              disabled={
                                selectedOrders.size === 0 || approvingOrders
                              }
                              className="bg-[#825B32] hover:bg-[#825B32]/90 text-white"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Duyệt đơn hàng ({selectedOrders.size})
                            </Button>
                          </div>
                        )}

                        {/* Complete Actions - Only show for "Đang giao" tab */}
                        {activeTab === "3" && (
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={
                                  selectedOrders.size > 0 &&
                                  selectedOrders.size ===
                                    orders.filter((order) => order.MaTTDH === 3)
                                      .length
                                }
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    const orderIds = orders
                                      .filter((order) => order.MaTTDH === 3) // Only orders with status "Đang giao"
                                      .map((order) => order.MaDDH);
                                    setSelectedOrders(new Set(orderIds));
                                  } else {
                                    setSelectedOrders(new Set());
                                  }
                                }}
                                disabled={loading}
                              />
                              <span className="text-sm text-muted-foreground">
                                Chọn tất cả (
                                {
                                  orders.filter((order) => order.MaTTDH === 3)
                                    .length
                                }{" "}
                                đơn hàng)
                              </span>
                            </div>
                            <Button
                              onClick={handleCompleteOrders}
                              disabled={
                                selectedOrders.size === 0 || completingOrders
                              }
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Hoàn tất đơn hàng ({selectedOrders.size})
                            </Button>
                          </div>
                        )}

                        {/* Orders Table */}
                        <div className="rounded-md border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                {(activeTab === "1" || activeTab === "3") && (
                                  <TableHead className="w-12">
                                    {/* <Checkbox
                                      checked={selectedOrders.size > 0 && selectedOrders.size === orders.filter(order => order.MaTTDH === 1).length}
                                      onCheckedChange={handleSelectAllOrders}
                                      disabled={loading}
                                    /> */}
                                  </TableHead>
                                )}
                                <TableHead
                                  className="text-xs font-semibold cursor-pointer hover:bg-muted/50 select-none"
                                  onClick={() => handleSortChange("MaDDH")}
                                >
                                  <div className="flex items-center gap-1">
                                    Mã đơn hàng
                                    {renderSortIcon("MaDDH")}
                                  </div>
                                </TableHead>
                                <TableHead
                                  className="text-xs font-semibold cursor-pointer hover:bg-muted/50 select-none"
                                  onClick={() => handleSortChange("KhachHang")}
                                >
                                  <div className="flex items-center gap-1">
                                    Người nhận
                                    {renderSortIcon("KhachHang")}
                                  </div>
                                </TableHead>
                                <TableHead
                                  className="text-xs font-semibold cursor-pointer hover:bg-muted/50 select-none"
                                  onClick={() => handleSortChange("SoLuong")}
                                >
                                  <div className="flex items-center gap-1">
                                    Số lượng
                                    {renderSortIcon("SoLuong")}
                                  </div>
                                </TableHead>
                                <TableHead
                                  className="text-xs font-semibold cursor-pointer hover:bg-muted/50 select-none"
                                  onClick={() => handleSortChange("TongTien")}
                                >
                                  <div className="flex items-center gap-1">
                                    Tổng tiền
                                    {renderSortIcon("TongTien")}
                                  </div>
                                </TableHead>
                                <TableHead className="text-xs font-semibold">
                                  Trạng thái
                                </TableHead>
                                <TableHead
                                  className="text-xs font-semibold cursor-pointer hover:bg-muted/50 select-none"
                                  onClick={() => handleSortChange("NgayTao")}
                                >
                                  <div className="flex items-center gap-1">
                                    Ngày tạo
                                    {renderSortIcon("NgayTao")}
                                  </div>
                                </TableHead>
                                <TableHead className="text-xs font-semibold text-center">
                                  Thao tác
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {orders.map((order) => (
                                <TableRow
                                  key={order.MaDDH}
                                  className="hover:bg-muted/30 cursor-pointer"
                                  onClick={() => handleRowClick(order.MaDDH)}
                                >
                                  {(activeTab === "1" || activeTab === "3") && (
                                    <TableCell
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Checkbox
                                        checked={selectedOrders.has(
                                          order.MaDDH
                                        )}
                                        onCheckedChange={(checked) =>
                                          handleOrderSelection(
                                            order.MaDDH,
                                            checked as boolean
                                          )
                                        }
                                        disabled={
                                          (activeTab === "1" &&
                                            order.MaTTDH !== 1) ||
                                          (activeTab === "3" &&
                                            order.MaTTDH !== 3)
                                        } // Only allow selection for correct status
                                      />
                                    </TableCell>
                                  )}
                                  <TableCell className="font-medium text-sm">
                                    #{order.MaDDH.toString()}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    <div>
                                      <div className="font-medium">
                                        {order.NguoiNhan}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {order.SDT}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {getTotalItems(order)}
                                  </TableCell>
                                  <TableCell className="font-medium text-sm">
                                    {formatPrice(order.TongTien)}
                                  </TableCell>
                                  <TableCell>
                                    {getStatusBadge(order.TrangThaiDH.MaTTDH)}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {formatDate(order.NgayTao)}
                                  </TableCell>
                                  <TableCell
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="flex items-center justify-center gap-2">
                                      {order.MaTTDH === 1 && ( // Chỉ hiển thị cho đơn hàng "Đã đặt"
                                        <>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 px-2 text-xs text-green-600 border-green-600 hover:bg-green-50"
                                            title="Duyệt đơn hàng"
                                            onClick={(e) =>
                                              handleApproveOrder(order.MaDDH, e)
                                            }
                                          >
                                            <Check className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 px-2 text-xs text-red-600 border-red-600 hover:bg-red-50"
                                            title="Hủy đơn hàng"
                                            onClick={(e) =>
                                              handleCancelOrder(order.MaDDH, e)
                                            }
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </>
                                      )}
                                      {order.MaTTDH === 2 && ( // Đơn hàng "Đã duyệt"
                                        <>
                                          {!order.HoaDon ? (
                                            // Nếu chưa có hóa đơn, hiển thị nút tạo hóa đơn
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="h-8 px-3 text-xs text-blue-600 border-blue-600 hover:bg-blue-50"
                                              title="Tạo hóa đơn"
                                              onClick={(e) =>
                                                handleCreateInvoice(order, e)
                                              }
                                            >
                                              <FileText className="h-3 w-3 mr-1" />
                                              Tạo hóa đơn
                                            </Button>
                                          ) : (
                                            <>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 px-3 text-xs text-blue-600 border-blue-600 hover:bg-blue-50"
                                                title="Xem chi tiết hóa đơn"
                                                onClick={(e) =>
                                                  order.HoaDon?.SoHD &&
                                                  handleViewInvoice(
                                                    order.HoaDon.SoHD,
                                                    e
                                                  )
                                                }
                                              >
                                                <Eye className="h-3 w-3 mr-1" />
                                                Xem hóa đơn
                                              </Button>
                                              {!order.MaNV_Giao && (
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  className="h-8 px-3 text-xs text-[#825B32] border-[#825B32] hover:bg-[#825B32]/10"
                                                  title="Phân công nhân viên giao hàng"
                                                  onClick={(e) =>
                                                    handleAssignDelivery(
                                                      order,
                                                      e
                                                    )
                                                  }
                                                >
                                                  <Users className="h-3 w-3 mr-1" />
                                                  Phân công
                                                </Button>
                                              )}
                                            </>
                                          )}
                                        </>
                                      )}
                                      {order.MaTTDH === 3 && ( // Chỉ hiển thị cho đơn hàng "Đang giao"
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-8 px-3 text-xs text-green-600 border-green-600 hover:bg-green-50"
                                          title="Hoàn tất đơn hàng"
                                          onClick={(e) =>
                                            handleCompleteOrder(order.MaDDH, e)
                                          }
                                        >
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          Hoàn tất
                                        </Button>
                                      )}
                                      {![1, 2, 3].includes(order.MaTTDH) && ( // Cho các trạng thái khác
                                        <span className="text-muted-foreground text-xs">
                                          -
                                        </span>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                          <div className="flex items-center justify-between mt-6">
                            <div className="text-sm text-muted-foreground">
                              Hiển thị{" "}
                              {(pagination.currentPage - 1) *
                                pagination.itemsPerPage +
                                1}{" "}
                              -{" "}
                              {Math.min(
                                pagination.currentPage *
                                  pagination.itemsPerPage,
                                pagination.totalItems
                              )}{" "}
                              của {pagination.totalItems} đơn hàng
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handlePageChange(pagination.currentPage - 1)
                                }
                                disabled={pagination.currentPage === 1}
                              >
                                <ChevronLeft className="h-4 w-4" />
                                Trước
                              </Button>
                              <div className="flex items-center gap-1">
                                {Array.from(
                                  {
                                    length: Math.min(5, pagination.totalPages),
                                  },
                                  (_, i) => {
                                    const pageNumber =
                                      pagination.currentPage <= 3
                                        ? i + 1
                                        : pagination.currentPage + i - 2;

                                    if (pageNumber > pagination.totalPages)
                                      return null;

                                    return (
                                      <Button
                                        key={pageNumber}
                                        variant={
                                          pageNumber === pagination.currentPage
                                            ? "default"
                                            : "outline"
                                        }
                                        size="sm"
                                        onClick={() =>
                                          handlePageChange(pageNumber)
                                        }
                                        className="w-8 h-8 p-0"
                                      >
                                        {pageNumber}
                                      </Button>
                                    );
                                  }
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handlePageChange(pagination.currentPage + 1)
                                }
                                disabled={
                                  pagination.currentPage ===
                                  pagination.totalPages
                                }
                              >
                                Sau
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Batch Approval Modal */}
      <BatchApprovalModal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        selectedOrdersCount={selectedOrders.size}
        isApproving={approvingOrders}
        onConfirm={confirmApproveOrders}
      />

      {/* Cancel Order Modal */}
      <CancelOrderModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        orderId={orderToCancel}
        isCancelling={cancellingOrder}
        onConfirm={confirmCancelOrder}
      />

      {/* Single Order Approval Modal */}
      <SingleOrderApprovalModal
        isOpen={showSingleApprovalModal}
        onClose={() => setShowSingleApprovalModal(false)}
        orderId={orderToApprove}
        isApproving={approvingSingleOrder}
        onConfirm={confirmApproveOrder}
      />

      {/* Delivery Assignment Modal */}
      <DeliveryAssignmentModal
        isOpen={showDeliveryModal}
        onClose={() => {
          setShowDeliveryModal(false);
          setOrderToAssign(null);
          setSelectedStaff(null);
          setDeliveryStaff([]);
        }}
        order={orderToAssign}
        deliveryStaff={deliveryStaff}
        selectedStaff={selectedStaff}
        isLoadingStaff={loadingStaff}
        isAssigning={assigningOrder}
        onStaffSelect={setSelectedStaff}
        onConfirm={confirmAssignDelivery}
        formatPrice={formatPrice}
      />

      {/* Complete Orders Modal */}
      <BatchCompleteOrdersModal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        selectedOrdersCount={selectedOrders.size}
        isCompleting={completingOrders}
        onConfirm={confirmCompleteOrders}
      />

      {/* Single Order Complete Modal */}
      <SingleOrderCompleteModal
        isOpen={showSingleCompleteModal}
        onClose={() => setShowSingleCompleteModal(false)}
        orderId={orderToComplete}
        isCompleting={completingSingleOrder}
        onConfirm={confirmCompleteOrder}
      />

      {/* Invoice Creation Modal */}
      <InvoiceCreationModal
        isOpen={showInvoiceModal}
        onClose={() => {
          setShowInvoiceModal(false);
          setOrderToCreateInvoice(null);
        }}
        order={orderToCreateInvoice}
        isCreating={creatingInvoice}
        onConfirm={confirmCreateInvoice}
        formatPrice={formatPrice}
        getTotalItems={getTotalItems}
      />

      {/* Invoice View Dialog */}
      <InvoiceView
        isOpen={showInvoiceView}
        onClose={() => {
          setShowInvoiceView(false);
          setInvoiceNumber(null);
        }}
        invoiceNumber={invoiceNumber}
      />
    </div>
  );
}
