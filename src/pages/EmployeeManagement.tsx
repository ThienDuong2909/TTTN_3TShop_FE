import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Edit2,
  ArrowRight,
  History,
  Shield,
  Users,
  CheckCircle,
  MapPin,
} from "lucide-react";
import { DataTable, Column } from "../components/ui/DataTable";
import { toast, Toaster } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  getDepartments,
  getEmployees,
  createEmployee,
  updateEmployee,
  transferEmployee as transferEmployeeAPI,
  getEmployeeWorkHistory,
  getAreas,
} from "../services/api";
import { usePermission } from "../components/PermissionGuard";
import { ROLES, PERMISSIONS } from "../utils/permissions";
import { Modal } from "@/components/ui/Modal";
import { ChangeDeliveryArea } from "../components/employee/change-delivery-area";

// Interface matching SQL structure
interface Employee {
  maNV: number;
  tenNV: string;
  ngaySinh?: string;
  diaChi?: string;
  luong?: number;
  maTK?: number;
  // Additional fields for UI
  department?: string;
  departmentName?: string;
  username?: string;
  isActive: string; // Changed from boolean to string to match API
  createdAt: string;
  updatedAt?: string;
  currentRole?: string;
  khuVucPhuTrach?: Array<{
    MaKhuVuc: string;
    TenKhuVuc: string;
    NhanVien_KhuVuc: {
      NgayTao: string;
      TrangThai: number;
    };
  }>;
}

