import React, { useState } from "react";
import { DataTable, Column } from "../components/ui/DataTable";
import { Modal } from "../components/ui/Modal";
import { toast, Toaster } from "sonner";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  updateDepartmentStatus,
} from "../services/api";

const Departments = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    managerId: "",
    location: "",
    budget: 0,
    isActive: true,
    notes: "",
  });

  React.useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const result = await getDepartments();
        if (result && result.success && Array.isArray(result.data)) {
          if (result.data.length === 0) {
            setDepartments([]);
          } else {
            setDepartments(
              result.data.map((item: any) => ({
                id: item.MaBoPhan,
                name: item.TenBoPhan,
                staffCount: item.SoLuongNhanVien || 0,
                createdAt: item.NgayTao,
                isActive: item.TrangThai,
              }))
            );
          }
        } else if (Array.isArray(result)) {
          if (result.length === 0) {
            setDepartments([]);
          } else {
            setDepartments(
              result.map((item: any) => ({
                id: item.MaBoPhan,
                name: item.TenBoPhan,
                staffCount: item.SoLuongNhanVien || 0,
                createdAt: item.NgayTao,
                isActive: item.TrangThai,
              }))
            );
          }
        } else {
          setDepartments([]);
          toast.error("Dữ liệu bộ phận không hợp lệ!");
        }
      } catch (error: any) {
        setDepartments([]);
        let errorMessage = "Có lỗi xảy ra khi tải danh sách bộ phận!";

        if (error?.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error?.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error?.message) {
          errorMessage = error.message;
        }

        toast.error(errorMessage);
      }
    };
    fetchDepartments();
  }, []);

  const handleAdd = () => {
    setEditingDepartment(null);
    setFormData({
      name: "",
      description: "",
      managerId: "",
      location: "",
      budget: 0,
      isActive: true,
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleEdit = (department: any) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name || "",
      description: department.description || "",
      managerId: department.managerId || "",
      location: department.location || "",
      budget: department.budget || 0,
      isActive: department.isActive ?? true,
      notes: department.notes || "",
    });
    setIsModalOpen(true);
  };

  const [confirmHideModal, setConfirmHideModal] = useState<{
    open: boolean;
    department: any | null;
  }>({ open: false, department: null });

  const handleToggleDepartment = (department: any) => {
    setConfirmHideModal({ open: true, department });
  };

  const confirmToggle = async () => {
    if (!confirmHideModal.department) return;
    // Gọi API cập nhật trạng thái bộ phận (ẩn/hiển thị)
    const newStatus = confirmHideModal.department.isActive === true ? 0 : 1;

    try {
      const result = await updateDepartmentStatus(
        confirmHideModal.department.id,
        newStatus
      );
      if (result.success) {
        toast.success(
          newStatus === 0
            ? "Đã ẩn bộ phận thành công!"
            : "Đã hiển thị bộ phận thành công!"
        );
        // Refresh lại danh sách
        const resultList = await getDepartments();
        if (
          resultList &&
          resultList.success &&
          Array.isArray(resultList.data)
        ) {
          setDepartments(
            resultList.data.map((item: any) => ({
              id: item.MaBoPhan,
              name: item.TenBoPhan,
              staffCount: item.SoLuongNhanVien || 0,
              createdAt: item.NgayTao,
              isActive: item.TrangThai, // TrangThai is boolean from API
            }))
          );
        } else if (Array.isArray(resultList)) {
          // Fallback for direct array
          setDepartments(
            resultList.map((item: any) => ({
              id: item.MaBoPhan,
              name: item.TenBoPhan,
              staffCount: item.SoLuongNhanVien || 0,
              createdAt: item.NgayTao,
              isActive: item.TrangThai,
            }))
          );
        }
      } else {
        toast.error(
          result.message ||
            (newStatus === 0
              ? "Ẩn bộ phận thất bại!"
              : "Hiển thị bộ phận thất bại!")
        );
      }
    } catch (error: any) {
      console.error("Error updating department status:", error);
      let errorMessage = "Có lỗi xảy ra khi cập nhật trạng thái bộ phận!";

      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    }
    setConfirmHideModal({ open: false, department: null });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Chuẩn bị dữ liệu gửi lên backend
    const payload = {
      TenBoPhan: formData.name,
      NgayTao: new Date().toISOString(),
      TrangThai: formData.isActive ? 1 : 0,
    };

    try {
      if (editingDepartment) {
        // Update department
        const result = await updateDepartment(editingDepartment.id, payload);
        if (result.success) {
          // Refresh data from API
          const resultList = await getDepartments();
          if (
            resultList &&
            resultList.success &&
            Array.isArray(resultList.data)
          ) {
            toast.success("Cập nhật bộ phận thành công!");
            setDepartments(
              resultList.data.map((item: any) => ({
                id: item.MaBoPhan,
                name: item.TenBoPhan,
                staffCount: item.SoLuongNhanVien || 0,
                createdAt: item.NgayTao,
                isActive: item.TrangThai, // TrangThai is boolean from API
              }))
            );
          } else if (Array.isArray(resultList)) {
            // Fallback for direct array
            toast.success("Cập nhật bộ phận thành công!");
            setDepartments(
              resultList.map((item: any) => ({
                id: item.MaBoPhan,
                name: item.TenBoPhan,
                staffCount: item.SoLuongNhanVien || 0,
                createdAt: item.NgayTao,
                isActive: item.TrangThai,
              }))
            );
          }
        } else {
          toast.error(result.message || "Cập nhật bộ phận thất bại!");
        }
      } else {
        // Add new department
        const result = await createDepartment(payload);
        if (result.success) {
          // Refresh data from API
          const resultList = await getDepartments();
          if (
            resultList &&
            resultList.success &&
            Array.isArray(resultList.data)
          ) {
            toast.success("Thêm bộ phận thành công!");
            setDepartments(
              resultList.data.map((item: any) => ({
                id: item.MaBoPhan,
                name: item.TenBoPhan,
                staffCount: item.SoLuongNhanVien || 0,
                createdAt: item.NgayTao,
                isActive: item.TrangThai, // TrangThai is boolean from API
              }))
            );
          } else if (Array.isArray(resultList)) {
            // Fallback for direct array
            toast.success("Thêm bộ phận thành công!");
            setDepartments(
              resultList.map((item: any) => ({
                id: item.MaBoPhan,
                name: item.TenBoPhan,
                staffCount: item.SoLuongNhanVien || 0,
                createdAt: item.NgayTao,
                isActive: item.TrangThai,
              }))
            );
          }
        } else {
          toast.error(result.message || "Thêm bộ phận thất bại!");
        }
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi gọi API bộ phận!");
    }
    setIsModalOpen(false);
    setEditingDepartment(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const columns: Column[] = [
    {
      key: "name",
      title: "Tên bộ phận",
      dataIndex: "name",
      sortable: true,
      render: (value) => (
        <div className="font-medium text-gray-900">{value}</div>
      ),
    },
    {
      key: "staffCount",
      title: "Số nhân viên",
      dataIndex: "staffCount",
      sortable: true,
      render: (value) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {typeof value === "number" ? value : 0} người
        </span>
      ),
    },
    {
      key: "createdAt",
      title: "Ngày tạo",
      dataIndex: "createdAt",
      sortable: true,
      render: (value) => (value ? formatDate(value) : "--"),
    },
    {
      key: "isActive",
      title: "Trạng thái",
      dataIndex: "isActive",
      render: (value) => (
        <>
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full transition-colors ${
              value === true
                ? "bg-green-100 text-green-800"
                : value === false
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {value === true
              ? "Hoạt động"
              : value === false
              ? "Ngừng hoạt động"
              : "--"}
          </span>
        </>
      ),
    },
    {
      key: "actions",
      title: "Thao tác",
      dataIndex: "actions",
      render: (_: any, record: any) => (
        <div className="flex flex-col gap-2 md:flex-row md:gap-2">
          <button
            className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
            onClick={() => handleEdit(record)}
          >
            Sửa
          </button>
          {record.isActive === true ? (
            <button
              className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
              onClick={() => handleToggleDepartment(record)}
            >
              Ẩn
            </button>
          ) : record.isActive === false ? (
            <button
              className="px-2 py-1 text-xs bg-green-200 text-green-800 rounded hover:bg-green-300"
              onClick={() => handleToggleDepartment(record)}
            >
              Hiển thị
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  // Bộ lọc trạng thái
  const filteredDepartments = departments.filter((dep) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "active") return dep.isActive === true;
    if (filterStatus === "inactive") return dep.isActive === false;
    return true;
  });

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <DataTable
          title="Quản lý bộ phận"
          columns={columns}
          data={filteredDepartments}
          onAdd={handleAdd}
          addButtonText="Thêm bộ phận"
          searchPlaceholder="Tìm kiếm bộ phận..."
          filterComponent={
            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span className="font-medium text-gray-700 mr-2 text-sm">
                Lọc theo trạng thái:
              </span>
              <button
                className={`px-3 py-1 rounded-lg font-semibold text-xs transition-colors duration-450 shadow-sm border ${
                  filterStatus === "all"
                    ? "bg-[#8B5C2A] text-white border-[#8B5C2A]"
                    : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-[#f3e7db]"
                } `}
                onClick={() => setFilterStatus("all")}
              >
                Tất cả
              </button>
              <button
                className={`px-3 py-1 rounded-lg font-semibold text-xs transition-colors duration-450 shadow-sm border ${
                  filterStatus === "active"
                    ? "bg-[#8B5C2A] text-white border-[#8B5C2A]"
                    : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-[#f3e7db]"
                } `}
                onClick={() => setFilterStatus("active")}
              >
                Hoạt động
              </button>
              <button
                className={`px-3 py-1 rounded-lg font-semibold text-xs transition-colors duration-450 shadow-sm border ${
                  filterStatus === "inactive"
                    ? "bg-[#8B5C2A] text-white border-[#8B5C2A]"
                    : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-[#f3e7db]"
                } `}
                onClick={() => setFilterStatus("inactive")}
              >
                Ngừng hoạt động
              </button>
            </div>
          }
        />
      </div>

      <Toaster position="top-center" richColors />

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={editingDepartment ? "Sửa bộ phận" : "Thêm bộ phận mới"}
            size="sm"
          >
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên bộ phận *
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
              </div>

              {!editingDepartment && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <label
                    htmlFor="isActive"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Bộ phận đang hoạt động
                  </label>
                </div>
              )}

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
                  // onClick={handleSubmit}
                >
                  {editingDepartment ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {confirmHideModal.open && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
          <Modal
            isOpen={confirmHideModal.open}
            onClose={() =>
              setConfirmHideModal({ open: false, department: null })
            }
            title={
              confirmHideModal.department?.isActive === true
                ? "Xác nhận ẩn bộ phận"
                : "Xác nhận hiển thị bộ phận"
            }
            size="sm"
          >
            <div className="space-y-4 p-2">
              {confirmHideModal.department?.isActive === true ? (
                <p>
                  Bạn có chắc chắn muốn{" "}
                  <span className="font-semibold text-red-600">ẩn</span> bộ phận{" "}
                  <span className="font-semibold">
                    {confirmHideModal.department?.name}
                  </span>{" "}
                  không?
                </p>
              ) : (
                <p>
                  Bạn có chắc chắn muốn{" "}
                  <span className="font-semibold text-green-600">hiển thị</span>{" "}
                  bộ phận{" "}
                  <span className="font-semibold">
                    {confirmHideModal.department?.name}
                  </span>{" "}
                  không?
                </p>
              )}
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  onClick={() =>
                    setConfirmHideModal({ open: false, department: null })
                  }
                >
                  Hủy
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md hover:bg-red-700 ${
                    confirmHideModal.department?.isActive === true
                      ? "bg-red-600"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                  onClick={confirmToggle}
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </Modal>
        </div>
      )}
    </>
  );
};

export default Departments;
