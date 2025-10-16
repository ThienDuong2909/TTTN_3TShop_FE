import React, { useState } from "react";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Search,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Modal } from "../../components/ui/Modal";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { toast } from "sonner";
import { Toaster } from "sonner";
import AdminHeader from "../../components/AdminHeader";
import { usePermission } from "../../components/PermissionGuard";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../../services/api";

// Based on SQL schema: nhacungcap table
interface Supplier {
  MaNCC: number;
  TenNCC: string;
  DiaChi?: string;
  SDT?: string;
  Email?: string;
}

// Mock suppliers data

export const SupplierManagement = () => {
  const { hasPermission } = usePermission();
  const canCreate =
    hasPermission("nhacungcap.tao") || hasPermission("toanquyen");
  const canEdit = hasPermission("nhacungcap.sua") || hasPermission("toanquyen");
  const canDelete =
    hasPermission("nhacungcap.xoa") || hasPermission("toanquyen");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewMode, setViewMode] = useState<"form" | "details">("form");
  const [formData, setFormData] = useState({
    TenNCC: "",
    DiaChi: "",
    SDT: "",
    Email: "",
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(
    null
  );

  // Fetch suppliers from API
  React.useEffect(() => {
    const fetchSuppliers = async () => {
      setLoading(true);
      try {
        const response = await getSuppliers(1);
        if (
          response.success &&
          response.data &&
          Array.isArray(response.data.data)
        ) {
          setSuppliers(response.data.data);
        } else {
          setSuppliers([]);
        }
      } catch (err) {
        setSuppliers([]);
        toast.error("Có lỗi xảy ra khi tải danh sách nhà cung cấp!");
      } finally {
        setLoading(false);
      }
    };
    fetchSuppliers();
  }, []);

  const handleAdd = () => {
    if (!canCreate) {
      toast.error("Bạn không có quyền thêm nhà cung cấp");
      return;
    }
    setEditingSupplier(null);
    setViewMode("form");
    setFormData({
      TenNCC: "",
      DiaChi: "",
      SDT: "",
      Email: "",
    });
    setIsModalOpen(true);
  };

  const handleEdit = (supplier: Supplier) => {
    if (!canEdit) {
      toast.error("Bạn không có quyền sửa nhà cung cấp");
      return;
    }
    setEditingSupplier(supplier);
    setViewMode("form");
    setFormData({
      TenNCC: supplier.TenNCC,
      DiaChi: supplier.DiaChi || "",
      SDT: supplier.SDT || "",
      Email: supplier.Email || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = (supplier: Supplier) => {
    if (!canDelete) {
      toast.error("Bạn không có quyền xóa nhà cung cấp");
      return;
    }
    setSupplierToDelete(supplier);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!supplierToDelete) return;

    if (!canDelete) {
      toast.error("Bạn không có quyền xóa nhà cung cấp");
      setSupplierToDelete(null);
      setDeleteConfirmOpen(false);
      return;
    }

    try {
      const response = await deleteSupplier(supplierToDelete.MaNCC);

      if (response.success) {
        setSuppliers((prev) =>
          prev.filter((s) => s.MaNCC !== supplierToDelete.MaNCC)
        );
        toast.success("Xóa nhà cung cấp thành công!");
      } else {
        toast.error(response.message || "Xóa nhà cung cấp thất bại!");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi xóa nhà cung cấp!");
    }

    setSupplierToDelete(null);
    setDeleteConfirmOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const supplierData = {
      TenNCC: formData.TenNCC,
      DiaChi: formData.DiaChi,
      SDT: formData.SDT,
      Email: formData.Email,
    };

    if (editingSupplier) {
      // Update existing supplier via API
      try {
        const response = await updateSupplier(
          editingSupplier.MaNCC,
          supplierData
        );
        if (response.success) {
          toast.success("Cập nhật thông tin nhà cung cấp thành công");
          setSuppliers((prev) =>
            prev.map((s) =>
              s.MaNCC === editingSupplier.MaNCC ? { ...s, ...formData } : s
            )
          );
        } else {
          toast.error(
            response.message || "Cập nhật thông tin nhà cung cấp thất bại!"
          );
        }
      } catch (err) {
        toast.error("Có lỗi khi cập nhật nhà cung cấp!");
      }
    } else {
      // Add new supplier via API
      if (!canCreate) {
        toast.error("Bạn không có quyền thêm nhà cung cấp");
        return;
      }
      // Nếu qua được guard, mới gọi API
      try {
        const response = await createSupplier(supplierData);
        if (response.success && response.data) {
          toast.success("Thêm nhà cung cấp thành công");
          setSuppliers((prev) => [...prev, response.data]);
        } else {
          toast.error(response.message || "Thêm nhà cung cấp thất bại!");
        }
      } catch (err) {
        toast.error("Có lỗi khi thêm nhà cung cấp!");
      }
    }

    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  // Calculate statistics
  const stats = {
    total: suppliers.length,
    withPhone: suppliers.filter((s) => s.SDT).length,
    withEmail: suppliers.filter((s) => s.Email).length,
    withAddress: suppliers.filter((s) => s.DiaChi).length,
  };

  // Filtered suppliers by search
  const filteredSuppliers = suppliers.filter((sup) =>
    sup.TenNCC.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="max-w-full">
      <Toaster position="top-center" richColors />
      <AdminHeader title="Quản lý nhà cung cấp" />

      <main className="py-4">
        <div className="px-1 sm:px-2 max-w-none w-full">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Quản lý nhà cung cấp
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Quản lý thông tin nhà cung cấp và đối tác
                </p>
              </div>
              <Button
                className="bg-[#825B32] hover:bg-[#6B4423] text-white text-sm py-2 px-4"
                onClick={handleAdd}
                disabled={!canCreate}
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm nhà cung cấp
              </Button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-[#825B32]/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#825B32]/10 rounded-lg">
                      <Building2 className="h-6 w-6 text-[#825B32]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Tổng nhà cung cấp
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.total}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#825B32]/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#825B32]/10 rounded-lg">
                      <Phone className="h-6 w-6 text-[#825B32]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Có số điện thoại
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.withPhone}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#825B32]/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#825B32]/10 rounded-lg">
                      <Mail className="h-6 w-6 text-[#825B32]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Có email
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.withEmail}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#825B32]/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#825B32]/10 rounded-lg">
                      <MapPin className="h-6 w-6 text-[#825B32]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Có địa chỉ
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.withAddress}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <Card className="w-full">
              <CardHeader className="pb-2 px-2">
                <CardTitle className="text-lg">Tìm kiếm nhà cung cấp</CardTitle>
              </CardHeader>
              <CardContent className="px-2 pt-2">
                <div className="relative w-full max-w-xs">
                  <Input
                    placeholder="Tìm kiếm theo tên nhà cung cấp..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 pr-2"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search className="w-5 h-5" />
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Suppliers Table */}
            <Card className="w-full">
              <CardHeader className="pb-2 px-2">
                <CardTitle className="text-lg">
                  Danh sách nhà cung cấp ({filteredSuppliers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pt-2">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                          Thông tin nhà cung cấp
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                          Địa chỉ
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                          Liên hệ
                        </th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="text-center py-8 text-gray-500"
                          >
                            Đang tải dữ liệu...
                          </td>
                        </tr>
                      ) : filteredSuppliers.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="text-center py-8 text-gray-500"
                          >
                            {suppliers.length === 0
                              ? "Chưa có nhà cung cấp nào"
                              : "Không tìm thấy nhà cung cấp phù hợp"}
                          </td>
                        </tr>
                      ) : (
                        filteredSuppliers.map((supplier) => (
                          <tr
                            key={supplier.MaNCC}
                            className="border-b hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-4">
                                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                  <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-sm text-gray-900 dark:text-white ">
                                    {supplier.TenNCC}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Mã NCC: {supplier.MaNCC}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                                <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                <span>
                                  {supplier.DiaChi || "Chưa cập nhật"}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="space-y-1">
                                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                  <span>{supplier.SDT || "Chưa cập nhật"}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                  <span>
                                    {supplier.Email || "Chưa cập nhật"}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleEdit(supplier)}
                                  className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 hover:shadow-md"
                                  title="Sửa nhà cung cấp"
                                  disabled={!canEdit}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(supplier)}
                                  className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-200 hover:shadow-md"
                                  title="Xóa nhà cung cấp"
                                  disabled={!canDelete}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          viewMode === "details"
            ? `Chi tiết nhà cung cấp: ${editingSupplier?.TenNCC}`
            : editingSupplier
            ? "Chỉnh sửa thông tin nhà cung cấp"
            : "Thêm nhà cung cấp mới"
        }
        size="lg"
      >
        {viewMode === "details" && editingSupplier ? (
          <div className="space-y-6">
            {/* Supplier Details View */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Thông tin cơ bản
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Building2 className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Tên nhà cung cấp</p>
                      <p className="font-medium">{editingSupplier.TenNCC}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="w-5 h-5 text-gray-400 mr-3 text-sm font-medium">
                      #
                    </span>
                    <div>
                      <p className="text-sm text-gray-500">Mã nhà cung cấp</p>
                      <p className="font-medium">{editingSupplier.MaNCC}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Liên hệ
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Điện thoại</p>
                      <p className="font-medium">
                        {editingSupplier.SDT || "Chưa cập nhật"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">
                        {editingSupplier.Email || "Chưa cập nhật"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Địa chỉ</p>
                      <p className="font-medium">
                        {editingSupplier.DiaChi || "Chưa cập nhật"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Đóng
              </Button>
              <Button onClick={() => setViewMode("form")}>Chỉnh sửa</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Form Fields */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Thông tin nhà cung cấp
              </h3>
              <div className="space-y-4">
                <div>
                  <Label>Tên nhà cung cấp *</Label>
                  <Input
                    className="outline-none"
                    value={formData.TenNCC}
                    onChange={(e) =>
                      setFormData({ ...formData, TenNCC: e.target.value })
                    }
                    placeholder="Nhập tên nhà cung cấp"
                    required
                  />
                </div>

                <div>
                  <Label>Địa chỉ</Label>
                  <Input
                    className="outline-none"
                    value={formData.DiaChi}
                    onChange={(e) =>
                      setFormData({ ...formData, DiaChi: e.target.value })
                    }
                    placeholder="Nhập địa chỉ"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Số điện thoại</Label>
                    <Input
                      className="outline-none"
                      type="tel"
                      value={formData.SDT}
                      onChange={(e) =>
                        setFormData({ ...formData, SDT: e.target.value })
                      }
                      placeholder="Nhập số điện thoại"
                    />
                  </div>

                  <div>
                    <Label>Email</Label>
                    <Input
                      className="outline-none"
                      type="email"
                      value={formData.Email}
                      onChange={(e) =>
                        setFormData({ ...formData, Email: e.target.value })
                      }
                      placeholder="Nhập email"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit">
                {editingSupplier ? "Cập nhật" : "Thêm mới"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <div className="mb-4 text-base">
              Bạn có chắc chắn muốn xóa nhà cung cấp
            </div>
            <div className="mb-4 text-lg font-semibold text-red-600">
              {supplierToDelete?.TenNCC}
            </div>
            <div className="text-sm text-gray-500 mb-6">
              Hành động này không thể hoàn tác!
            </div>
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmOpen(false)}
              >
                Hủy
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Xóa
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupplierManagement;
