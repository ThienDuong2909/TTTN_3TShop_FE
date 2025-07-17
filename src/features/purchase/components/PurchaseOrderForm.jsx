import { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import { 
  getSuppliers, 
  getProductDetails, 
  createPurchaseOrder, 
  getPurchaseOrderStatuses 
} from "../services/purchaseService";
import { getCurrentEmployee } from "../../../services/commonService";

const PurchaseOrderForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    MaPDH: "",
    NgayDat: new Date().toISOString().split('T')[0],
    MaNV: null,
    MaNCC: "",
    MaTrangThai: 1, // Mặc định là trạng thái đầu tiên
    details: []
  });

  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load dữ liệu cần thiết
  useEffect(() => {
    const loadData = async () => {
      try {
        const [suppliersData, productsData, statusesData, employeeData] = await Promise.all([
          getSuppliers(),
          getProductDetails(),
          getPurchaseOrderStatuses(),
          getCurrentEmployee()
        ]);

        setSuppliers(suppliersData);
        setProducts(productsData);
        setStatuses(statusesData);
        setCurrentEmployee(employeeData);
        
        // Tự động generate mã phiếu đặt hàng
        const now = new Date();
        const timestamp = now.getFullYear().toString() + 
                         (now.getMonth() + 1).toString().padStart(2, '0') + 
                         now.getDate().toString().padStart(2, '0') + 
                         now.getHours().toString().padStart(2, '0') + 
                         now.getMinutes().toString().padStart(2, '0');
        const maPDH = `PDH${timestamp}`;

        setFormData(prev => ({
          ...prev,
          MaPDH: maPDH,
          MaNV: employeeData.MaNV
        }));
      } catch (error) {
        console.error("Lỗi khi load dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter sản phẩm theo nhà cung cấp
  const filteredProducts = products.filter(product => 
    formData.MaNCC === "" || product.MaNCC === parseInt(formData.MaNCC)
  );

  // Thêm sản phẩm vào danh sách
  const addProduct = () => {
    setFormData(prev => ({
      ...prev,
      details: [...prev.details, {
        MaCTSP: "",
        SoLuong: 1,
        DonGia: 0,
        ThanhTien: 0
      }]
    }));
  };

  // Xóa sản phẩm khỏi danh sách
  const removeProduct = (index) => {
    setFormData(prev => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== index)
    }));
  };

  // Cập nhật thông tin sản phẩm
  const updateProduct = (index, field, value) => {
    const newDetails = [...formData.details];
    newDetails[index][field] = value;
    
    // Tự động tính thành tiền
    if (field === 'SoLuong' || field === 'DonGia') {
      const soLuong = field === 'SoLuong' ? parseInt(value) || 0 : newDetails[index].SoLuong;
      const donGia = field === 'DonGia' ? parseFloat(value) || 0 : newDetails[index].DonGia;
      newDetails[index].ThanhTien = soLuong * donGia;
    }

    setFormData(prev => ({
      ...prev,
      details: newDetails
    }));
  };

  // Tính tổng tiền
  const calculateTotal = () => {
    return formData.details.reduce((total, item) => total + (item.ThanhTien || 0), 0);
  };

  // Xử lý submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.details.length === 0) {
      toast.error("Vui lòng thêm ít nhất một sản phẩm!");
      return;
    }

    setSubmitting(true);
    try {
      // Đảm bảo dữ liệu khớp với database schema
      const orderData = {
        MaPDH: formData.MaPDH,
        NgayDat: formData.NgayDat,
        MaNV: parseInt(formData.MaNV),
        MaNCC: parseInt(formData.MaNCC),
        MaTrangThai: parseInt(formData.MaTrangThai),
        details: formData.details.map(item => ({
          MaCTSP: parseInt(item.MaCTSP),
          SoLuong: parseInt(item.SoLuong),
          DonGia: parseFloat(item.DonGia)
        }))
      };

      await createPurchaseOrder(orderData);
      toast.success("Tạo phiếu đặt hàng thành công!");
      
      // Reset form
      const now = new Date();
      const timestamp = now.getFullYear().toString() + 
                       (now.getMonth() + 1).toString().padStart(2, '0') + 
                       now.getDate().toString().padStart(2, '0') + 
                       now.getHours().toString().padStart(2, '0') + 
                       now.getMinutes().toString().padStart(2, '0');
      const newMaPDH = `PDH${timestamp}`;

      setFormData({
        MaPDH: newMaPDH,
        NgayDat: new Date().toISOString().split('T')[0],
        MaNV: currentEmployee?.MaNV || null,
        MaNCC: "",
        MaTrangThai: 1,
        details: []
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Lỗi khi tạo phiếu đặt hàng:", error);
      toast.error("Có lỗi xảy ra khi tạo phiếu đặt hàng!");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Đang tải...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Tạo Phiếu Đặt Hàng</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Thông tin chung */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mã Phiếu Đặt Hàng
            </label>
            <input
              type="text"
              value={formData.MaPDH}
              onChange={(e) => setFormData(prev => ({ ...prev, MaPDH: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ngày Đặt
            </label>
            <input
              type="date"
              value={formData.NgayDat}
              onChange={(e) => setFormData(prev => ({ ...prev, NgayDat: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nhân Viên
            </label>
            <input
              type="text"
              value={currentEmployee?.TenNV || ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nhà Cung Cấp
            </label>
            <select
              value={formData.MaNCC}
              onChange={(e) => setFormData(prev => ({ ...prev, MaNCC: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Chọn nhà cung cấp</option>
              {suppliers.map(supplier => (
                <option key={supplier.MaNCC} value={supplier.MaNCC}>
                  {supplier.TenNCC}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng Thái
            </label>
            <select
              value={formData.MaTrangThai}
              onChange={(e) => setFormData(prev => ({ ...prev, MaTrangThai: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {statuses.map(status => (
                <option key={status.MaTrangThai} value={status.MaTrangThai}>
                  {status.TenTrangThai}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Danh sách sản phẩm */}
        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Danh Sách Sản Phẩm</h3>
            <button
              type="button"
              onClick={addProduct}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Thêm Sản Phẩm
            </button>
          </div>

          {formData.details.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Chưa có sản phẩm nào. Nhấn "Thêm Sản Phẩm" để bắt đầu.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-2 text-left">Sản Phẩm</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Số Lượng</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Đơn Giá</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Thành Tiền</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.details.map((item, index) => (
                    <tr key={index}>
                      <td className="border border-gray-200 px-4 py-2">
                        <select
                          value={item.MaCTSP}
                          onChange={(e) => updateProduct(index, 'MaCTSP', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          required
                        >
                          <option value="">Chọn sản phẩm</option>
                          {filteredProducts.map(product => (
                            <option key={product.MaCTSP} value={product.MaCTSP}>
                              {product.TenSP} - {product.TenMau} - {product.TenKichThuoc}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        <input
                          type="number"
                          min="1"
                          value={item.SoLuong}
                          onChange={(e) => updateProduct(index, 'SoLuong', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          required
                        />
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.DonGia}
                          onChange={(e) => updateProduct(index, 'DonGia', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          required
                        />
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        <span className="font-medium">
                          {item.ThanhTien.toLocaleString()}₫
                        </span>
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        <button
                          type="button"
                          onClick={() => removeProduct(index)}
                          className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-500"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tổng tiền */}
          {formData.details.length > 0 && (
            <div className="mt-4 text-right">
              <span className="text-lg font-semibold text-gray-800">
                Tổng Tiền: {calculateTotal().toLocaleString()}₫
              </span>
            </div>
          )}
        </div>

        {/* Nút submit */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            {submitting ? "Đang tạo..." : "Tạo Phiếu Đặt Hàng"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PurchaseOrderForm; 