import React, { useState } from "react";
import { DataTable, Column } from "../components/ui/DataTable";
import { Modal } from "../components/ui/Modal";
import { AdminLayout } from "../components/AdminLayout";
import { User, Department, departments } from "../lib/data";

// Extended mock employee data
const initialEmployees: User[] = [
  {
    id: "STAFF001",
    email: "nhanvien1@fashionhub.vn",
    name: "Nguyễn Văn Nhân Viên",
    phone: "0901111111",
    address: "123 ABC, Q1, TP.HCM",
    role: "staff",
    department: "DEPT001",
    permissions: ["view_orders", "manage_orders", "view_products"],
    avatar:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face",
  },
  {
    id: "STAFF002",
    email: "nhanvien2@fashionhub.vn",
    name: "Trần Thị Kho",
    phone: "0902222222",
    address: "456 DEF, Q3, TP.HCM",
    role: "staff",
    department: "DEPT002",
    permissions: ["view_inventory", "manage_inventory", "view_suppliers"],
    avatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face",
  },
  {
    id: "ADMIN001",
    email: "admin@fashionhub.vn",
    name: "Quản Trị Viên",
    phone: "0900000000",
    address: "789 GHI, Q1, TP.HCM",
    role: "admin",
    permissions: ["all"],
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  },
  {
    id: "STAFF003",
    email: "marketing@fashionhub.vn",
    name: "Lê Thị Marketing",
    phone: "0903333333",
    address: "321 JKL, Q7, TP.HCM",
    role: "staff",
    department: "DEPT003",
    permissions: ["view_analytics", "manage_promotions", "view_customers"],
  },
];

const allPermissions = [
  { id: "view_orders", name: "Xem đơn hàng" },
  { id: "manage_orders", name: "Quản lý đơn hàng" },
  { id: "view_products", name: "Xem sản phẩm" },
  { id: "manage_products", name: "Quản lý sản phẩm" },
  { id: "view_inventory", name: "Xem kho hàng" },
  { id: "manage_inventory", name: "Quản lý kho hàng" },
  { id: "view_suppliers", name: "Xem nhà cung cấp" },
  { id: "manage_suppliers", name: "Quản lý nhà cung cấp" },
  { id: "view_customers", name: "Xem khách hàng" },
  { id: "manage_customers", name: "Quản lý khách hàng" },
  { id: "view_analytics", name: "Xem báo cáo" },
  { id: "manage_promotions", name: "Quản lý khuyến mãi" },
  { id: "manage_employees", name: "Quản lý nhân viên" },
  { id: "all", name: "Toàn quyền" },
];

