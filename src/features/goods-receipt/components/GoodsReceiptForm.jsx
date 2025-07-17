import { useState, useEffect, useRef } from "react";
import toast from 'react-hot-toast';
import * as XLSX from "xlsx";
import { 
  getAvailablePurchaseOrders, 
  getPurchaseOrderForReceipt,
  createGoodsReceipt 
} from "../services/goodsReceiptService";
import { getCurrentEmployee } from "../../../services/commonService";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs";
import {
  Plus,
  Save,
  Upload,
  Download,
  FileSpreadsheet,
  Edit,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

const GoodsReceiptForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    SoPN: "",
    NgayNhap: new Date().toISOString().split('T')[0],
    MaPDH: "",
    MaNV: null,
    details: []
  });

  const [availablePOs, setAvailablePOs] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [inputMethod, setInputMethod] = useState("manual");
  const [excelData, setExcelData] = useState([]);
  const [excelError, setExcelError] = useState("");
  const fileInputRef = useRef(null);

  // Load dữ liệu cần thiết
  useEffect(() => {
    const loadData = async () => {
      try {
        const [posData, employeeData] = await Promise.all([
          getAvailablePurchaseOrders(),
          getCurrentEmployee()
        ]);

        setAvailablePOs(posData);
        setCurrentEmployee(employeeData);
        
        // Tự động generate số phiếu nhập
        const now = new Date();
        const timestamp = now.getFullYear().toString() + 
                         (now.getMonth() + 1).toString().padStart(2, '0') + 
                         now.getDate().toString().padStart(2, '0') + 
                         now.getHours().toString().padStart(2, '0') + 
                         now.getMinutes().toString().padStart(2, '0');
        const soPN = `PN${timestamp}`;

        setFormData(prev => ({
          ...prev,
          SoPN: soPN,
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

  // Xử lý khi chọn phiếu đặt hàng
  const handlePurchaseOrderSelect = async (maPDH) => {
    if (!maPDH) {
      setSelectedPO(null);
      setFormData(prev => ({ ...prev, MaPDH: "", details: [] }));
      return;
    }

    try {
      const poData = await getPurchaseOrderForReceipt(maPDH);
      setSelectedPO(poData);
      
      if (inputMethod === "manual") {
        // Tạo details dựa trên phiếu đặt hàng - chỉ lưu những field có trong database
        const details = poData.details.map(item => ({
          MaCTSP: item.MaCTSP,
          TenSP: item.TenSP,
          TenMau: item.TenMau,
          TenKichThuoc: item.TenKichThuoc,
          SoLuongDat: item.SoLuong,
          SoLuong: item.SoLuong, // Số lượng nhập thực tế
          DonGia: item.DonGia,
          ThanhTien: item.SoLuong * item.DonGia
        }));

        setFormData(prev => ({
          ...prev,
          MaPDH: maPDH,
          details: details
        }));
      } else {
        // For Excel mode, just set the PO without initializing items
        setFormData(prev => ({
          ...prev,
          MaPDH: maPDH,
        }));
      }
    } catch (error) {
      console.error("Lỗi khi lấy thông tin phiếu đặt hàng:", error);
      toast.error("Có lỗi xảy ra khi lấy thông tin phiếu đặt hàng!");
    }
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

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  // Xử lý Excel upload
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Validate and process Excel data
        if (jsonData.length < 2) {
          setExcelError("File Excel phải có ít nhất 2 dòng (header + data)");
          return;
        }

        const headers = jsonData[0];
        const expectedHeaders = ['MaCTSP', 'SoLuong', 'DonGia'];
        
        if (!expectedHeaders.every(header => headers.includes(header))) {
          setExcelError("File Excel phải có các cột: MaCTSP, SoLuong, DonGia");
          return;
        }

        const processedData = jsonData.slice(1).map(row => {
          const item = {};
          headers.forEach((header, index) => {
            item[header] = row[index];
          });
          return item;
        }).filter(item => item.MaCTSP && item.SoLuong && item.DonGia);

        // Map Excel data to form format
        const details = processedData.map(item => {
          const poItem = selectedPO?.details.find(p => p.MaCTSP === parseInt(item.MaCTSP));
          return {
            MaCTSP: parseInt(item.MaCTSP),
            TenSP: poItem?.TenSP || "Không tìm thấy",
            TenMau: poItem?.TenMau || "",
            TenKichThuoc: poItem?.TenKichThuoc || "",
            SoLuongDat: poItem?.SoLuong || 0,
            SoLuong: parseInt(item.SoLuong) || 0,
            DonGia: parseFloat(item.DonGia) || 0,
            ThanhTien: (parseInt(item.SoLuong) || 0) * (parseFloat(item.DonGia) || 0)
          };
        });

        setFormData(prev => ({
          ...prev,
          details: details
        }));
        setExcelData(processedData);
        setExcelError("");
      } catch (error) {
        setExcelError("Lỗi khi đọc file Excel. Vui lòng kiểm tra định dạng file.");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Download Excel template
  const downloadTemplate = () => {
    const template = [
      ['MaCTSP', 'SoLuong', 'DonGia'],
      ['1', '10', '50000'],
      ['2', '5', '75000']
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(template);
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'goods_receipt_template.xlsx');
  };

  // Xử lý submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.MaPDH) {
      toast.error("Vui lòng chọn phiếu đặt hàng!");
      return;
    }

    if (formData.details.length === 0) {
      toast.error("Không có sản phẩm để nhập!");
      return;
    }

    setSubmitting(true);
    try {
      // Chỉ gửi những field có trong database schema
      const receiptData = {
        SoPN: formData.SoPN,
        NgayNhap: formData.NgayNhap,
        MaPDH: formData.MaPDH,
        MaNV: formData.MaNV,
        details: formData.details.map(item => ({
          MaCTSP: item.MaCTSP,
          SoLuong: parseInt(item.SoLuong),
          DonGia: parseFloat(item.DonGia)
        }))
      };

      await createGoodsReceipt(receiptData);
      toast.success("Tạo phiếu nhập hàng thành công!");
      
      // Reset form
      setFormData({
        SoPN: "",
        NgayNhap: new Date().toISOString().split('T')[0],
        MaPDH: "",
        MaNV: currentEmployee?.MaNV || null,
        details: []
      });
      setSelectedPO(null);
      setExcelData([]);
      setExcelError("");
      setInputMethod("manual");

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Lỗi khi tạo phiếu nhập hàng:", error);
      toast.error("Có lỗi xảy ra khi tạo phiếu nhập hàng!");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Tạo Phiếu Nhập Hàng</h1>
        <p className="text-gray-600">Nhập hàng từ phiếu đặt hàng nhà cung cấp</p>
      </div>

      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Thông tin phiếu nhập */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin phiếu nhập</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="soPN">Số phiếu nhập</Label>
                  <Input
                    id="soPN"
                    value={formData.SoPN}
                    onChange={(e) => setFormData(prev => ({ ...prev, SoPN: e.target.value }))}
                    placeholder="Nhập số phiếu nhập"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ngayNhap">Ngày nhập</Label>
                  <Input
                    id="ngayNhap"
                    type="date"
                    value={formData.NgayNhap}
                    onChange={(e) => setFormData(prev => ({ ...prev, NgayNhap: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maPDH">Phiếu đặt hàng</Label>
                  <Select value={formData.MaPDH} onValueChange={handlePurchaseOrderSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn phiếu đặt hàng" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePOs.map(po => (
                        <SelectItem key={po.MaPDH} value={po.MaPDH}>
                          {po.MaPDH} - {po.TenNCC} ({po.NgayDat})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nhanVien">Nhân viên nhập</Label>
                  <Input
                    id="nhanVien"
                    value={currentEmployee?.TenNV || ""}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danh sách sản phẩm */}
          <Card>
            <CardHeader>
              <CardTitle>Danh sách sản phẩm nhập</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={inputMethod} onValueChange={setInputMethod}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual">Nhập thủ công</TabsTrigger>
                  <TabsTrigger value="excel">Import Excel</TabsTrigger>
                </TabsList>
                
                <TabsContent value="manual" className="space-y-4">
                  {formData.details.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                      <p>Chưa có sản phẩm nào. Vui lòng chọn phiếu đặt hàng.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Sản phẩm</TableHead>
                            <TableHead>SL Đặt</TableHead>
                            <TableHead>SL Nhập</TableHead>
                            <TableHead>Đơn giá</TableHead>
                            <TableHead>Thành tiền</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.details.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                <div>{item.TenSP}</div>
                                <div className="text-sm text-gray-600">
                                  {item.TenMau} - {item.TenKichThuoc}
                                </div>
                              </TableCell>
                              <TableCell>{item.SoLuongDat}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  max={item.SoLuongDat}
                                  value={item.SoLuong}
                                  onChange={(e) => updateProduct(index, 'SoLuong', e.target.value)}
                                  className="w-20"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.DonGia}
                                  onChange={(e) => updateProduct(index, 'DonGia', e.target.value)}
                                  className="w-28"
                                />
                              </TableCell>
                              <TableCell className="font-medium">
                                {formatPrice(item.ThanhTien)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          Tổng Tiền: {formatPrice(calculateTotal())}
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="excel" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Import dữ liệu từ Excel</CardTitle>
                      <CardDescription>
                        Tải file Excel với cấu trúc: MaCTSP, SoLuong, DonGia
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={downloadTemplate}
                            className="flex items-center gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download Template
                          </Button>
                          <input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleExcelUpload}
                            className="hidden"
                            ref={fileInputRef}
                          />
                          <Button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2"
                          >
                            <Upload className="h-4 w-4" />
                            Upload File Excel
                          </Button>
                        </div>

                        {excelError && (
                          <div className="text-sm text-red-600 bg-red-50 p-3 rounded border">
                            {excelError}
                          </div>
                        )}

                        {excelData.length > 0 && (
                          <div className="text-sm text-green-600 bg-green-50 p-3 rounded border">
                            ✓ Đã import thành công {excelData.length} dòng dữ liệu từ Excel
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Preview Excel Data */}
                  {formData.details.length > 0 && (
                    <div className="mt-4">
                      <Label>Xem trước dữ liệu từ Excel</Label>
                      <Card>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Sản phẩm</TableHead>
                              <TableHead>SL Đặt</TableHead>
                              <TableHead>SL Nhập</TableHead>
                              <TableHead>Đơn giá</TableHead>
                              <TableHead>Thành tiền</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {formData.details.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">
                                  <div>{item.TenSP}</div>
                                  <div className="text-sm text-gray-600">
                                    {item.TenMau} - {item.TenKichThuoc}
                                  </div>
                                </TableCell>
                                <TableCell>{item.SoLuongDat}</TableCell>
                                <TableCell className="font-medium">
                                  {item.SoLuong}
                                </TableCell>
                                <TableCell>
                                  {formatPrice(item.DonGia)}
                                </TableCell>
                                <TableCell>
                                  {formatPrice(item.ThanhTien)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <div className="p-4 text-right border-t">
                          <div className="text-lg font-bold">
                            Tổng Tiền: {formatPrice(calculateTotal())}
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={submitting || formData.details.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {submitting ? "Đang tạo..." : "Tạo Phiếu Nhập"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoodsReceiptForm; 