import React, { useState } from "react";
import { DataTable, Column } from "../components/ui/DataTable";
import { Modal } from "../components/ui/Modal";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Users,
  CheckCircle,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { toast } from "sonner";

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

  // Fetch suppliers from API
  React.useEffect(() => {
    const fetchSuppliers = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:8080/api/suppliers?page=1");
        const data = await res.json();
        if (data.success && data.data && Array.isArray(data.data.data)) {
          setSuppliers(data.data.data);
        } else {
          setSuppliers([]);
        }
      } catch (err) {
        setSuppliers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSuppliers();
  }, []);

  const handleAdd = () => {
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

  const handleView = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setViewMode("details");
    setIsModalOpen(true);
  };

  const handleDelete = (supplier: Supplier) => {
    if (
      window.confirm(
        `Bạn có chắc chắn muốn xóa nhà cung cấp "${supplier.TenNCC}"?`,
      )
    ) {
      setSuppliers((prev) => prev.filter((s) => s.MaNCC !== supplier.MaNCC));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingSupplier) {
      // Update existing supplier via API
      try {
        const res = await fetch(`http://localhost:8080/api/suppliers/${editingSupplier.MaNCC}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            TenNCC: formData.TenNCC,
            DiaChi: formData.DiaChi,
            SDT: formData.SDT,
            Email: formData.Email,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          toast.success("Cập nhật thông tin nhà cung cấp thành công");
          setSuppliers((prev) =>
            prev.map((s) =>
              s.MaNCC === editingSupplier.MaNCC
                ? { ...s, ...formData }
                : s
            )
          );
        } else {
          toast.error("Cập nhật thông tin nhà cung cấp thất bại!");
        }
      } catch (err) {
        toast.error("Có lỗi khi cập nhật nhà cung cấp!");
      }
    } else {
      // Add new supplier via API
      try {
        const res = await fetch("http://localhost:8080/api/suppliers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            TenNCC: formData.TenNCC,
            DiaChi: formData.DiaChi,
            SDT: formData.SDT,
            Email: formData.Email,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success && data.data) {
          toast.success("Thêm nhà cung cấp thành công");
          setSuppliers((prev) => [...prev, data.data]);
        } else {
          toast.error("Thêm nhà cung cấp thất bại!");
        }
      } catch (err) {
        toast.error("Có lỗi khi thêm nhà cung cấp!");
      }
    }

    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  const generateSupplierId = () => {
    const maxId = Math.max(...suppliers.map((s) => s.MaNCC), 0);
    return maxId + 1;
  };

  const columns: Column[] = [
    {
      key: "info",
      title: "Thông tin nhà cung cấp",
      dataIndex: "TenNCC",
      sortable: true,
      render: (value, record) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-12 w-12">
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">Mã NCC: {record.MaNCC}</div>
          </div>
        </div>
      ),
    },
    {
      key: "address",
      title: "Địa chỉ",
      dataIndex: "DiaChi",
      render: (value) => (
        <div className="flex items-center text-sm">
          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
          {value || "Chưa cập nhật"}
        </div>
      ),
    },
    {
      key: "contact",
      title: "Liên hệ",
      dataIndex: "SDT",
      render: (value, record) => (
        <div className="space-y-1">
          <div className="flex items-center text-sm">
            <Phone className="w-4 h-4 mr-2 text-gray-400" />
            {value || "Chưa cập nhật"}
          </div>
          <div className="flex items-center text-sm">
            <Mail className="w-4 h-4 mr-2 text-gray-400" />
            {record.Email || "Chưa cập nhật"}
          </div>
        </div>
      ),
    },
  ];

  // Calculate statistics
  const stats = {
    total: suppliers.length,
    withPhone: suppliers.filter((s) => s.SDT).length,
    withEmail: suppliers.filter((s) => s.Email).length,
    withAddress: suppliers.filter((s) => s.DiaChi).length,
  };

  // Filtered suppliers by search
  const filteredSuppliers = suppliers.filter(sup =>
    sup.TenNCC.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3 text-[13px]">
        <Card className="shadow-none border border-[#825B32]/20">
          <CardContent className="py-1.5 px-2 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-[#825B32]" />
            <div>
              <p className="text-[11px] font-medium text-gray-500">Tổng nhà cung cấp</p>
              <p className="text-[15px] font-bold text-gray-900">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-none border border-[#825B32]/20">
          <CardContent className="py-1.5 px-2 flex items-center gap-2">
            <Phone className="h-6 w-6 text-[#825B32]" />
            <div>
              <p className="text-[11px] font-medium text-gray-500">Có số điện thoại</p>
              <p className="text-[15px] font-bold text-gray-900">{stats.withPhone}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-none border border-[#825B32]/20">
          <CardContent className="py-1.5 px-2 flex items-center gap-2">
            <Mail className="h-6 w-6 text-[#825B32]" />
            <div>
              <p className="text-[11px] font-medium text-gray-500">Có email</p>
              <p className="text-[15px] font-bold text-gray-900">{stats.withEmail}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-none border border-[#825B32]/20">
          <CardContent className="py-1.5 px-2 flex items-center gap-2">
            <MapPin className="h-6 w-6 text-[#825B32]" />
            <div>
              <p className="text-[11px] font-medium text-gray-500">Có địa chỉ</p>
              <p className="text-[15px] font-bold text-gray-900">{stats.withAddress}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="w-full mb-2 text-[13px]">
        <CardHeader className="pb-1 px-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-[15px] text-[#825B32]">Danh sách nhà cung cấp ({filteredSuppliers.length})</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                className="text-xs px-2 py-1 h-8 w-56 border-[#825B32] focus:ring-1 focus:ring-[#825B32] outline-none"
                placeholder="Tìm kiếm theo tên nhà cung cấp..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <Button
                className="bg-[#825B32] text-white text-xs px-3 h-8"
                onClick={handleAdd}
              >
                Thêm nhà cung cấp
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-1 pt-1">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="bg-[#825B32]/10">
                  <th className="text-xs font-semibold py-2 px-3 text-left w-[30%]">Thông tin nhà cung cấp</th>
                  <th className="text-xs font-semibold py-2 px-3 text-left w-[30%]">Địa chỉ</th>
                  <th className="text-xs font-semibold py-2 px-3 text-left w-[25%]">Liên hệ</th>
                  <th className="text-xs font-semibold py-2 px-3 text-center w-[15%]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-sm text-gray-500">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-sm text-gray-500">
                      Không có nhà cung cấp nào.
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <tr
                      key={supplier.MaNCC}
                      className="border-b hover:bg-[#825B32]/5 transition-colors text-[12px]"
                      style={{ height: 68 }}
                    >
                      <td className="py-4 px-2 align-middle">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 h-8 w-8 rounded bg-blue-100 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="font-medium text-xs truncate">{supplier.TenNCC}</div>
                            <div className="text-[11px] text-gray-500">Mã NCC: {supplier.MaNCC}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-xs align-middle">
                        <div className="flex items-center">
                          <MapPin className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                          <span>{supplier.DiaChi || "Chưa cập nhật"}</span>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-xs align-middle">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center">
                            <Phone className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                            <span>{supplier.SDT || "Chưa cập nhật"}</span>
                          </div>
                          <div className="flex items-center">
                            <Mail className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                            <span>{supplier.Email || "Chưa cập nhật"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-center align-middle">
                        <div className="flex gap-1 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 p-0 border-[#825B32] text-[#825B32] hover:bg-[#825B32] hover:text-white"
                            title="Chỉnh sửa nhà cung cấp"
                            onClick={() => handleEdit(supplier)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13h3l8-8a2.828 2.828 0 10-4-4l-8 8v3zm0 0v3h3" /></svg>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 p-0 border-[#825B32] text-[#825B32] hover:bg-[#825B32] hover:text-white"
                            title="Xóa nhà cung cấp"
                            onClick={() => handleDelete(supplier)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </Button>
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
                      <p className="font-medium">{editingSupplier.SDT || "Chưa cập nhật"}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{editingSupplier.Email || "Chưa cập nhật"}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Địa chỉ</p>
                      <p className="font-medium">{editingSupplier.DiaChi || "Chưa cập nhật"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Đóng
              </Button>
              <Button onClick={() => setViewMode("form")}>
                Chỉnh sửa
              </Button>
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
    </>
  );
};

export default SupplierManagement;
