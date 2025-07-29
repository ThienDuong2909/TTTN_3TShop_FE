import React, { useState } from "react";
import { Eye, EyeOff, RefreshCw, Edit2, ArrowRight, History } from "lucide-react";
import { DataTable, Column } from "../components/ui/DataTable";
import { Modal } from "../components/ui/Modal";
import { toast, Toaster } from "sonner";
import districts from "../data/districts.json";

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
}

// ...existing code...

export const EmployeeManagement = () => {
  const [departments, setDepartments] = useState<{ id: string, name: string }[]>([]);
  
  // Helper functions for currency formatting
  const formatCurrency = (value: number): string => {
    if (!value || value === 0) return '';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const unformatCurrency = (value: string): number => {
    if (!value) return 0;
    // Remove all non-digit characters
    const numberString = value.replace(/\D/g, '');
    return parseInt(numberString) || 0;
  };

  const handleSalaryChange = (value: string) => {
    // Allow only numbers and common currency characters
    const cleanValue = value.replace(/[^\d.,₫]/g, '');
    const numericValue = unformatCurrency(cleanValue);
    setFormData({ ...formData, luong: numericValue });
  };
  
  // Helper functions for work history
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calculateWorkDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Đảm bảo endDate >= startDate
    if (end < start) {
      return '0 ngày';
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
      return 'Dưới 1 tháng';
    }
    
    return parts.join(' ');
  };

  // Hàm tính tổng thời gian làm việc từ tất cả lịch sử
  const calculateTotalWorkDuration = (workHistoryList: any[]) => {
    if (!workHistoryList || workHistoryList.length === 0) {
      return 'Dưới 1 tháng';
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

    return parts.length > 0 ? parts.join(' ') : 'Dưới 1 tháng';
  };

  // Fetch work history for specific employee
  const fetchWorkHistory = async (maNV: number) => {
    try {
      const response = await fetch(`http://localhost:8080/api/employees/${maNV}/department-history`);
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        setWorkHistory(result.data);
      } else {
        setWorkHistory([]);
        toast.error("Không thể tải lịch sử làm việc");
      }
    } catch (error) {
      console.error('Error fetching work history:', error);
      setWorkHistory([]);
      toast.error("Lỗi khi tải lịch sử làm việc");
    }
  };

  // Handle view history
  const handleViewHistory = async (employee: Employee) => {
    setSelectedEmployeeHistory(employee);
    await fetchWorkHistory(employee.maNV);
    setIsHistoryModalOpen(true);
  };
  // Fetch departments with TrangThai === true
  React.useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/department');
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          const filtered = result.data
            .filter((item: any) => item.TrangThai === true)
            .map((item: any) => ({
              id: item.MaBoPhan?.toString(),
              name: item.TenBoPhan || '',
            }));
          setDepartments(filtered);
        }
      } catch (error) {
        setDepartments([]);
      }
    };
    fetchDepartments();
  }, []);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Fetch employees from API
  const refreshEmployees = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/employees');
      const result = await res.json();
      
      if (result.success && Array.isArray(result.data)) {
        const mapped = result.data.map((item: any) => {
          // Find latest department (most recent NgayBatDau) for all employee info
          const latestDepartment = item.NhanVien_BoPhans?.reduce((latest: any, current: any) => {
            if (!latest) return current;
            return new Date(current.NgayBatDau) > new Date(latest.NgayBatDau) ? current : latest;
          }, null) || {};
          
          const mappedEmployee = {
            maNV: item.MaNV,
            tenNV: item.TenNV || 'MISSING NAME',
            ngaySinh: item.NgaySinh,
            diaChi: item.DiaChi,
            luong: item.Luong ? parseInt(item.Luong) : undefined,
            maTK: item.MaTK,
            department: latestDepartment.BoPhan?.MaBoPhan?.toString() || '',
            departmentName: latestDepartment.BoPhan?.TenBoPhan || '',
            username: item.TaiKhoan?.Email || 'MISSING EMAIL',
            isActive: latestDepartment.TrangThai || '',
            createdAt: latestDepartment.NgayBatDau || '',
            updatedAt: latestDepartment.NgayKetThuc || '',
          };
          return mappedEmployee;
        });
        
        setEmployees(mapped);
      }
    } catch (error) {
      console.error('💥 Fetch Error:', error);
      setEmployees([]);
    }
  };
  React.useEffect(() => {
    refreshEmployees();
  }, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [transferEmployee, setTransferEmployee] = useState<Employee | null>(null);
  const [selectedEmployeeHistory, setSelectedEmployeeHistory] = useState<Employee | null>(null);
  const [workHistory, setWorkHistory] = useState<any[]>([]);
  const [transferData, setTransferData] = useState({
    newDepartment: "",
    transferDate: new Date().toISOString().slice(0, 10),
    position: "Nhân viên",
    notes: "",
    district: "" // Thêm trường khu vực
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
    district: "", // Thêm trường khu vực cho nhân viên mới
  });

  const handleAdd = () => {
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
      district: "",
    });
    setIsModalOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      tenNV: employee.tenNV,
      ngaySinh: employee.ngaySinh || "",
      diaChi: employee.diaChi || "",
      luong: employee.luong || 0,
      department: employee.department || "",
      chucVu: "Nhân viên",
      ghiChu: "", 
      username: employee.username || "",
      password: "",
      isActive: employee.isActive,
      district: "", // Không cần hiển thị khu vực khi sửa nhân viên
    });
    setIsModalOpen(true);
  };

  const handleTransfer = async () => {
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
    if (isDeliveryDepartment && !transferData.district) {
      toast.warning("Vui lòng chọn khu vực phụ trách cho bộ phận giao hàng!");
      return;
    }

    try {
      const payload = {
        MaNV: transferEmployee.maNV,
        MaBoPhanMoi: parseInt(transferData.newDepartment),
        NgayChuyen: transferData.transferDate,
        ChucVu: transferData.position,
        GhiChu: transferData.notes,
        ...(isDeliveryDepartment && { KhuVuc: transferData.district }) // Chỉ gửi KhuVuc nếu là bộ phận giao hàng
      };

      const response = await fetch('http://localhost:8080/api/employees/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Điều chuyển ${transferEmployee.tenNV} thành công!`);
        setIsTransferModalOpen(false);
        setTransferEmployee(null);
        setTransferData({
          newDepartment: "",
          transferDate: new Date().toISOString().slice(0, 10),
          position: "Nhân viên",
          notes: "",
          district: ""
        });
        refreshEmployees(); // Refresh lại danh sách nhân viên
      } else {
        toast.error(result.message || "Điều chuyển nhân viên thất bại!");
      }
    } catch (error) {
      console.error('Transfer error:', error);
      toast.error("Có lỗi xảy ra khi điều chuyển nhân viên!");
    }
  };

  // Password generator function
  const generatePassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const specials = '!@#$%^&*(),.?":{}|<>';

    let password = "";

    // Ensure at least one character from each required type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specials[Math.floor(Math.random() * specials.length)];

    // Fill the rest randomly from all character sets
    const allChars = uppercase + lowercase + numbers + specials;
    for (let i = 3; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    password = password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");

    setFormData({
      ...formData,
      password: password,
      // confirmPassword: password,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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

    // For new employees in delivery department, district is required
    if (!editingEmployee && formData.department === "11" && !formData.district) {
      toast.warning("Vui lòng chọn khu vực phụ trách cho bộ phận giao hàng!");
      return;
    }

    // For new employees, password is required
    if (!editingEmployee && !formData.password) {
      toast.warning("Vui lòng nhập mật khẩu cho nhân viên mới!");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.username)) {
      toast.error('Email không hợp lệ');
      return;
    }

    // Validate password only when it's provided (for both new and edit cases)
    if (formData.password && formData.password.trim() !== '') {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(formData.password)) {
        toast.error('Mật khẩu phải có ít nhất 8 ký tự, gồm chữ thường, chữ hoa, số và ký tự đặc biệt');
        return;
      }
    }

    // Chuẩn bị payload
    const today = new Date().toISOString().slice(0, 10);
    const employeePayload: any = {
      Email: formData.username,
      TenNV: formData.tenNV,
      NgaySinh: formData.ngaySinh,
      DiaChi: formData.diaChi,
      Luong: formData.luong,
    };

    // Nếu là bộ phận giao hàng, thêm trường KhuVuc
    if (!editingEmployee && formData.department === "11" && formData.district) {
      employeePayload.KhuVuc = formData.district;
    }

    // For new employees, always include departments array
    if (!editingEmployee) {
      employeePayload.departments = [
        {
          MaBoPhan: parseInt(formData.department),
          NgayBatDau: today,
          ChucVu: formData.chucVu,
          TrangThai: formData.isActive,
          GhiChu: formData.ghiChu,
        },
      ];
    }

    // For editing employees - only send basic employee info, not department info
    if (editingEmployee) {
      // Prepare edit payload with only basic employee fields
      const editPayload: any = {
        Email: formData.username,
        TenNV: formData.tenNV,
        NgaySinh: formData.ngaySinh,
        DiaChi: formData.diaChi,
        Luong: formData.luong,
      };

      // Only add password when it's provided (not empty)
      if (formData.password && formData.password.trim() !== '') {
        editPayload.Password = formData.password;
      }

      // Update employee info
      fetch(`http://localhost:8080/api/employees/${editingEmployee.maNV}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editPayload),
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.success) {
            toast.success("Cập nhật nhân viên thành công");
            setIsModalOpen(false);
            setEditingEmployee(null);
            refreshEmployees();
          } else {
            toast.error(result.message || "Cập nhật nhân viên thất bại");
          }
        })
        .catch((error) => {
          console.error('Error updating employee:', error);
          toast.error("Lỗi khi cập nhật nhân viên");
        });
      return; // Exit early for edit case
    }

    // Normal case for new employee, edit case is handled above
    if (!editingEmployee) {
      // Only add password when it's provided (not empty)
      if (formData.password && formData.password.trim() !== '') {
        employeePayload.Password = formData.password;
      }

      fetch("http://localhost:8080/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employeePayload),
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.success) {
            toast.success("Tạo nhân viên thành công");
            setIsModalOpen(false);
            setEditingEmployee(null);
            refreshEmployees();
          } else {
            toast.error("Tạo nhân viên thất bại");
          }
        })
        .catch(() => {
          toast.error("Lỗi khi tạo nhân viên");
        });
    }
  };

  // Filter employees
  const filteredEmployees = employees.filter((employee) => {
    const matchesDepartment = filterDepartment === "all" || employee.department === filterDepartment;
    const matchesStatus = filterStatus === "all" || 
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
          <div className="min-w-0">
            <div className="font-medium text-gray-900 text-xs truncate">{record.tenNV}</div>
            <div className="text-xs text-gray-500 truncate">{record.username}</div>
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
        <span className="text-xs" title={value ? formatCurrency(value) : "Chưa có"}>
          {value ? `${(value/1000000).toFixed(1)}M` : "0"}
        </span>
      ),
    },
    {
      key: "ngaySinh",
      title: "Sinh",
      dataIndex: "ngaySinh",
      width: "80px",
      render: (value) => (
        <span className="text-xs">{value ? new Date(value).toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit', year: '2-digit'}) : "-"}</span>
      ),
    },
    {
      key: "diaChi",
      title: "Địa chỉ",
      dataIndex: "diaChi",
      width: "120px",
      render: (value) => (
        <span className="text-xs truncate block max-w-[110px]" title={value || "Chưa có"}>
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
            onClick={() => handleEdit(record)}
            className="group relative bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 p-2 rounded-lg transition-all duration-200 hover:shadow-md"
            title="Sửa thông tin"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setTransferEmployee(record);
        setTransferData({
          newDepartment: "",
          transferDate: new Date().toISOString().slice(0, 10),
          position: "Nhân viên",
          notes: "",
          district: ""
        });
              setIsTransferModalOpen(true);
            }}
            className="group relative bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 p-2 rounded-lg transition-all duration-200 hover:shadow-md"
            title="Điều chuyển bộ phận"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleViewHistory(record)}
            className="group relative bg-purple-50 hover:bg-purple-100 text-purple-600 hover:text-purple-700 p-2 rounded-lg transition-all duration-200 hover:shadow-md"
            title="Xem lịch sử làm việc"
          >
            <History className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        title={`Quản lý nhân viên (${filteredEmployees.length})`}
        columns={columns}
        data={filteredEmployees}
        onAdd={handleAdd}
        // onEdit={handleEdit} // Removed because we have edit button in actions column
        // onDelete={handleDelete}
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

      {/* Add/Edit Employee Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEmployee ? "Sửa thông tin nhân viên" : "Thêm nhân viên mới"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Bộ phận {!editingEmployee ? '*' : '(Không thể thay đổi)'}
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value, district: "" })}
                className={`w-full px-2 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-[#825B32] focus:border-transparent focus:outline-none text-xs ${
                  editingEmployee ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                required={!editingEmployee}
                disabled={!!editingEmployee}
              >
                <option value="">Chọn bộ phận</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
              {editingEmployee && (
                <div className="mt-1 text-xs text-gray-500">
                  Sử dụng nút "Chuyển" để thay đổi bộ phận
                </div>
              )}
            </div>

            {/* Hiển thị dropdown chọn khu vực chỉ khi thêm mới và chọn bộ phận giao hàng (mã 11) */}
            {!editingEmployee && formData.department === "11" && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Chọn khu vực phụ trách *
                </label>
                <select
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-2 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-[#825B32] focus:border-transparent focus:outline-none text-xs"
                  required
                >
                  <option value="">Chọn phường/xã</option>
                  {districts.map((district, index) => (
                    <option key={index} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
                <div className="mt-1 text-xs text-gray-500">
                  Nhân viên sẽ phụ trách giao hàng tại khu vực này
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Họ và tên *</label>
              <input
                type="text"
                value={formData.tenNV}
                onChange={(e) => setFormData({ ...formData, tenNV: e.target.value })}
                className="w-full px-2 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-[#825B32] focus:border-transparent focus:outline-none text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-2 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-[#825B32] focus:border-transparent focus:outline-none text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Ngày sinh</label>
              <input
                type="date"
                value={formData.ngaySinh}
                onChange={(e) => setFormData({ ...formData, ngaySinh: e.target.value })}
                className="w-full px-2 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-[#825B32] focus:border-transparent focus:outline-none text-xs"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Địa chỉ</label>
              <input
                type="text"
                value={formData.diaChi}
                onChange={(e) => setFormData({ ...formData, diaChi: e.target.value })}
                className="w-full px-2 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-[#825B32] focus:border-transparent focus:outline-none text-xs"
              />
            </div>
            {!editingEmployee && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Chức vụ</label>
                <input
                  type="text"
                  value={formData.chucVu}
                  onChange={(e) => setFormData({ ...formData, chucVu: e.target.value })}
                  className="w-full px-2 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-[#825B32] focus:border-transparent focus:outline-none text-xs"
                  placeholder="Nhân viên"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Lương</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.luong ? formatCurrency(formData.luong) : ''}
                  onChange={(e) => handleSalaryChange(e.target.value)}
                  className="w-full px-2 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-[#825B32] focus:border-transparent focus:outline-none text-xs"
                  placeholder="0 ₫"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-xs">₫</span>
                </div>
              </div>
              {formData.luong > 0 && (
                <div className="mt-1 text-xs text-gray-500">
                  {formatCurrency(formData.luong)}
                </div>
              )}
            </div>
            {!editingEmployee && (
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea
                  value={formData.ghiChu}
                  onChange={(e) => setFormData({ ...formData, ghiChu: e.target.value })}
                  className="w-full px-2 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-[#825B32] focus:border-transparent focus:outline-none text-xs"
                  rows={2}
                  placeholder="Ghi chú về nhân viên..."
                />
              </div>
            )}
            {!editingEmployee && (
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive === "DANGLAMVIEC"}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked ? "DANGLAMVIEC" : "NGHIVIEC" })}
                  className="rounded border-gray-300 text-[#825B32] focus:ring-[#825B32]"
                />
                <label htmlFor="isActive" className="ml-2 text-xs text-gray-700">
                  Đang làm việc
                </label>
              </div>
            )}
            {/* Trường mật khẩu - bắt buộc khi thêm mới, tùy chọn khi sửa */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Mật khẩu {!editingEmployee ? '*' : '(Để trống nếu không muốn thay đổi)'}
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-2 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-[#825B32] focus:border-transparent focus:outline-none text-xs"
                  required={!editingEmployee}
                  minLength={8}
                  placeholder={editingEmployee ? "Nhập mật khẩu mới nếu muốn thay đổi" : "Nhập mật khẩu"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-2 py-2 text-xs bg-[#825B32] text-white rounded hover:bg-[#6B4A2A] flex items-center justify-center"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                <button
                  type="button"
                  onClick={generatePassword}
                  className="px-2 py-2 text-xs bg-[#825B32] text-white rounded hover:bg-[#6B4A2A] flex items-center justify-center"
                  title="Tạo mật khẩu ngẫu nhiên"
                ><RefreshCw className="w-4 h-4" /></button>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {!editingEmployee 
                  ? "Mật khẩu phải có ít nhất 8 ký tự, gồm chữ thường, chữ hoa, số, ký tự đặc biệt"
                  : "Để trống nếu không muốn thay đổi mật khẩu hiện tại"
                }
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            >Hủy</button>
            <button
              type="submit"
              className="px-3 py-2 text-xs font-medium text-white bg-[#825B32] rounded hover:bg-[#6B4A2A] transition-colors"
            >Xác nhận</button>
          </div>
        </form>
      </Modal>

      {/* Transfer Department Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Điều chuyển nhân viên"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-700">
              Điều chuyển nhân viên: <strong>{transferEmployee?.tenNV}</strong>
            </p>
            <p className="text-xs text-gray-500">
              Bộ phận hiện tại: {transferEmployee?.departmentName}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Chọn bộ phận mới *
            </label>
            <select
              value={transferData.newDepartment}
              onChange={(e) => setTransferData({ ...transferData, newDepartment: e.target.value, district: "" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#825B32] focus:border-transparent focus:outline-none text-xs"
              required
            >
              <option value="">Chọn bộ phận</option>
              {departments
                .filter((dept) => dept.id !== transferEmployee?.department)
                .map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Hiển thị dropdown chọn khu vực chỉ khi chọn bộ phận giao hàng (mã 11) */}
          {transferData.newDepartment === "11" && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Chọn khu vực phụ trách *
              </label>
              <select
                value={transferData.district}
                onChange={(e) => setTransferData({ ...transferData, district: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#825B32] focus:border-transparent focus:outline-none text-xs"
                required
              >
                <option value="">Chọn phường/xã</option>
                {districts.map((district, index) => (
                  <option key={index} value={district}>
                    {district}
                  </option>
                ))}
              </select>
              <div className="mt-1 text-xs text-gray-500">
                Nhân viên sẽ phụ trách giao hàng tại khu vực này
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Ngày chuyển *
            </label>
            <input
              type="date"
              value={transferData.transferDate}
              onChange={(e) => setTransferData({ ...transferData, transferDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#825B32] focus:border-transparent focus:outline-none text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Chức vụ mới
            </label>
            <input
              type="text"
              value={transferData.position}
              onChange={(e) => setTransferData({ ...transferData, position: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#825B32] focus:border-transparent focus:outline-none text-xs"
              placeholder="Nhân viên"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Ghi chú
            </label>
            <textarea
              value={transferData.notes}
              onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#825B32] focus:border-transparent focus:outline-none text-xs"
              rows={3}
              placeholder="Lý do điều chuyển..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setIsTransferModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-200 border border-gray-300 rounded-md hover:bg-gray-300 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleTransfer}
              className="px-4 py-2 text-xs font-medium text-white bg-[#825B32] rounded-md hover:bg-[#6B4A2A] transition-colors"
            >
              Xác nhận điều chuyển
            </button>
          </div>
        </div>
      </Modal>

      {/* Work History Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`Lịch sử làm việc - ${selectedEmployeeHistory?.tenNV}`}
        size="lg"
      >
        <div className="space-y-4">
          {/* Employee Info */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500 text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center">
                {selectedEmployeeHistory?.maNV}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">{selectedEmployeeHistory?.tenNV}</h3>
                <p className="text-xs text-gray-600">{selectedEmployeeHistory?.departmentName || "Chưa phân công"}</p>
              </div>
              <div className="ml-auto">
                <div className="text-xs text-gray-500">Tổng thời gian</div>
                <div className="font-semibold text-gray-900 text-sm">
                  {calculateTotalWorkDuration(workHistory)}
                </div>
              </div>
            </div>
          </div>

          {/* Work History Timeline */}
          <div className="max-h-96 overflow-y-auto">
            {workHistory.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-3">📋</div>
                <p className="text-gray-500">Chưa có lịch sử làm việc</p>
              </div>
            ) : (
              <div className="space-y-3">
                {workHistory
                  .sort((a: any, b: any) => new Date(b.NgayBatDau).getTime() - new Date(a.NgayBatDau).getTime())
                  .map((history: any, index: number) => (
                    <div
                      key={`${history.MaBoPhan}-${history.NgayBatDau}`}
                      className={`p-3 rounded-lg border-2 ${
                        history.TrangThai === "DANGLAMVIEC"
                          ? "bg-green-50 border-green-200"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {workHistory.length - index}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-sm">
                              {history.BoPhan?.TenBoPhan || "Bộ phận chưa xác định"}
                            </h4>
                            <p className="text-xs text-gray-600">{history.ChucVu || "Nhân viên"}</p>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            history.TrangThai === "DANGLAMVIEC"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {history.TrangThai === "DANGLAMVIEC" ? "Đang làm việc" : "Đã nghỉ"}
                        </span>
                      </div>

                      {/* Timeline */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="text-gray-600 font-medium mb-1">Ngày bắt đầu</div>
                          <div className="text-gray-900">{formatDate(history.NgayBatDau)}</div>
                        </div>
                        <div>
                          <div className="text-gray-600 font-medium mb-1">
                            {history.NgayKetThuc ? "Ngày kết thúc" : "Hiện tại"}
                          </div>
                          <div className="text-gray-900">
                            {history.NgayKetThuc ? formatDate(history.NgayKetThuc) : "Đang làm việc"}
                          </div>
                        </div>
                      </div>

                      {/* Duration */}
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="text-gray-600 font-medium text-xs mb-1">Thời gian làm việc</div>
                        <div className="text-gray-900 font-semibold text-xs">
                          {calculateWorkDuration(
                            history.NgayBatDau,
                            history.NgayKetThuc || new Date().toISOString().split("T")[0]
                          )}
                        </div>
                      </div>

                      {/* Notes */}
                      {history.GhiChu && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="text-gray-600 font-medium text-xs mb-1">Ghi chú</div>
                          <div className="text-gray-700 text-xs">{history.GhiChu}</div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Hiển thị {workHistory.length} bản ghi
            </div>
            <button
              onClick={() => setIsHistoryModalOpen(false)}
              className="px-3 py-1 text-xs font-medium text-white bg-[#825B32] border border-transparent rounded-lg hover:bg-[#6B4A2A] transition-colors focus:outline-none"
            >
              Đóng
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default EmployeeManagement;
