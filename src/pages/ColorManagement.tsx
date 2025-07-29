import React, { useEffect, useState } from "react";
import { DataTable, Column } from "../components/ui/DataTable";
import { Modal } from "../components/ui/Modal";
import axios from "axios";
import { toast, Toaster } from "sonner";

interface Color {
  MaMau: number;
  TenMau: string;
  MaHex: string;
  NgayTao: string;
  TrangThai: boolean;
}

export const ColorManagement = () => {
  const [colors, setColors] = useState<Color[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<Color | null>(null);
  const [formData, setFormData] = useState({
    TenMau: "",
    MaHex: "#000000",
    TrangThai: true,
  });

  // Fetch colors from BE
  const fetchColors = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/colors");
      if (res.data.success) {
        // Chuẩn hóa dữ liệu: đảm bảo TenMau là string
        const normalized = res.data.data.map((item: any) => {
          // Chuẩn hóa MaHex: nếu không bắt đầu bằng #, thêm vào
          let hex = item.MaHex;
          if (typeof hex === 'string' && !hex.startsWith('#')) {
            hex = `#${hex}`;
          }
          return {
            ...item,
            TenMau: typeof item.TenMau === 'string' ? item.TenMau : String(item.TenMau),
            MaHex: hex
          };
        });
        console.log("Colors fetched successfully:", normalized);
        setColors(normalized);
      }
    } catch (error) {
      toast.error("Lỗi khi tải danh sách màu:" + error);
    }
  };

  useEffect(() => {
    fetchColors();
  }, []);

  const handleAdd = () => {
    setEditingColor(null);
    setFormData({ TenMau: "", MaHex: "#FFFFFF", TrangThai: true });
    setIsModalOpen(true);
  };

  const handleEdit = (color: Color) => {
    setEditingColor(color);
    setFormData({ TenMau: color.TenMau, MaHex: color.MaHex, TrangThai: color.TrangThai });
    setIsModalOpen(true);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      NgayTao: new Date().toISOString(),
    };

    try {
      if (editingColor) {
        let response;
        response = await axios.put(`http://localhost:8080/api/colors/${editingColor.MaMau}`, payload);
        if (response && response.status === 200) {
          toast.success("Cập nhật màu thành công");
        } else {
          toast.error("Lỗi khi cập nhật màu");
        }
      } else {
        let response;
        response = await axios.post("http://localhost:8080/api/colors", payload);
        if (response && response.status === 201) {
          toast.success("Thêm màu thành công");
        } else {
          toast.error("Lỗi khi thêm màu");
        }
      }
      setIsModalOpen(false);
      fetchColors();
    } catch (error) {
      toast.error("Lỗi khi thêm/sửa màu");
    }
  };

  const columns: Column[] = [
    {
      key: "MaMau",
      title: "ID",
      dataIndex: "MaMau",
      render: (value) => <span className="text-xs bg-gray-100 px-2 py-1 rounded">{value}</span>,
    },
    {
      key: "color",
      title: "Màu sắc",
      dataIndex: "MaHex",
      render: (value) => {
        // Chỉ hiển thị preview màu
        const hex = typeof value === 'string' && value.startsWith('#') ? value : `#${value || 'EEEEEE'}`;
        return (
          <span
            style={{ backgroundColor: hex, width: 24, height: 24, borderRadius: 6, border: '1px solid #ccc', display: 'inline-block' }}
            title={hex}
          />
        );
      }
    },
    {
      key: "TenMau",
      title: "Tên màu",
      dataIndex: "TenMau",
      render: (value, record) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">{value}</span>
          <span className="text-xs text-gray-500 font-mono">{record.MaHex}</span>
        </div>
      ),
    },
    {
      key: "TrangThai",
      title: "Trạng thái",
      dataIndex: "TrangThai",
      render: (value) => (
          <button
              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
          >
            {value ? "Đang sử dụng" : "Ngừng sử dụng"}
          </button>
      ),
    },
    {
      key: "NgayTao",
      title: "Ngày tạo",
      dataIndex: "NgayTao",
      render: (value) => {
        return (
          <span className="text-xs text-gray-600">
            {formatDate(value)}
          </span>
        );
      }
    },
  ];

  // Lọc dữ liệu theo trạng thái
  const filteredColors = colors.filter(color => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return color.TrangThai === true;
    if (filterStatus === 'inactive') return color.TrangThai === false;
    return true;
  });

  return (
    <>
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <DataTable
          title="Quản lý màu sắc sản phẩm"
          columns={columns}
          data={filteredColors}
          onAdd={handleAdd}
          onEdit={handleEdit}
          addButtonText="Thêm màu sắc"
          searchPlaceholder="Tìm kiếm màu sắc..."
          filterComponent={
            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span className="font-medium text-gray-700 mr-2 text-sm">Lọc theo trạng thái:</span>
              <button
                className={`px-3 py-1 rounded-lg font-semibold text-xs transition-colors duration-450 shadow-sm border ${filterStatus === 'all' ? 'bg-[#8B5C2A] text-white border-[#8B5C2A]' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-[#f3e7db]'} `}
                onClick={() => setFilterStatus('all')}
              >Tất cả</button>
              <button
                className={`px-3 py-1 rounded-lg font-semibold text-xs transition-colors duration-450 shadow-sm border ${filterStatus === 'active' ? 'bg-[#8B5C2A] text-white border-[#8B5C2A]' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-[#f3e7db]'} `}
                onClick={() => setFilterStatus('active')}
              >Đang sử dụng</button>
              <button
                className={`px-3 py-1 rounded-lg font-semibold text-xs transition-colors duration-450 shadow-sm border ${filterStatus === 'inactive' ? 'bg-[#8B5C2A] text-white border-[#8B5C2A]' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-[#f3e7db]'} `}
                onClick={() => setFilterStatus('inactive')}
              >Ngừng sử dụng</button>
            </div>
          }
        />
      </div>

      <Toaster position="top-center" richColors />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingColor ? "Sửa màu sắc" : "Thêm màu sắc mới"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên màu sắc *</label>
            <input
              type="text"
              value={formData.TenMau}
              onChange={(e) => setFormData({ ...formData, TenMau: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mã màu (Hex) *</label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={formData.MaHex}
                onChange={(e) => setFormData({ ...formData, MaHex: e.target.value })}
                className="h-10 w-16 border border-gray-300 rounded-lg cursor-pointer shadow-sm"
              />
              <input
                type="text"
                value={formData.MaHex}
                onChange={(e) => setFormData({ ...formData, MaHex: e.target.value })}
                pattern="^#[0-9A-Fa-f]{6}$"
                placeholder="#000000"
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="TrangThai"
              checked={formData.TrangThai}
              onChange={(e) => setFormData({ ...formData, TrangThai: e.target.checked })}
              className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 focus:ring-2"
            />
            <label htmlFor="TrangThai" className="ml-2 text-sm text-gray-700">
              Sử dụng màu này
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg border border-gray-300 hover:bg-gray-200 transition-colors duration-150">
              Hủy
            </button>
            <button type="submit" className="px-4 py-2 text-sm text-white bg-[#8B5C2A] rounded-lg hover:bg-[#8B5C2A] transition-colors duration-500 font-semibold shadow-sm">
              {editingColor ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default ColorManagement;