export const EmployeeManagement = () => {
  const { hasPermission } = usePermission();
  const canCreate = hasPermission("nhanvien.tao") || hasPermission("toanquyen");
  const canEdit = hasPermission("nhanvien.sua") || hasPermission("toanquyen");
  const canAssign =
    hasPermission("nhanvien.phancong") || hasPermission("toanquyen");

  const [departments, setDepartments] = useState<
    { id: string; name: string }[]
  >([]);
  const [areas, setAreas] = useState<{ MaKhuVuc: string; TenKhuVuc: string }[]>(
    []
  );

  // Helper functions for handling multi-select areas
  const handleAreaToggle = (areaCode: string, isTransfer = false) => {
    if (isTransfer) {
      const currentAreas = transferData.selectedAreas;
      const newAreas = currentAreas.includes(areaCode)
        ? currentAreas.filter((code) => code !== areaCode)
        : [...currentAreas, areaCode];
      setTransferData({ ...transferData, selectedAreas: newAreas });
    } else {
      const currentAreas = formData.selectedAreas;
      const newAreas = currentAreas.includes(areaCode)
        ? currentAreas.filter((code) => code !== areaCode)
        : [...currentAreas, areaCode];
      setFormData({ ...formData, selectedAreas: newAreas });
    }
  };

  const isAreaSelected = (areaCode: string, isTransfer = false) => {
    return isTransfer
      ? transferData.selectedAreas.includes(areaCode)
      : formData.selectedAreas.includes(areaCode);
  };

  // Helper functions for currency formatting
  const formatCurrency = (value: number): string => {
    if (!value || value === 0) return "";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const unformatCurrency = (value: string): number => {
    if (!value) return 0;
    // Remove all non-digit characters
    const numberString = value.replace(/\D/g, "");
    return parseInt(numberString) || 0;
  };

  const handleSalaryChange = (value: string) => {
    // Allow only numbers and common currency characters
    const cleanValue = value.replace(/[^\d.,₫]/g, "");
    const numericValue = unformatCurrency(cleanValue);
    setFormData({ ...formData, luong: numericValue });
  };

  // Helper functions for work history
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const calculateWorkDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Đảm bảo endDate >= startDate
    if (end < start) {
      return "0 ngày";
    }

    // Tính số năm, tháng chính xác
    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();

    // Điều chỉnh nếu tháng âm
    if (months < 0) {
      years--;
      months += 12;
    }

    // Điều chỉnh nếu ngày trong tháng chưa đủ
    if (end.getDate() < start.getDate()) {
      months--;
      if (months < 0) {
        years--;
        months += 12;
      }
    }

    // Format kết quả theo định dạng: X năm Y tháng
    const parts = [];
    if (years > 0) {
      parts.push(`${years} năm`);
    }
    if (months > 0) {
      parts.push(`${months} tháng`);
    }

    // Nếu chưa đủ 1 tháng thì hiển thị "Dưới 1 tháng"
    if (years === 0 && months === 0) {
      return "Dưới 1 tháng";
    }

    return parts.join(" ");
  };

  // Hàm tính tổng thời gian làm việc từ tất cả lịch sử
  const calculateTotalWorkDuration = (workHistoryList: any[]) => {
    if (!workHistoryList || workHistoryList.length === 0) {
      return "Dưới 1 tháng";
    }

    let totalYears = 0;
    let totalMonths = 0;

    workHistoryList.forEach((history: any) => {
      const startDate = new Date(history.NgayBatDau);
      const endDate = history.NgayKetThuc
        ? new Date(history.NgayKetThuc)
        : new Date(); // Nếu chưa kết thúc thì tính đến hiện tại

      // Đảm bảo endDate >= startDate
      if (endDate >= startDate) {
        // Tính số năm, tháng cho từng khoảng thời gian
        let years = endDate.getFullYear() - startDate.getFullYear();
        let months = endDate.getMonth() - startDate.getMonth();

        // Điều chỉnh nếu tháng âm
        if (months < 0) {
          years--;
          months += 12;
        }

        // Điều chỉnh nếu ngày trong tháng chưa đủ
        if (endDate.getDate() < startDate.getDate()) {
          months--;
          if (months < 0) {
            years--;
            months += 12;
          }
        }

        // Cộng dồn vào tổng
        totalYears += years;
        totalMonths += months;
      }
    });

    // Điều chỉnh tháng dư thành năm
    if (totalMonths >= 12) {
      totalYears += Math.floor(totalMonths / 12);
      totalMonths = totalMonths % 12;
    }

    // Format kết quả
    const parts = [];
    if (totalYears > 0) {
      parts.push(`${totalYears} năm`);
    }
    if (totalMonths > 0) {
      parts.push(`${totalMonths} tháng`);
    }

    return parts.length > 0 ? parts.join(" ") : "Dưới 1 tháng";
  };

  // Fetch work history for specific employee
  const fetchWorkHistory = async (maNV: number) => {
    try {
      const workHistoryData = await getEmployeeWorkHistory(maNV);
      setWorkHistory(workHistoryData);
    } catch (error) {
      console.error("Error fetching work history:", error);
      setWorkHistory([]);
      toast.error("Lỗi khi tải lịch sử làm việc");
    }
  };

  // Handle view history
  const handleViewHistory = async (employee: Employee) => {
    // Nếu muốn hạn chế quyền xem lịch sử, có thể thêm check tại đây
    setSelectedEmployeeHistory(employee);
    await fetchWorkHistory(employee.maNV);
    setIsHistoryModalOpen(true);
  };

  // Fetch vai trò hiện tại của nhân viên
  const fetchEmployeeRole = async (maNV: number): Promise<string | null> => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/employees/${maNV}/role`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      console.log(`📡 Response status: ${response.status}`);
      console.log(`📡 Response headers:`, response.headers);

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Response data:`, result);

        if (result.success && result.data) {
          const roleId = result.data.roleId || result.data.role;
          console.log(`🎯 Extracted roleId: ${roleId}`);
          return roleId;
        } else {
          console.log(`❌ Response not successful or missing data:`, result);
        }
      } else {
        console.log(`❌ Response not OK. Status: ${response.status}`);
        try {
          const errorText = await response.text();
          console.log(`❌ Error response body:`, errorText);
        } catch (e) {
          console.log(`❌ Could not read error response body`);
        }
      }
      return null;
    } catch (error) {
      console.error("❌ Error fetching employee role:", error);
      return null;
    }
  };

  // Hàm helper để chuyển đổi roleId thành roleKey cho UI
  const getRoleKeyFromId = (roleId: string | number): string | null => {
    const numericId = typeof roleId === "string" ? parseInt(roleId) : roleId;
    console.log(
      `🔍 Converting roleId ${roleId} (numeric: ${numericId}) to roleKey`
    );

    // Tìm role có id trùng khớp
    const roleEntry = Object.entries(ROLES).find(
      ([key, role]) => role.id === numericId
    );

    if (roleEntry) {
      const [roleKey] = roleEntry;
      console.log(`✅ Found roleKey: ${roleKey} for roleId: ${roleId}`);
      return roleKey;
    } else {
      console.log(`❌ No roleKey found for roleId: ${roleId}`);
      return null;
    }
  };

  // Permissions: open modal and load data
  const handleOpenPermissions = async (employee: Employee) => {
    console.log(`🚀 Opening permissions for employee:`, employee);
    setPermissionEmployee(employee);
    setIsPermissionModalOpen(true);

    // Fetch và tự động select vai trò hiện tại của nhân viên
    console.log(`🔍 About to fetch role for employee maNV: ${employee.maNV}`);
    const currentRole = await fetchEmployeeRole(employee.maNV);
    console.log(`🎯 Received currentRole: ${currentRole}`);

    // Chuyển đổi roleId thành roleKey để UI có thể select đúng
    if (currentRole) {
      const roleKey = getRoleKeyFromId(currentRole);
      console.log(`🔑 Converted roleId ${currentRole} to roleKey: ${roleKey}`);
      setSelectedRole(roleKey);
      console.log(`✅ selectedRole state set to: ${roleKey}`);
    } else {
      setSelectedRole(null);
      console.log(`❌ No role found, selectedRole set to null`);
    }
  };

  const handleSavePermissions = async () => {
    if (!permissionEmployee || !selectedRole) return;

    try {
      // Lấy roleId từ selectedRole (roleKey) để gửi lên API
      const roleId = ROLES[selectedRole as keyof typeof ROLES]?.id;
      console.log(
        `🔍 Sending roleId ${roleId} (from roleKey: ${selectedRole}) to API`
      );

      if (!roleId) {
        toast.error("Không tìm thấy thông tin vai trò");
        return;
      }

      // Gán vai trò cho nhân viên thông qua API
      const response = await fetch(
        `http://localhost:8080/api/employees/${permissionEmployee.maNV}/role`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            roleId: roleId,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success(
            `Gán vai trò "${
              ROLES[selectedRole as keyof typeof ROLES]?.displayName
            }" cho nhân viên thành công`
          );
          setIsPermissionModalOpen(false);
          setSelectedRole(null);
        } else {
          toast.error(result.message || "Gán vai trò thất bại");
        }
      } else {
        toast.error("Có lỗi khi gán vai trò");
      }
    } catch (err) {
      console.error("Assign role error:", err);
      toast.error("Có lỗi khi gán vai trò");
    }
  };

  // Handle open change delivery area modal
  const handleOpenChangeArea = (employee: Employee) => {
    if (employee.department !== "11") {
      toast.error("Chức năng này chỉ dành cho nhân viên bộ phận giao hàng");
      return;
    }
    setAreaEmployee(employee);
    setIsChangeAreaModalOpen(true);
  };

  // Fetch departments with TrangThai === true
  React.useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const departmentsData = await getDepartments();
        const filtered = departmentsData.data
          .filter((item: any) => item.TrangThai === true)
          .map((item: any) => ({
            id: item.MaBoPhan?.toString(),
            name: item.TenBoPhan || "",
          }));
        setDepartments(filtered);
      } catch (error) {
        setDepartments([]);
      }
    };
    fetchDepartments();
  }, []);

  // Fetch areas
  React.useEffect(() => {
    const fetchAreas = async () => {
      try {
        const areasData = await getAreas();
        setAreas(Array.isArray(areasData) ? areasData : []);
      } catch (error) {
        console.error("Error fetching areas:", error);
        setAreas([]);
      }
    };
    fetchAreas();
  }, []);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Fetch employees from API
  const refreshEmployees = async () => {
    try {
      const employeesData = await getEmployees();
      console.log(`🔍 Fetched employees:`, employeesData);
      setEmployees(Array.isArray(employeesData) ? employeesData : []);
    } catch (error) {
      console.error("💥 Fetch Error:", error);
      setEmployees([]);
      toast.error("Lỗi khi tải danh sách nhân viên");
    }
  };
  React.useEffect(() => {
    refreshEmployees();
  }, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isChangeAreaModalOpen, setIsChangeAreaModalOpen] = useState(false);
  const [openFromDetail, setOpenFromDetail] = useState(false); // Track if modal opened from detail
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [transferEmployee, setTransferEmployee] = useState<Employee | null>(
    null
  );
  const [selectedEmployeeHistory, setSelectedEmployeeHistory] =
    useState<Employee | null>(null);
  const [permissionEmployee, setPermissionEmployee] = useState<Employee | null>(
    null
  );
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [areaEmployee, setAreaEmployee] = useState<Employee | null>(null);

  // Debug logging for selectedRole
  React.useEffect(() => {
    console.log(`🔍 Debug - selectedRole changed to: ${selectedRole}`);
    if (selectedRole) {
      console.log(`🔍 Debug - ROLES object:`, ROLES);
      console.log(
        `🔍 Debug - ROLES[selectedRole]:`,
        ROLES[selectedRole as keyof typeof ROLES]
      );
      console.log(
        `🔍 Debug - Role ID: ${ROLES[selectedRole as keyof typeof ROLES]?.id}`
      );
      console.log(
        `🔍 Debug - Role Display Name: ${
          ROLES[selectedRole as keyof typeof ROLES]?.displayName
        }`
      );
    }
  }, [selectedRole]);

  const [workHistory, setWorkHistory] = useState<any[]>([]);
  const [transferData, setTransferData] = useState({
    newDepartment: "",
    transferDate: new Date().toISOString().slice(0, 10),
    position: "Nhân viên",
    notes: "",
    selectedAreas: [] as string[], // Changed from district to selectedAreas array
    areaStartDate: "", // Ngày bắt đầu phụ trách giao hàng (khi chuyển sang bộ phận giao hàng)
  });
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    tenNV: "",
    ngaySinh: "",
    diaChi: "",
    luong: 0,
    department: "",
    chucVu: "Nhân viên",
    ghiChu: "",
    username: "",
    password: "3TShop@2025",
    isActive: "DANGLAMVIEC",
    selectedAreas: [] as string[], // Changed from district to selectedAreas array
    areaStartDate: "",
  });

  // Handle view employee detail
  const handleViewDetail = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDetailModalOpen(true);
  };

  // Handle edit from detail dialog
  const handleEditFromDetail = () => {
    if (selectedEmployee) {
      setEditingEmployee(selectedEmployee);
      // const activeAreas = selectedEmployee.khuVucPhuTrach || []; // Commented out - using dedicated modal
      setFormData({
        tenNV: selectedEmployee.tenNV || "",
        ngaySinh: selectedEmployee.ngaySinh || "",
        diaChi: selectedEmployee.diaChi || "",
        luong: selectedEmployee.luong || 0,
        department: selectedEmployee.department || "",
        chucVu: "Nhân viên",
        ghiChu: "",
        username: selectedEmployee.username || "",
        password: "",
        isActive: selectedEmployee.isActive || "DANGLAMVIEC",
        // selectedAreas: activeAreas.map((kv: any) => kv.MaKhuVuc?.toString()), // Commented out - using dedicated modal
        selectedAreas: [], // Keep empty since we use dedicated modal for area management
        areaStartDate: "",
      });
      setIsDetailModalOpen(false);
      setOpenFromDetail(true);
      setIsModalOpen(true);
    }
  };

  // Handle transfer from detail dialog
  const handleTransferFromDetail = () => {
    if (selectedEmployee) {
      setTransferEmployee(selectedEmployee);
      setTransferData({
        newDepartment: "",
        transferDate: new Date().toISOString().slice(0, 10),
        position: "Nhân viên",
        notes: "",
        selectedAreas: [],
        areaStartDate: "",
      });
      setIsDetailModalOpen(false);
      setOpenFromDetail(true);
      setIsTransferModalOpen(true);
    }
  };

  // Handle view history from detail dialog
  const handleViewHistoryFromDetail = async () => {
    if (selectedEmployee) {
      setSelectedEmployeeHistory(selectedEmployee);
      await fetchWorkHistory(selectedEmployee.maNV);
      setIsDetailModalOpen(false);
      setIsHistoryModalOpen(true);
    }
  };

  const handleAdd = () => {
    if (!canCreate) {
      toast.error("Bạn không có quyền thêm nhân viên");
      return;
    }
    setEditingEmployee(null);
    setFormData({
      tenNV: "",
      ngaySinh: "",
      diaChi: "",
      luong: 0,
      department: "",
      chucVu: "Nhân viên",
      ghiChu: "",
      username: "",
      password: "3TShop@2025",
      isActive: "DANGLAMVIEC",
      selectedAreas: [],
      areaStartDate: "",
    });
    setIsModalOpen(true);
  };

  const handleTransfer = async () => {
    if (!canAssign) {
      toast.error("Bạn không có quyền điều chuyển nhân viên");
      return;
    }
    if (!transferEmployee || !transferData.newDepartment) {
      toast.warning("Vui lòng chọn bộ phận mới!");
      return;
    }

    if (!transferData.transferDate) {
      toast.warning("Vui lòng chọn ngày chuyển!");
      return;
    }

    // Kiểm tra nếu chuyển sang bộ phận giao hàng (mã 11) thì phải chọn khu vực
    const isDeliveryDepartment = transferData.newDepartment === "11";
    if (isDeliveryDepartment && transferData.selectedAreas.length === 0) {
      toast.warning(
        "Vui lòng chọn ít nhất một khu vực phụ trách cho bộ phận giao hàng!"
      );
      return;
    }
    if (isDeliveryDepartment && transferData.selectedAreas.length > 0) {
      if (!transferData.areaStartDate) {
        toast.warning("Vui lòng chọn ngày bắt đầu phụ trách khu vực!");
        return;
      }
      const today = new Date().toISOString().slice(0, 10);
      if (transferData.areaStartDate <= today) {
        toast.error("Ngày bắt đầu phụ trách phải lớn hơn ngày hiện tại!");
        return;
      }
    }
    try {
      const payload = {
        MaNV: transferEmployee.maNV,
        MaBoPhanMoi: parseInt(transferData.newDepartment),
        NgayChuyen: transferData.transferDate,
        ChucVu: transferData.position,
        GhiChu: transferData.notes,
        ...(isDeliveryDepartment && {
          KhuVucPhuTrach: transferData.selectedAreas,
          NgayBatDauPhuTrach: transferData.areaStartDate,
        }),
      };

      await transferEmployeeAPI(payload);
      toast.success(`Điều chuyển ${transferEmployee.tenNV} thành công!`);
      setIsTransferModalOpen(false);
      setTransferEmployee(null);
      setTransferData({
        newDepartment: "",
        transferDate: new Date().toISOString().slice(0, 10),
        position: "Nhân viên",
        notes: "",
        selectedAreas: [],
        areaStartDate: "",
      });
      refreshEmployees(); // Refresh lại danh sách nhân viên

      // Reopen detail dialog if it was opened from there
      if (selectedEmployee) {
        setIsDetailModalOpen(true);
      }
    } catch (error) {
      console.error("Transfer error:", error);
      toast.error("Có lỗi xảy ra khi điều chuyển nhân viên!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmployee) {
      if (!canEdit) {
        toast.error("Bạn không có quyền sửa thông tin nhân viên");
        return;
      }
    } else {
      if (!canCreate) {
        toast.error("Bạn không có quyền thêm nhân viên");
        return;
      }
    }

    // Validate required fields
    if (!formData.username || !formData.tenNV) {
      toast.warning("Vui lòng nhập đầy đủ thông tin bắt buộc!");
      return;
    }

    // For new employees, department is required
    if (!editingEmployee && !formData.department) {
      toast.warning("Vui lòng chọn bộ phận!");
      return;
    }

    // For new employees in delivery department, areas are required
    if (
      !editingEmployee &&
      formData.department === "11" &&
      formData.selectedAreas.length === 0
    ) {
      toast.warning(
        "Vui lòng chọn ít nhất một khu vực phụ trách cho bộ phận giao hàng!"
      );
      return;
    }
    // Validate area start date for new delivery employees
    if (
      !editingEmployee &&
      formData.department === "11" &&
      formData.selectedAreas.length > 0
    ) {
      if (!formData.areaStartDate) {
        toast.warning("Vui lòng chọn ngày bắt đầu phụ trách khu vực!");
        return;
      }
      const today = new Date().toISOString().slice(0, 10);
      if (formData.areaStartDate <= today) {
        toast.error("Ngày bắt đầu phụ trách phải lớn hơn ngày hiện tại!");
        return;
      }
    }

    // For editing employees in delivery department, areas are required
    // NOTE: Commented out - Now using dedicated modal for area management
    /*
    if (
      editingEmployee &&
      editingEmployee.department === "11" &&
      formData.selectedAreas.length === 0
    ) {
      toast.warning(
        "Nhân viên bộ phận giao hàng phải được phân công ít nhất một khu vực!"
      );
      return;
    }
    */

    // For new employees, password is required
    if (!editingEmployee && !formData.password) {
      toast.warning("Vui lòng nhập mật khẩu cho nhân viên mới!");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.username)) {
      toast.error("Email không hợp lệ");
      return;
    }

    // Validate password only when it's provided (for both new and edit cases)
    if (formData.password && formData.password.trim() !== "") {
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(formData.password)) {
        toast.error(
          "Mật khẩu phải có ít nhất 8 ký tự, gồm chữ thường, chữ hoa, số và ký tự đặc biệt"
        );
        return;
      }
    }

    try {
      if (editingEmployee) {
        // Prepare edit payload with only basic employee fields
        const editPayload: any = {
          Email: formData.username,
          TenNV: formData.tenNV,
          NgaySinh: formData.ngaySinh,
          DiaChi: formData.diaChi,
          Luong: formData.luong,
        };
        // Add area assignments if employee is in delivery department
        // NOTE: Commented out - Now using dedicated modal for area management
        /*
        if (editingEmployee.department === "11") {
          editPayload.KhuVucPhuTrach = formData.selectedAreas;
        }
        */
        // Only add password when it's provided (not empty)
        if (formData.password && formData.password.trim() !== "") {
          editPayload.Password = formData.password;
        }
        await updateEmployee(editingEmployee.maNV, editPayload);
        toast.success("Cập nhật nhân viên thành công");
        setIsModalOpen(false);
        setEditingEmployee(null);
        refreshEmployees();
      } else {
        // Chuẩn bị payload cho nhân viên mới
        const today = new Date().toISOString().slice(0, 10);
        const employeePayload: any = {
          Email: formData.username,
          TenNV: formData.tenNV,
          NgaySinh: formData.ngaySinh,
          DiaChi: formData.diaChi,
          Luong: formData.luong,
        };

        // Nếu là bộ phận giao hàng, thêm trường KhuVuc
        if (formData.department === "11" && formData.selectedAreas.length > 0) {
          employeePayload.KhuVucPhuTrach = formData.selectedAreas; // Send array of selected areas
          if (formData.areaStartDate) {
            employeePayload.NgayBatDauPhuTrach = formData.areaStartDate; // custom field for backend
          }
        }

        // For new employees, always include departments array
        employeePayload.BoPhan = [
          {
            MaBoPhan: parseInt(formData.department),
            NgayBatDau: today,
            TrangThai: formData.isActive,
            ChucVu: formData.chucVu,
            GhiChu: formData.ghiChu,
          },
        ];

        // Only add password when it's provided (not empty)
        if (formData.password && formData.password.trim() !== "") {
          employeePayload.MatKhau = formData.password;
        }

        await createEmployee(employeePayload);
        toast.success("Tạo nhân viên thành công");
        setIsModalOpen(false);
        setEditingEmployee(null);
        refreshEmployees();
      }
    } catch (error) {
      console.error("Error with employee operation:", error);
      if (editingEmployee) {
        toast.error("Lỗi khi cập nhật nhân viên");
      } else {
        toast.error("Lỗi khi tạo nhân viên");
      }
    }
  };

  // Filter employees
  const filteredEmployees = employees.filter((employee) => {
    const matchesDepartment =
      filterDepartment === "all" || employee.department === filterDepartment;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && employee.isActive === "DANGLAMVIEC") ||
      (filterStatus === "inactive" && employee.isActive !== "DANGLAMVIEC");
    return matchesDepartment && matchesStatus;
  });

  const columns: Column[] = [
    {
      key: "maNV",
      title: "Mã",
      dataIndex: "maNV",
      sortable: true,
      width: "60px",
      render: (value) => (
        <span className="font-mono text-xs bg-gray-100 px-1 py-1 rounded">
          {value}
        </span>
      ),
    },
    {
      key: "employee",
      title: "Nhân viên",
      dataIndex: "tenNV",
      width: "180px",
      render: (_, record) => {
        return (
          <div
            className="min-w-0 cursor-pointer hover:bg-blue-50 p-2 rounded transition-colors"
            onClick={() => handleViewDetail(record)}
            title="Click để xem chi tiết"
          >
            <div className="font-medium text-gray-900 text-xs truncate">
              {record.tenNV}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {record.username}
            </div>
          </div>
        );
      },
    },
    {
      key: "departmentName",
      title: "Bộ phận",
      dataIndex: "departmentName",
      width: "100px",
      render: (value) => (
        <span className="text-xs truncate block">{value || "Chưa có"}</span>
      ),
    },
    {
      key: "luong",
      title: "Lương",
      dataIndex: "luong",
      sortable: true,
      width: "120px",
      render: (value) => (
        <span
          className="text-xs"
          title={value ? formatCurrency(value) : "Chưa có"}
        >
          {value ? `${(value / 1000000).toFixed(1)}M` : "0"}
        </span>
      ),
    },
    {
      key: "ngaySinh",
      title: "Ngày sinh",
      dataIndex: "ngaySinh",
      width: "80px",
      render: (value) => (
        <span className="text-xs">
          {value
            ? new Date(value).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
              })
            : "-"}
        </span>
      ),
    },
    {
      key: "diaChi",
      title: "Địa chỉ",
      dataIndex: "diaChi",
      width: "120px",
      render: (value) => (
        <span
          className="text-xs truncate block max-w-[110px]"
          title={value || "Chưa có"}
        >
          {value || "Chưa có"}
        </span>
      ),
    },
    {
      key: "isActive",
      title: "Trạng thái",
      dataIndex: "isActive",
      width: "90px",
      render: (value) => (
        <span
          className={`px-1 py-1 text-xs font-medium rounded ${
            value === "DANGLAMVIEC"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {value === "DANGLAMVIEC" ? "Hoạt động" : "Nghỉ việc"}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Thao tác",
      width: "120px",
      render: (_, record) => (
        <div className="flex gap-2 justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent row click
              handleViewDetail(record);
            }}
            className="group relative bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 p-2 rounded-lg transition-all duration-200 hover:shadow-md"
            title="Xem chi tiết"
          >
            <Eye className="w-4 h-4" />
          </button>
          {record.department === "11" && (
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent row click
                handleOpenChangeArea(record);
              }}
              className="group relative bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 p-2 rounded-lg transition-all duration-200 hover:shadow-md"
              title="Quản lý khu vực phụ trách"
            >
              <MapPin className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => handleOpenPermissions(record)}
            className="group relative bg-amber-50 hover:bg-amber-100 text-amber-600 hover:text-amber-700 p-2 rounded-lg transition-all duration-200 hover:shadow-md"
            title="Xem/Gán quyền"
          >
            <Shield className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // const [areaSearch, setAreaSearch] = useState(""); // Commented out - using dedicated modal for area management
  const [transferAreaSearch, setTransferAreaSearch] = useState("");
  // const filteredAreas = areas.filter((a: any) =>
  //   a.TenKhuVuc.toLowerCase().includes(areaSearch.toLowerCase())
  // ); // Commented out - using dedicated modal for area management
  const filteredTransferAreas = areas.filter((a: any) =>
    a.TenKhuVuc.toLowerCase().includes(transferAreaSearch.toLowerCase())
  );

  return (
    <>
      <DataTable
        title={`Quản lý nhân viên (${filteredEmployees.length})`}
        columns={columns}
        data={filteredEmployees}
        onAdd={canCreate ? handleAdd : undefined}
        addButtonText="Thêm nhân viên"
        searchPlaceholder="Tìm kiếm nhân viên..."
        filterComponent={
          <div className="flex flex-wrap gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lọc theo bộ phận
              </label>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#825B32] focus:border-transparent focus:outline-none text-sm"
              >
                <option value="all">Tất cả bộ phận</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lọc theo trạng thái
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#825B32] focus:border-transparent focus:outline-none text-sm"
              >
                <option value="all">Tất cả</option>
                <option value="active">Đang làm việc</option>
                <option value="inactive">Nghỉ việc</option>
              </select>
            </div>
          </div>
        }
      />

      <Toaster position="top-center" richColors />

      {/* Add/Edit Employee Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {editingEmployee
                ? "Sửa thông tin nhân viên"
                : "Thêm nhân viên mới"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Thông tin cơ bản */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                Thông tin cơ bản
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label
                    htmlFor="tenNV"
                    className="text-sm font-medium text-gray-700"
                  >
                    Họ và tên *
                  </Label>
                  <Input
                    id="tenNV"
                    type="text"
                    value={formData.tenNV}
                    onChange={(e) =>
                      setFormData({ ...formData, tenNV: e.target.value })
                    }
                    className="mt-1"
                    placeholder="Nhập họ và tên"
                    required
                  />
                </div>

                <div>
                  <Label
                    htmlFor="username"
                    className="text-sm font-medium text-gray-700"
                  >
                    Email *
                  </Label>
                  <Input
                    id="username"
                    type="email"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className="mt-1"
                    placeholder="example@domain.com"
                    required
                  />
                </div>

                <div>
                  <Label
                    htmlFor="ngaySinh"
                    className="text-sm font-medium text-gray-700"
                  >
                    Ngày sinh
                  </Label>
                  <Input
                    id="ngaySinh"
                    type="date"
                    value={formData.ngaySinh}
                    onChange={(e) =>
                      setFormData({ ...formData, ngaySinh: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label
                    htmlFor="diaChi"
                    className="text-sm font-medium text-gray-700"
                  >
                    Địa chỉ
                  </Label>
                  <Input
                    id="diaChi"
                    type="text"
                    value={formData.diaChi}
                    onChange={(e) =>
                      setFormData({ ...formData, diaChi: e.target.value })
                    }
                    className="mt-1"
                    placeholder="Nhập địa chỉ"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="luong"
                    className="text-sm font-medium text-gray-700"
                  >
                    Lương
                  </Label>
                  <Input
                    id="luong"
                    type="text"
                    value={formData.luong ? formatCurrency(formData.luong) : ""}
                    onChange={(e) => handleSalaryChange(e.target.value)}
                    className="mt-1"
                    placeholder="0 ₫"
                  />
                </div>
              </div>
            </div>

            {/* Thông tin công việc */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Thông tin công việc
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="department"
                    className="text-sm font-medium text-gray-700"
                  >
                    Bộ phận {!editingEmployee ? "*" : "(Không thể thay đổi)"}
                  </Label>
                  <select
                    id="department"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        department: e.target.value,
                        selectedAreas: [],
                      })
                    }
                    className={`mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm ${
                      editingEmployee ? "bg-gray-100 cursor-not-allowed" : ""
                    }`}
                    required={!editingEmployee}
                    disabled={!!editingEmployee}
                  >
                    <option value="">Chọn bộ phận</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  {editingEmployee && (
                    <div className="mt-1 text-xs text-gray-500">
                      Sử dụng nút "Điều chuyển" để thay đổi bộ phận
                    </div>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="chucVu"
                    className="text-sm font-medium text-gray-700"
                  >
                    Chức vụ
                  </Label>
                  <Input
                    id="chucVu"
                    type="text"
                    value={formData.chucVu}
                    onChange={(e) =>
                      setFormData({ ...formData, chucVu: e.target.value })
                    }
                    className="mt-1"
                    placeholder="Nhân viên"
                  />
                </div>

                {!editingEmployee && (
                  <div className="flex items-center space-x-4 mt-6">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive === "DANGLAMVIEC"}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isActive: e.target.checked
                              ? "DANGLAMVIEC"
                              : "NGHIVIEC",
                          })
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label
                        htmlFor="isActive"
                        className="ml-2 text-sm text-gray-700 cursor-pointer"
                      >
                        Đang làm việc
                      </Label>
                    </div>
                  </div>
                )}
              </div>

              {/* Khu vực phụ trách cho bộ phận giao hàng */}
              {/* NOTE: Commented out - Now using dedicated modal from change-delivery-area.tsx */}
              {/*
              {((!editingEmployee && formData.department === "11") ||
                (editingEmployee && editingEmployee.department === "11")) && (
                <div className="mt-4">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Khu vực phụ trách {!editingEmployee ? "*" : ""} (có thể chọn
                    nhiều)
                  </Label>
                  <div className="mb-2 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Tìm khu vực..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      value={areaSearch}
                      onChange={(e) => setAreaSearch(e.target.value)}
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3 bg-white">
                    {areas.length === 0 ? (
                      <div className="text-sm text-gray-500 text-center py-4">
                        Đang tải danh sách khu vực...
                      </div>
                    ) : filteredAreas.length === 0 ? (
                      <div className="text-sm text-gray-500 text-center py-4">
                        Không tìm thấy khu vực phù hợp
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {filteredAreas.map((area) => (
                          <label
                            key={area.MaKhuVuc}
                            className="flex items-center space-x-2 text-sm hover:bg-gray-50 p-2 rounded cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isAreaSelected(
                                area.MaKhuVuc?.toString()
                              )}
                              onChange={() =>
                                handleAreaToggle(area.MaKhuVuc?.toString())
                              }
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="truncate">{area.TenKhuVuc}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  {formData.selectedAreas.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-md">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Đã chọn {formData.selectedAreas.length} khu vực:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {formData.selectedAreas.slice(0, 5).map((areaCode) => {
                          const area = areas.find(
                            (a) =>
                              a.MaKhuVuc?.toString() === areaCode?.toString()
                          );
                          return area ? (
                            <span
                              key={area.MaKhuVuc}
                              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
                            >
                              {area.TenKhuVuc}
                            </span>
                          ) : null;
                        })}
                        {formData.selectedAreas.length > 5 && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            +{formData.selectedAreas.length - 5} khác
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {editingEmployee && (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                      <div className="text-xs text-amber-700">
                        💡 <strong>Lưu ý:</strong> Bạn có thể thay đổi khu vực
                        phụ trách bằng cách bỏ tick các khu vực hiện tại và chọn
                        khu vực mới.
                      </div>
                    </div>
                  )}
                  {!editingEmployee && formData.department === "11" && (
                    <div className="mt-4">
                      <Label className="text-sm font-medium text-gray-700 mb-1 block">
                        Ngày bắt đầu phụ trách *
                      </Label>
                      <Input
                        type="date"
                        value={formData.areaStartDate}
                        min={new Date().toISOString().slice(0, 10)}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            areaStartDate: e.target.value,
                          })
                        }
                        className="text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Phải lớn hơn ngày hiện tại.
                      </p>
                    </div>
                  )}
                </div>
              )}
              */}

              {!editingEmployee && (
                <div className="mt-4">
                  <Label
                    htmlFor="ghiChu"
                    className="text-sm font-medium text-gray-700"
                  >
                    Ghi chú
                  </Label>
                  <textarea
                    id="ghiChu"
                    value={formData.ghiChu}
                    onChange={(e) =>
                      setFormData({ ...formData, ghiChu: e.target.value })
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm"
                    rows={3}
                    placeholder="Ghi chú về nhân viên..."
                  />
                </div>
              )}
            </div>

            {/* Thông tin bảo mật */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                Thông tin bảo mật
              </h3>
              <div>
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Mật khẩu{" "}
                  {!editingEmployee
                    ? "*"
                    : "(Để trống nếu không muốn thay đổi)"}
                </Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="flex-1"
                    required={!editingEmployee}
                    minLength={8}
                    placeholder={
                      editingEmployee
                        ? "Nhập mật khẩu mới nếu muốn thay đổi"
                        : "Nhập mật khẩu"
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="px-3"
                    title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  {!editingEmployee
                    ? "Mật khẩu phải có ít nhất 8 ký tự, gồm chữ thường, chữ hoa, số và ký tự đặc biệt"
                    : "Để trống nếu không muốn thay đổi mật khẩu hiện tại"}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-between pt-6 border-t">
              <div>
                {openFromDetail && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false);
                      setOpenFromDetail(false);
                      setIsDetailModalOpen(true);
                    }}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    ← Quay lại
                  </Button>
                )}
              </div>
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsModalOpen(false);
                    setOpenFromDetail(false);
                  }}
                >
                  Hủy
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingEmployee ? "Cập nhật" : "Thêm nhân viên"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transfer Department Dialog */}
      <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-lg font-medium">
              Điều chuyển nhân viên
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {/* Thông tin nhân viên - Compact */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-500 text-white text-sm font-bold rounded-full w-10 h-10 flex items-center justify-center">
                  {transferEmployee?.maNV}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-base truncate">
                    {transferEmployee?.tenNV}
                  </h3>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate">
                      <span className="font-medium">
                        {transferEmployee?.departmentName}
                      </span>
                    </p>
                    {/* Hiển thị khu vực hiện tại cho nhân viên giao hàng - Inline */}
                    {transferEmployee?.department === "11" &&
                      transferEmployee?.khuVucPhuTrach &&
                      transferEmployee.khuVucPhuTrach.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-gray-500">
                            Khu vực:
                          </span>
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {transferEmployee.khuVucPhuTrach
                              .filter(
                                (area: any) =>
                                  area.NhanVien_KhuVuc?.TrangThai === 1
                              )
                              .slice(0, 2)
                              .map((area: any) => (
                                <span
                                  key={area.MaKhuVuc}
                                  className="inline-block bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full"
                                  title={area.TenKhuVuc}
                                >
                                  {area.TenKhuVuc.length > 8
                                    ? area.TenKhuVuc.substring(0, 8) + "..."
                                    : area.TenKhuVuc}
                                </span>
                              ))}
                            {transferEmployee.khuVucPhuTrach.filter(
                              (area: any) =>
                                area.NhanVien_KhuVuc?.TrangThai === 1
                            ).length > 2 && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                +
                                {transferEmployee.khuVucPhuTrach.filter(
                                  (area: any) =>
                                    area.NhanVien_KhuVuc?.TrangThai === 1
                                ).length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>

            {/* Form điều chuyển */}
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Label
                    htmlFor="newDepartment"
                    className="text-sm font-medium text-gray-700 mb-1 block"
                  >
                    Bộ phận mới *
                  </Label>
                  <select
                    id="newDepartment"
                    value={transferData.newDepartment}
                    onChange={(e) =>
                      setTransferData({
                        ...transferData,
                        newDepartment: e.target.value,
                        selectedAreas: [],
                      })
                    }
                    className="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm"
                    required
                  >
                    <option value="">Chọn bộ phận</option>
                    {departments
                      .filter(
                        (dept) => dept.id !== transferEmployee?.department
                      )
                      .map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                  </select>

                  {/* Hiển thị thông báo khi chuyển từ giao hàng sang bộ phận khác */}
                  {transferEmployee?.department === "11" &&
                    transferData.newDepartment &&
                    transferData.newDepartment !== "11" && (
                      <div className="mt-1 p-2 bg-orange-50 border border-orange-200 rounded-md">
                        <div className="text-xs text-orange-700">
                          ⚠️ Nhân viên sẽ không còn phụ trách khu vực giao hàng
                        </div>
                      </div>
                    )}
                </div>

                <div>
                  <Label
                    htmlFor="transferDate"
                    className="text-sm font-medium text-gray-700 mb-1 block"
                  >
                    Ngày chuyển *
                  </Label>
                  <Input
                    id="transferDate"
                    type="date"
                    value={transferData.transferDate}
                    onChange={(e) =>
                      setTransferData({
                        ...transferData,
                        transferDate: e.target.value,
                      })
                    }
                    className="text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <Label
                  htmlFor="position"
                  className="text-sm font-medium text-gray-700 mb-1 block"
                >
                  Chức vụ mới
                </Label>
                <Input
                  id="position"
                  type="text"
                  value={transferData.position}
                  onChange={(e) =>
                    setTransferData({
                      ...transferData,
                      position: e.target.value,
                    })
                  }
                  className="text-sm"
                  placeholder="Nhân viên"
                />
              </div>

              {/* Khu vực phụ trách cho bộ phận giao hàng - Compact */}
              {transferData.newDepartment === "11" && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1 block">
                    Khu vực phụ trách giao hàng *
                    <span className="text-xs text-blue-600 ml-1">
                      (có thể chọn nhiều)
                    </span>
                  </Label>
                  <div className="mb-2 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Tìm khu vực..."
                      className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      value={transferAreaSearch}
                      onChange={(e) => setTransferAreaSearch(e.target.value)}
                    />
                  </div>
                  <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2 bg-white">
                    {areas.length === 0 ? (
                      <div className="text-sm text-gray-500 text-center py-3">
                        Đang tải...
                      </div>
                    ) : filteredTransferAreas.length === 0 ? (
                      <div className="text-sm text-gray-500 text-center py-3">
                        Không tìm thấy khu vực phù hợp
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-1">
                        {filteredTransferAreas.map((area) => (
                          <label
                            key={area.MaKhuVuc}
                            className="flex items-center space-x-1.5 text-sm hover:bg-gray-50 p-1.5 rounded cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isAreaSelected(area.MaKhuVuc, true)}
                              onChange={() =>
                                handleAreaToggle(area.MaKhuVuc, true)
                              }
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                            />
                            <span
                              className="flex-1 truncate text-xs"
                              title={area.TenKhuVuc}
                            >
                              {area.TenKhuVuc}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  {transferData.selectedAreas.length > 0 && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-md">
                      <div className="text-xs font-medium text-gray-700">
                        ✅ Đã chọn {transferData.selectedAreas.length} khu vực
                      </div>
                    </div>
                  )}
                  <div className="mt-4">
                    <Label className="text-sm font-medium text-gray-700 mb-1 block">
                      Ngày bắt đầu phụ trách *
                    </Label>
                    <Input
                      type="date"
                      value={transferData.areaStartDate}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) =>
                        setTransferData({
                          ...transferData,
                          areaStartDate: e.target.value,
                        })
                      }
                      className="text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Phải lớn hơn ngày hiện tại.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <Label
                  htmlFor="notes"
                  className="text-sm font-medium text-gray-700 mb-1 block"
                >
                  Ghi chú
                </Label>
                <textarea
                  id="notes"
                  value={transferData.notes}
                  onChange={(e) =>
                    setTransferData({ ...transferData, notes: e.target.value })
                  }
                  className="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm"
                  rows={2}
                  placeholder="Lý do điều chuyển..."
                />
              </div>
            </div>

            <div className="flex justify-between pt-3 border-t">
              <div>
                {openFromDetail && selectedEmployee && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsTransferModalOpen(false);
                      setOpenFromDetail(false);
                      setIsDetailModalOpen(true);
                    }}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 text-sm px-3 py-1.5"
                  >
                    ← Quay lại
                  </Button>
                )}
              </div>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsTransferModalOpen(false);
                    setOpenFromDetail(false);
                  }}
                  className="text-sm px-3 py-1.5"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleTransfer}
                  className="bg-blue-600 hover:bg-blue-700 text-sm px-3 py-1.5"
                >
                  Xác nhận điều chuyển
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Work History Dialog */}
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-lg font-medium">
              Lịch sử làm việc - {selectedEmployeeHistory?.tenNV}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {/* Employee Info - Compact */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="bg-blue-500 text-white text-sm font-bold rounded-full w-10 h-10 flex items-center justify-center">
                    {selectedEmployeeHistory?.maNV}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-base truncate">
                      {selectedEmployeeHistory?.tenNV}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-600 truncate">
                        {selectedEmployeeHistory?.departmentName ||
                          "Chưa phân công"}
                      </p>
                      {/* Hiển thị khu vực phụ trách cho nhân viên giao hàng - Inline */}
                      {selectedEmployeeHistory?.department === "11" &&
                        selectedEmployeeHistory?.khuVucPhuTrach &&
                        selectedEmployeeHistory.khuVucPhuTrach.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-500">•</span>
                            <div className="flex flex-wrap gap-1">
                              {selectedEmployeeHistory.khuVucPhuTrach
                                .filter(
                                  (area: any) =>
                                    area.NhanVien_KhuVuc?.TrangThai === 1
                                )
                                .slice(0, 2)
                                .map((area: any) => (
                                  <span
                                    key={area.MaKhuVuc}
                                    className="inline-block bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded"
                                    title={area.TenKhuVuc}
                                  >
                                    {area.TenKhuVuc.length > 6
                                      ? area.TenKhuVuc.substring(0, 6) + "..."
                                      : area.TenKhuVuc}
                                  </span>
                                ))}
                              {selectedEmployeeHistory.khuVucPhuTrach.filter(
                                (area: any) =>
                                  area.NhanVien_KhuVuc?.TrangThai === 1
                              ).length > 2 && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                  +
                                  {selectedEmployeeHistory.khuVucPhuTrach.filter(
                                    (area: any) =>
                                      area.NhanVien_KhuVuc?.TrangThai === 1
                                  ).length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-600">Tổng thời gian</div>
                  <div className="font-medium text-gray-900 text-sm">
                    {calculateTotalWorkDuration(workHistory)}
                  </div>
                </div>
              </div>
            </div>

            {/* Work History Timeline - Compact */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 border-b pb-1">
                Lịch sử công tác ({workHistory.length})
              </h4>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {workHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-2">📋</div>
                    <p className="text-gray-500 text-sm">
                      Chưa có lịch sử làm việc
                    </p>
                  </div>
                ) : (
                  workHistory
                    .sort(
                      (a: any, b: any) =>
                        new Date(b.NgayBatDau).getTime() -
                        new Date(a.NgayBatDau).getTime()
                    )
                    .map((history: any, index: number) => (
                      <div
                        key={`${history.MaBoPhan}-${history.NgayBatDau}`}
                        className={`p-3 rounded-lg border transition-all hover:shadow-sm ${
                          history.TrangThai === "DANGLAMVIEC"
                            ? "bg-green-50 border-green-200"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        {/* Header - Compact */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="bg-blue-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                              {workHistory.length - index}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-gray-900 text-sm truncate">
                                {history.BoPhan?.TenBoPhan ||
                                  "Bộ phận chưa xác định"}
                              </h5>
                              <p className="text-xs text-gray-600">
                                {history.ChucVu || "Nhân viên"}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              history.TrangThai === "DANGLAMVIEC"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {history.TrangThai === "DANGLAMVIEC"
                              ? "Đang làm"
                              : "Đã nghỉ"}
                          </span>
                        </div>

                        {/* Timeline - Compact Grid */}
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="bg-white p-2 rounded border">
                            <div className="text-gray-600 font-medium mb-1">
                              Bắt đầu
                            </div>
                            <div className="text-gray-900 font-medium">
                              {formatDate(history.NgayBatDau)}
                            </div>
                          </div>
                          <div className="bg-white p-2 rounded border">
                            <div className="text-gray-600 font-medium mb-1">
                              {history.NgayKetThuc ? "Kết thúc" : "Hiện tại"}
                            </div>
                            <div className="text-gray-900 font-medium">
                              {history.NgayKetThuc
                                ? formatDate(history.NgayKetThuc)
                                : "Đang làm"}
                            </div>
                          </div>
                          <div className="bg-white p-2 rounded border">
                            <div className="text-gray-600 font-medium mb-1">
                              Thời gian
                            </div>
                            <div className="text-blue-600 font-medium">
                              {calculateWorkDuration(
                                history.NgayBatDau,
                                history.NgayKetThuc ||
                                  new Date().toISOString().split("T")[0]
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Notes - Compact */}
                        {history.GhiChu && (
                          <div className="mt-2 bg-white p-2 rounded border">
                            <div className="text-gray-600 font-medium text-xs mb-1">
                              Ghi chú
                            </div>
                            <div className="text-gray-700 text-xs">
                              {history.GhiChu}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Footer - Compact */}
            <div className="flex justify-between items-center pt-3 border-t">
              <div className="text-xs text-gray-500">
                {workHistory.length} bản ghi
              </div>
              <Button
                onClick={() => setIsHistoryModalOpen(false)}
                className="bg-blue-600 hover:bg-blue-700 text-sm px-3 py-1.5"
              >
                Đóng
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Employee Detail Dialog */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium">
              Thông tin chi tiết - {selectedEmployee?.tenNV}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Employee Info Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-500 text-white text-sm font-medium rounded-full w-10 h-10 flex items-center justify-center">
                    {selectedEmployee?.maNV}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-base">
                      {selectedEmployee?.tenNV}
                    </h3>
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">Bộ phận:</span>{" "}
                      {selectedEmployee?.departmentName || "Chưa phân công"}
                    </p>
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">Email:</span>{" "}
                      {selectedEmployee?.username}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      selectedEmployee?.isActive === "DANGLAMVIEC"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {selectedEmployee?.isActive === "DANGLAMVIEC"
                      ? "Đang làm việc"
                      : "Nghỉ việc"}
                  </span>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-gray-50 p-3 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                Thông tin cá nhân
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-gray-900 mt-1">
                    {selectedEmployee?.ngaySinh
                      ? new Date(
                          selectedEmployee.ngaySinh as string
                        ).toLocaleDateString("vi-VN")
                      : "Chưa có thông tin"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">
                    Địa chỉ
                  </label>
                  <p className="text-xs text-gray-900 mt-1">
                    {selectedEmployee?.diaChi || "Chưa có thông tin"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">
                    Lương
                  </label>
                  <p className="text-xs text-gray-900 mt-1 font-medium">
                    {selectedEmployee?.luong
                      ? formatCurrency(selectedEmployee.luong)
                      : "Chưa có thông tin"}
                  </p>
                </div>
              </div>
            </div>

            {/* Work Information */}
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Thông tin công việc
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">
                    Bộ phận
                  </label>
                  <p className="text-xs text-gray-900 mt-1">
                    {selectedEmployee?.departmentName || "Chưa được phân công"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">
                    Ngày bắt đầu làm việc
                  </label>
                  <p className="text-xs text-gray-900 mt-1">
                    {selectedEmployee?.createdAt
                      ? new Date(selectedEmployee.createdAt).toLocaleDateString(
                          "vi-VN"
                        )
                      : "Chưa có thông tin"}
                  </p>
                </div>
              </div>

              {/* Areas for delivery employees */}
              {selectedEmployee?.department === "11" &&
                selectedEmployee?.khuVucPhuTrach &&
                selectedEmployee.khuVucPhuTrach.length > 0 && (
                  <div className="mt-3">
                    <label className="text-xs font-medium text-gray-600">
                      Khu vực phụ trách
                    </label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedEmployee.khuVucPhuTrach
                        .filter(
                          (area: any) => area.NhanVien_KhuVuc?.TrangThai === 1
                        )
                        .map((area: any) => (
                          <span
                            key={area.MaKhuVuc}
                            className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                            title={area.TenKhuVuc}
                          >
                            {area.TenKhuVuc}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
            </div>

            {/* Action buttons */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="flex space-x-2">
                <Button
                  onClick={handleEditFromDetail}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-1 text-xs px-3 py-2"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Sửa thông tin</span>
                </Button>
                <Button
                  onClick={handleTransferFromDetail}
                  variant="outline"
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 flex items-center space-x-1 text-xs px-3 py-2"
                >
                  <ArrowRight className="w-3 h-3" />
                  <span>Điều chuyển</span>
                </Button>
                <Button
                  onClick={handleViewHistoryFromDetail}
                  variant="outline"
                  className="border-purple-300 text-purple-700 hover:bg-purple-50 flex items-center space-x-1 text-xs px-3 py-2"
                >
                  <History className="w-3 h-3" />
                  <span>Lịch sử</span>
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsDetailModalOpen(false)}
                className="text-xs px-3 py-2"
              >
                Đóng
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permissions Modal */}
      <Modal
        isOpen={isPermissionModalOpen}
        onClose={() => setIsPermissionModalOpen(false)}
        title={`Gán vai trò cho nhân viên - ${permissionEmployee?.tenNV || ""}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Chọn vai trò phù hợp cho nhân viên. Vai trò sẽ quyết định các quyền
            hạn mà nhân viên có thể thực hiện.
          </div>

          {/* Hiển thị vai trò hiện tại của nhân viên */}
          {selectedRole && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Vai trò hiện tại:{" "}
                  <strong>
                    {ROLES[selectedRole as keyof typeof ROLES]?.displayName ||
                      `Unknown Role (${selectedRole})`}
                  </strong>
                </span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Vai trò này đã được gán cho nhân viên. Bạn có thể chọn vai trò
                khác để thay đổi.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {Object.entries(ROLES).map(([roleKey, role]) => (
              <div
                key={role.id}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedRole === roleKey
                    ? "border-[#825B32] bg-[#825B32]/5"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
                onClick={() => setSelectedRole(roleKey)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-[#825B32]" />
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {role.displayName}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      ID: {role.id} • {role.permissions.length} quyền hạn
                    </p>

                    {/* Hiển thị một số quyền chính */}
                    <div className="space-y-1">
                      {role.permissions.slice(0, 4).map((permission) => (
                        <div
                          key={permission}
                          className="flex items-center gap-1"
                        >
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                          <span className="text-xs text-gray-600 truncate">
                            {PERMISSIONS[
                              permission as keyof typeof PERMISSIONS
                            ] || permission}
                          </span>
                        </div>
                      ))}
                      {role.permissions.length > 4 && (
                        <div className="text-xs text-gray-500">
                          ... và {role.permissions.length - 4} quyền khác
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-2">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        selectedRole === roleKey
                          ? "border-[#825B32] bg-[#825B32]"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedRole === roleKey && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-xs text-blue-800">
              <strong>Lưu ý:</strong> Gán vai trò sẽ cập nhật tất cả quyền hạn
              của nhân viên theo vai trò được chọn. Việc này có thể ảnh hưởng
              đến khả năng truy cập các chức năng của nhân viên.
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsPermissionModalOpen(false);
                setSelectedRole(null);
              }}
              className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSavePermissions}
              disabled={!selectedRole}
              className={`px-4 py-2 text-sm text-white rounded transition-colors ${
                selectedRole
                  ? "bg-[#825B32] hover:bg-[#6B4A2A]"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              Gán vai trò
            </button>
          </div>
        </div>
      </Modal>

      {/* Change Delivery Area Modal */}
      <ChangeDeliveryArea
        isOpen={isChangeAreaModalOpen}
        onClose={() => setIsChangeAreaModalOpen(false)}
        employeeId={areaEmployee?.maNV || 0}
        employeeName={areaEmployee?.tenNV || ""}
      />
    </>
  );
};

export default EmployeeManagement;