export const EmployeeManagement = () => {
  const [employees, setEmployees] = useState<User[]>(initialEmployees);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    avatar: "",
    role: "staff" as "staff" | "admin",
    department: "",
    permissions: [] as string[],
  });

  const handleAdd = () => {
    setEditingEmployee(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      avatar: "",
      role: "staff",
      department: "",
      permissions: [],
    });
    setIsModalOpen(true);
  };

  const handleEdit = (employee: User) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone || "",
      address: employee.address || "",
      avatar: employee.avatar || "",
      role: employee.role as "staff" | "admin",
      department: employee.department || "",
      permissions: employee.permissions || [],
    });
    setIsModalOpen(true);
  };

  const handleDelete = (employee: User) => {
    if (
      window.confirm(`Bạn có chắc chắn muốn xóa nhân viên "${employee.name}"?`)
    ) {
      setEmployees((prev) => prev.filter((e) => e.id !== employee.id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingEmployee) {
      // Update existing employee
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === editingEmployee.id
            ? {
                ...e,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                avatar: formData.avatar,
                role: formData.role,
                department:
                  formData.role === "admin" ? undefined : formData.department,
                permissions: formData.permissions,
              }
            : e,
        ),
      );
    } else {
      // Add new employee
      const newEmployee: User = {
        id: `STAFF${Date.now()}`,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        avatar: formData.avatar,
        role: formData.role,
        department: formData.role === "admin" ? undefined : formData.department,
        permissions: formData.permissions,
      };
      setEmployees((prev) => [...prev, newEmployee]);
    }

    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (permissionId === "all") {
      setFormData({
        ...formData,
        permissions: checked ? ["all"] : [],
      });
    } else {
      let newPermissions = [...formData.permissions];

      // Remove "all" if it exists and we're selecting individual permissions
      newPermissions = newPermissions.filter((p) => p !== "all");

      if (checked) {
        newPermissions.push(permissionId);
      } else {
        newPermissions = newPermissions.filter((p) => p !== permissionId);
      }

      setFormData({
        ...formData,
        permissions: newPermissions,
      });
    }
  };

  // Enhanced data with department info
  const enhancedEmployees = employees.map((employee) => ({
    ...employee,
    departmentName: employee.department
      ? departments.find((d) => d.id === employee.department)?.name
      : "Không có",
    permissionCount: employee.permissions?.includes("all")
      ? "Toàn quyền"
      : `${employee.permissions?.length || 0} quyền`,
  }));

  const columns: Column[] = [
    {
      key: "employee",
      title: "Nhân viên",
      render: (_, record) => (
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
            {record.avatar ? (
              <img
                src={record.avatar}
                alt={record.name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-gray-600 font-medium text-sm">
                {record.name.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <div className="font-medium text-gray-900">{record.name}</div>
            <div className="text-sm text-gray-500">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      title: "Vai trò",
      dataIndex: "role",
      render: (value) => (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            value === "admin"
              ? "bg-red-100 text-red-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {value === "admin" ? "Quản trị viên" : "Nhân viên"}
        </span>
      ),
    },
    {
      key: "departmentName",
      title: "Phòng ban",
      dataIndex: "departmentName",
      render: (value) => <span className="text-gray-700">{value}</span>,
    },
    {
      key: "phone",
      title: "Số điện thoại",
      dataIndex: "phone",
      render: (value) => value || "Chưa cập nhật",
    },
    {
      key: "permissionCount",
      title: "Quyền hạn",
      dataIndex: "permissionCount",
      render: (value) => (
        <span className="text-sm bg-gray-100 px-2 py-1 rounded">{value}</span>
      ),
    },
  ];

  return (
    <AdminLayout title="Quản lý nhân viên">
      <DataTable
        title="Quản lý nhân viên"
        columns={columns}
        data={enhancedEmployees}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        addButtonText="Thêm nhân viên"
        searchPlaceholder="Tìm kiếm nhân viên..."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingEmployee ? "Sửa thông tin nhân viên" : "Thêm nhân viên mới"
        }
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Họ và tên *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vai trò *
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    role: e.target.value as "staff" | "admin",
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                required
              >
                <option value="staff">Nhân viên</option>
                <option value="admin">Quản trị viên</option>
              </select>
            </div>
          </div>

          {formData.role === "staff" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phòng ban *
              </label>
              <select
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                required={formData.role === "staff"}
              >
                <option value="">Chọn phòng ban</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Địa chỉ
            </label>
            <textarea
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL Avatar
            </label>
            <input
              type="url"
              value={formData.avatar}
              onChange={(e) =>
                setFormData({ ...formData, avatar: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            {formData.avatar && (
              <div className="mt-2">
                <img
                  src={formData.avatar}
                  alt="Avatar preview"
                  className="h-16 w-16 rounded-full object-cover"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quyền hạn
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
              {allPermissions.map((permission) => (
                <label
                  key={permission.id}
                  className="flex items-center space-x-2"
                >
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(permission.id)}
                    onChange={(e) =>
                      handlePermissionChange(permission.id, e.target.checked)
                    }
                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    disabled={
                      formData.permissions.includes("all") &&
                      permission.id !== "all"
                    }
                  />
                  <span className="text-sm text-gray-700">
                    {permission.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-brand-600 border border-transparent rounded-md hover:bg-brand-700 transition-colors"
            >
              {editingEmployee ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
};
