import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Edit3,
  Package,
  Eye,
  Plus,
  Minus,
  History,
  TrendingUp,
  Palette,
  Camera,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Separator } from "../components/ui/separator";

// API interfaces
interface ApiProductVariant {
  MaCTSP: number;
  MaSP: number;
  MaKichThuoc: number;
  MaMau: number;
  SoLuongTon: number;
  KichThuoc: {
    MaKichThuoc: number;
    TenKichThuoc: string;
  };
  Mau: {
    MaMau: number;
    TenMau: string;
    MaHex: string;
    NgayTao: string;
    TrangThai: boolean;
  };
}

interface ApiProductImage {
  MaAnh: number;
  MaSP: number;
  TenFile: string;
  DuongDan: string;
  AnhChinh: boolean;
  ThuTu: number;
  MoTa: string;
}

interface ApiProductDetail {
  MaSP: number;
  TenSP: string;
  MaLoaiSP: number;
  MaNCC: number;
  MoTa: string;
  TrangThai: boolean;
  NhaCungCap: {
    MaNCC: number;
    TenNCC: string;
    DiaChi: string;
    SDT: string;
    Email: string;
  };
  LoaiSP: {
    MaLoaiSP: number;
    TenLoai: string;
    NgayTao: string;
    HinhMinhHoa?: string;
  };
  AnhSanPhams: ApiProductImage[];
  ThayDoiGia: Array<{
    MaSP: number;
    NgayThayDoi: string;
    Gia: string;
    NgayApDung: string;
  }>;
  ChiTietSanPhams: ApiProductVariant[];
}

interface Size {
  MaKichThuoc: number;
  TenKichThuoc: string;
}

interface Color {
  MaMau: number;
  TenMau: string;
  MaHex: string;
  TrangThai: boolean;
}

// AddProductDetailDialog component
const AddProductDetailDialog: React.FC<{
  productId: number;
  onAdded: () => void;
}> = ({ productId, onAdded }) => {
  const [open, setOpen] = useState(false);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    
    // Fetch sizes
    fetch("http://localhost:8080/api/sizes")
      .then(res => res.json())
      .then(data => {
        if (data.success) setSizes(data.data);
      })
      .catch(console.error);

    // Fetch colors
    fetch("http://localhost:8080/api/colors")
      .then(res => res.json())
      .then(data => {
        if (data.success) setColors(data.data.filter((c: Color) => c.TrangThai));
      })
      .catch(console.error);
  }, [open]);

  const handleAdd = async () => {
    if (!selectedSize || !selectedColor || quantity < 1) return;
    
    setLoading(true);
    try {
      const body = {
        MaSP: productId,
        MaKichThuoc: selectedSize,
        MaMau: selectedColor,
        SoLuongTon: quantity,
      };
      
      const res = await fetch("http://localhost:8080/api/products/add-detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      const result = await res.json();
      
      if (result.success) {
        toast.success("Đã thêm biến thể sản phẩm thành công!");
        setOpen(false);
        setSelectedSize(null);
        setSelectedColor(null);
        setQuantity(1);
        onAdded();
      } else {
        toast.error(result.message || "Thêm biến th��� thất bại");
      }
    } catch (error) {
      console.error("Error adding product detail:", error);
      toast.error("Không thể kết nối đến server");
    }
    setLoading(false);
  };

  return (
    <>
      <Button className="bg-[#825B32] text-white" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4 mr-2" /> Thêm chi tiết sản phẩm
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm chi tiết sản phẩm</DialogTitle>
            <DialogDescription>
              Chọn size, màu sắc và nhập số lượng để thêm biến thể mới cho sản phẩm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-[#825B32] font-medium">Kích thước</Label>
              <select
                className="w-full mt-1 p-2 border rounded text-sm"
                value={selectedSize ?? ""}
                onChange={e => setSelectedSize(Number(e.target.value))}
              >
                <option value="">Chọn kích thước</option>
                {sizes.map(size => (
                  <option key={size.MaKichThuoc} value={size.MaKichThuoc}>
                    {size.TenKichThuoc}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-[#825B32] font-medium">Màu sắc</Label>
              <select
                className="w-full mt-1 p-2 border rounded text-sm"
                value={selectedColor ?? ""}
                onChange={e => setSelectedColor(Number(e.target.value))}
              >
                <option value="">Chọn màu sắc</option>
                {colors.map(color => (
                  <option key={color.MaMau} value={color.MaMau}>
                    {color.TenMau}
                  </option>
                ))}
              </select>
              {/* Color preview */}
              {selectedColor && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs">Mã màu:</span>
                  <span 
                    style={{ 
                      background: colors.find(c => c.MaMau === selectedColor)?.MaHex, 
                      width: 24, 
                      height: 24, 
                      borderRadius: 6, 
                      border: '1px solid #ccc', 
                      display: 'inline-block' 
                    }}
                  ></span>
                  <span className="text-xs">
                    {colors.find(c => c.MaMau === selectedColor)?.MaHex}
                  </span>
                </div>
              )}
            </div>
            <div>
              <Label className="text-[#825B32] font-medium">Số lượng</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                className="w-full mt-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Hủy
            </Button>
            <Button 
              className="bg-[#825B32] text-white" 
              onClick={handleAdd} 
              disabled={loading || !selectedSize || !selectedColor || quantity < 1}
            >
              <Save className="w-4 h-4 mr-2" /> Thêm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const AdminProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<ApiProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingVariants, setEditingVariants] = useState<{
    [key: string]: number;
  }>({});
  const [selectedImage, setSelectedImage] = useState(0);
  const [showStockHistory, setShowStockHistory] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPriceHistory, setShowPriceHistory] = useState(false);

  // Fetch product data from API
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8080/api/products/${id}`);
        const result = await response.json();
        
        if (result.success) {
          setProduct(result.data);
        } else {
          console.error("Error fetching product:", result.message);
          navigate("/admin/products");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        navigate("/admin/products");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate]);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  // Helper function to get latest price
  const getLatestPrice = (product: ApiProductDetail) => {
    if (!product.ThayDoiGia || product.ThayDoiGia.length === 0) {
      return null;
    }
    
    // Sort by NgayApDung descending to get the latest applicable price
    const sortedPrices = [...product.ThayDoiGia].sort((a, b) => 
      new Date(b.NgayApDung).getTime() - new Date(a.NgayApDung).getTime()
    );
    
    return sortedPrices[0];
  };

  // Helper function to format currency
  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(numAmount);
  };

  const getStockStatus = (variant: ApiProductVariant) => {
    const available = variant.SoLuongTon;
    const minStock = 10; // Default minimum stock

    if (available <= 0) {
      return {
        status: "out_of_stock",
        label: "Hết hàng",
        color: "bg-red-100 text-red-800",
      };
    } else if (available <= minStock) {
      return {
        status: "low_stock",
        label: "Sắp hết",
        color: "bg-yellow-100 text-yellow-800",
      };
    } else {
      return {
        status: "in_stock",
        label: "Còn hàng",
        color: "bg-green-100 text-green-800",
      };
    }
  };

  const handleQuantityChange = (variantId: string, newQuantity: number) => {
    if (newQuantity < 0) return;

    setEditingVariants((prev) => ({
      ...prev,
      [variantId]: newQuantity,
    }));
  };

  const confirmStockUpdate = async () => {
    if (!product) return;

    try {
      // Prepare data for API call
      const stockUpdates = Object.entries(editingVariants).map(([variantId, newQuantity]) => ({
        MaCTSP: parseInt(variantId),
        SoLuongTon: newQuantity,
      }));

      const response = await fetch('http://localhost:8080/api/products/update-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stockUpdates),
      });

      const result = await response.json();
      
      if (result.success) {
        // Refresh product data
        const productResponse = await fetch(`http://localhost:8080/api/products/${id}`);
        const productResult = await productResponse.json();
        
        if (productResult.success) {
          setProduct(productResult.data);
        }

        setEditingVariants({});
        setIsEditing(false);
        setShowConfirmModal(false);

        toast.success("Đã cập nhật số lượng tồn kho thành công!", {
          description: `Đã cập nhật ${stockUpdates.length} biến thể sản phẩm`,
          duration: 3000,
        });
      } else {
        toast.error("Có lỗi xảy ra khi cập nhật tồn kho!", {
          description: result.message || "Vui lòng thử lại sau",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error updating stock:", error);
      toast.error("Có lỗi xảy ra khi cập nhật tồn kho!", {
        description: "Không thể kết nối đến server, vui lòng thử lại sau",
        duration: 5000,
      });
    }
  };

  const cancelEditing = () => {
    setEditingVariants({});
    setIsEditing(false);
  };

  const refreshProductData = async () => {
    if (!id) return;
    
    try {
      const response = await fetch(`http://localhost:8080/api/products/${id}`);
      const result = await response.json();
      if (result.success) {
        setProduct(result.data);
      }
    } catch (error) {
      console.error("Error refreshing product data:", error);
    }
  };

  const stockChangeCount = Object.keys(editingVariants).length;
  const hasChanges = stockChangeCount > 0;

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#825B32] mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin sản phẩm...</p>
        </div>
      </div>
    );
  }

  // Product not found
  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy sản phẩm</h1>
          <p className="text-gray-600 mb-4">Sản phẩm không tồn tại hoặc đã bị xóa</p>
          <Button onClick={() => navigate("/admin/products")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  // Calculate totals from API data
  const totalQuantity = product.ChiTietSanPhams.reduce((sum, variant) => sum + variant.SoLuongTon, 0);


  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/admin/products")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {product.TenSP}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link to={`/product/${product.MaSP}`} target="_blank">
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              Xem trang sản phẩm
            </Button>
          </Link>
        </div>
      </div>

      {/* Product Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-[#825B32]" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Tổng tồn kho
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalQuantity}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-[#825B32]" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Giá bán</p>
                  {(() => {
                    const latestPrice = getLatestPrice(product);
                    return latestPrice ? (
                      <div>
                        <p className="text-xl font-bold text-[#825B32]">
                          {formatCurrency(latestPrice.Gia)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {product.ThayDoiGia.length} lần thay đổi
                        </p>
                      </div>
                    ) : (
                      <p className="text-lg font-bold text-gray-500">
                        Chưa có giá
                      </p>
                    );
                  })()}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPriceHistory(true)}
                className="text-[#825B32] border-[#825B32] hover:bg-[#825B32] hover:text-white"
              >
                <History className="w-4 h-4 mr-2" />
                Lịch sử
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Info & Images Side by Side */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Product Information */}
        <div className="flex-[2] min-w-[340px] space-y-6">
          {/* Basic Info */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#825B32]/5 to-[#825B32]/10 py-3">
              <CardTitle className="flex items-center text-[#825B32] text-base">
                <Package className="w-4 h-4 mr-2" />
                Thông tin sản phẩm
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Product Name & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-gray-800 flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#825B32] mr-2"></div>
                    Tên sản phẩm
                  </h3>
                  <div className="bg-gradient-to-br from-[#825B32]/5 to-[#825B32]/10 rounded-lg p-3 border border-[#825B32]/20">
                    <p className="font-bold text-base text-gray-800 leading-tight">{product.TenSP}</p>
                    <p className="text-xs text-gray-600 mt-1">#{product.MaSP}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-gray-800 flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#825B32] mr-2"></div>
                    Danh mục
                  </h3>
                  <div className="bg-gray-50/50 rounded-lg p-3 border border-gray-200">
                    <p className="font-bold text-sm text-gray-800">{product.LoaiSP.TenLoai}</p>
                    <p className="text-xs text-gray-600 mt-1">Mã: #{product.MaLoaiSP}</p>
                  </div>
                </div>
              </div>
              <Separator className="bg-[#825B32]/20" />
              {/* Description */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-gray-800 flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#825B32] mr-2"></div>
                  Mô tả sản phẩm
                </h3>
                <div className="bg-gray-50/50 rounded-lg p-3 border border-gray-200">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {product.MoTa || "Chưa có mô tả cho sản phẩm này"}
                  </p>
                </div>
              </div>
              <Separator className="bg-[#825B32]/20" />
              {/* Price & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-gray-800 flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#825B32] mr-2"></div>
                    Giá bán hiện tại
                  </h3>
                  {(() => {
                    const latestPrice = getLatestPrice(product);
                    return latestPrice ? (
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
                        <p className="font-bold text-lg text-green-700">
                          {formatCurrency(latestPrice.Gia)}
                        </p>
                        <div className="flex items-center mt-1 text-xs text-green-600">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>Áp dụng: {new Date(latestPrice.NgayApDung).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="font-bold text-base text-gray-600">
                          Chưa có giá
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Sản phẩm chưa được thiết lập giá bán
                        </p>
                      </div>
                    );
                  })()}
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-gray-800 flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#825B32] mr-2"></div>
                    Trạng thái
                  </h3>
                  <div className={`rounded-lg p-3 border ${
                    product.TrangThai 
                      ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200' 
                      : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-bold text-sm ${
                          product.TrangThai ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {product.TrangThai ? "🟢 Đang hoạt động" : "🔴 Ngừng hoạt động"}
                        </p>
                        <p className={`text-xs mt-1 ${
                          product.TrangThai ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {product.TrangThai 
                            ? "Sản phẩm đang được bán" 
                            : "Sản phẩm tạm ngừng bán"}
                        </p>
                      </div>
                      <Badge className={`px-2 py-1 text-xs font-medium ${
                        product.TrangThai
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : "bg-red-100 text-red-800 border border-red-200"
                      }`}>
                        {product.TrangThai ? "ACTIVE" : "INACTIVE"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              {/* Supplier Info */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-gray-800 flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#825B32] mr-2"></div>
                  Nhà cung cấp
                </h3>
                <div className="bg-gradient-to-br from-[#825B32]/5 to-[#825B32]/10 rounded-lg p-3 border border-[#825B32]/20">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <User className="w-3 h-3 text-[#825B32] mr-2" />
                        <p className="font-bold text-sm text-gray-800">{product.NhaCungCap.TenNCC}</p>
                      </div>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex items-start">
                          <MapPin className="w-3 h-3 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="leading-tight">{product.NhaCungCap.DiaChi}</span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="w-3 h-3 text-gray-500 mr-2 flex-shrink-0" />
                          <span>{product.NhaCungCap.SDT}</span>
                        </div>
                        {product.NhaCungCap.Email && (
                          <div className="flex items-center">
                            <Mail className="w-3 h-3 text-gray-500 mr-2 flex-shrink-0" />
                            <span>{product.NhaCungCap.Email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[#825B32] border-[#825B32] text-xs px-2">
                      #{product.NhaCungCap.MaNCC}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Product Images */}
        <div className="flex-1 min-w-[220px] max-w-[340px] space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#825B32]/5 to-[#825B32]/10 py-3">
              <CardTitle className="flex items-center text-[#825B32] text-base">
                <Camera className="w-4 h-4 mr-2" />
                Hình ảnh sản phẩm ({product.AnhSanPhams.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Main Image Display */}
              <div className="relative">
                <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden border-2 border-[#825B32]/10 shadow-inner">
                  <img
                    src={product.AnhSanPhams[selectedImage]?.DuongDan || "/placeholder.svg"}
                    alt={product.TenSP}
                    className="w-full h-full object-cover transition-all duration-300 hover:scale-105"
                  />
                </div>
                {/* Image Overlay Info */}
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1.5">
                  <p className="text-white text-xs font-medium">
                    {selectedImage + 1} / {product.AnhSanPhams.length}
                  </p>
                </div>
                {product.AnhSanPhams[selectedImage]?.AnhChinh && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-[#825B32] hover:bg-[#825B32]/90 text-white text-xs px-2 py-1">
                      ⭐ Ảnh chính
                    </Badge>
                  </div>
                )}
              </div>
              {/* Thumbnail Gallery */}
              {product.AnhSanPhams.length > 1 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-800 flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#825B32] mr-2"></div>
                    Tất cả hình ảnh
                  </h4>
                  <div className="grid grid-cols-4 gap-2">
                    {product.AnhSanPhams.map((image, index) => (
                      <button
                        key={image.MaAnh}
                        onClick={() => setSelectedImage(index)}
                        className={`relative group aspect-square bg-gray-100 rounded-lg overflow-hidden transition-all duration-200 ${
                          selectedImage === index
                            ? "ring-2 ring-[#825B32] ring-offset-1 shadow-md scale-105"
                            : "hover:ring-2 hover:ring-[#825B32]/50 hover:ring-offset-1 hover:shadow-sm hover:scale-102"
                        }`}
                      >
                        <img
                          src={image.DuongDan}
                          alt={`${product.TenSP} ${index + 1}`}
                          className="w-full h-full object-cover transition-all duration-200 group-hover:brightness-110"
                        />
                        {/* Thumbnail Overlay */}
                        <div className={`absolute inset-0 transition-all duration-200 ${
                          selectedImage === index
                            ? "bg-[#825B32]/10 border border-[#825B32]/20"
                            : "bg-black/0 group-hover:bg-black/5"
                        }`} />
                        {/* Main Image Indicator */}
                        {image.AnhChinh && (
                          <div className="absolute top-1 right-1">
                            <div className="w-2 h-2 bg-[#825B32] rounded-full shadow-sm"></div>
                          </div>
                        )}
                        {/* Image Order */}
                        <div className={`absolute bottom-1 left-1 text-xs font-medium px-1.5 py-0.5 rounded ${
                          selectedImage === index
                            ? "bg-[#825B32] text-white"
                            : "bg-black/50 text-white opacity-0 group-hover:opacity-100"
                        } transition-all duration-200`}>
                          {index + 1}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Image Metadata */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-[#825B32]/5 rounded-lg p-2">
                  <Label className="text-[#825B32] font-medium uppercase tracking-wide">
                    Tên file
                  </Label>
                  <p className="text-gray-700 mt-1 break-all font-mono">
                    {product.AnhSanPhams[selectedImage]?.TenFile || "N/A"}
                  </p>
                </div>
                <div className="bg-[#825B32]/5 rounded-lg p-2">
                  <Label className="text-[#825B32] font-medium uppercase tracking-wide">
                    Thứ tự
                  </Label>
                  <p className="text-gray-700 mt-1 font-semibold">
                    #{product.AnhSanPhams[selectedImage]?.ThuTu || (selectedImage + 1)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Product Variants - Full Width */}
      <Card className="overflow-hidden w-full mt-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Palette className="w-5 h-5 mr-2" />
              Biến thể sản phẩm ({product.ChiTietSanPhams.length})
            </div>
            <div className="flex items-center space-x-2">
              {/* Visualized action buttons group */}
              <div className="flex gap-2 items-center">
                <AddProductDetailDialog 
                  productId={product.MaSP} 
                  onAdded={refreshProductData} 
                />
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    size="sm"
                    className="bg-[#825B32] text-white border-none shadow-sm hover:bg-[#6d4827] transition-all px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-semibold"
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    Chỉnh sửa tồn kho
                  </Button>
                ) : (
                  <div className="flex gap-2 items-center">
                    <Button 
                      variant="outline" 
                      onClick={cancelEditing} 
                      size="sm"
                      className="border-gray-300 text-gray-700 bg-white hover:bg-gray-100 px-4 py-2 rounded-lg text-xs font-semibold"
                    >
                      Hủy
                    </Button>
                    <Button
                      onClick={() => setShowConfirmModal(true)}
                      disabled={!hasChanges}
                      size="sm"
                      className="bg-[#825B32] text-white border-none shadow-sm hover:bg-[#6d4827] transition-all px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-semibold disabled:opacity-60"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Lưu thay đổi ({stockChangeCount})
                    </Button>
                  </div>
                )}
              </div>
              <Dialog
                open={showStockHistory}
                onOpenChange={setShowStockHistory}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <History className="w-4 h-4 mr-2" />
                    Lịch sử tồn kho
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Lịch sử điều chỉnh tồn kho</DialogTitle>
                    <DialogDescription>
                      Lịch sử các lần thay đổi số lượng tồn kho của sản phẩm
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Mock stock history */}
                    <div className="space-y-3">
                      <div className="border-l-4 border-green-500 pl-4 py-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              Nhập hàng từ nhà cung cấp
                            </p>
                            <p className="text-sm text-gray-600">
                              Cập nhật: +50 sản phẩm các size
                            </p>
                            <p className="text-xs text-gray-500">
                              20/01/2024 13:15
                            </p>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            +50
                          </Badge>
                        </div>
                      </div>
                      <div className="border-l-4 border-red-500 pl-4 py-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              Điều chỉnh kiểm kê
                            </p>
                            <p className="text-sm text-gray-600">
                              Hiệu chỉnh sau kiểm kê định kỳ
                            </p>
                            <p className="text-xs text-gray-500">
                              18/01/2024 16:30
                            </p>
                          </div>
                          <Badge className="bg-red-100 text-red-800">
                            -12
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Size / Màu sắc</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Tồn kho</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Cập nhật lần cuối</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {product.ChiTietSanPhams.map((variant) => {
                const stockStatus = getStockStatus(variant);
                const editingQuantity = editingVariants[variant.MaCTSP.toString()];
                const currentQuantity =
                  editingQuantity !== undefined
                    ? editingQuantity
                    : variant.SoLuongTon;

                return (
                  <TableRow key={variant.MaCTSP}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: variant.Mau.MaHex }}
                        />
                        <span className="font-medium">
                          {variant.KichThuoc.TenKichThuoc}
                        </span>
                        <span className="text-gray-600">
                          - {variant.Mau.TenMau}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {product.MaSP}-{variant.KichThuoc.TenKichThuoc}-{variant.Mau.TenMau}
                      </code>
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleQuantityChange(
                                variant.MaCTSP.toString(),
                                currentQuantity - 1,
                              )
                            }
                            disabled={currentQuantity <= 0}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <Input
                            type="number"
                            value={currentQuantity}
                            onChange={(e) =>
                              handleQuantityChange(
                                variant.MaCTSP.toString(),
                                parseInt(e.target.value) || 0,
                              )
                            }
                            className="w-20 text-center"
                            min="0"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleQuantityChange(
                                variant.MaCTSP.toString(),
                                currentQuantity + 1,
                              )
                            }
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <span className="font-medium">
                          {variant.SoLuongTon}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={stockStatus.color}>
                        {stockStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {formatDateTime(variant.Mau.NgayTao)}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Price History Modal */}
      <Dialog open={showPriceHistory} onOpenChange={setShowPriceHistory}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-[#825B32]">
              <TrendingUp className="w-5 h-5 mr-2" />
              Lịch sử thay đổi giá bán
            </DialogTitle>
            <DialogDescription>
              Toàn bộ lịch sử các lần thay đổi giá của sản phẩm {product.TenSP}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {product.ThayDoiGia && product.ThayDoiGia.length > 0 ? (
              <div className="space-y-3">
                {product.ThayDoiGia
                  .sort((a, b) => new Date(b.NgayApDung).getTime() - new Date(a.NgayApDung).getTime())
                  .map((priceChange, index) => (
                    <div 
                      key={`${priceChange.NgayThayDoi}-${index}`}
                      className={`relative p-4 rounded-lg border transition-all hover:shadow-sm ${
                        index === 0 
                          ? 'bg-gradient-to-r from-[#825B32]/5 to-[#825B32]/10 border-[#825B32]/20' 
                          : 'bg-gray-50/50 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              index === 0 ? 'bg-[#825B32] text-white' : 'bg-gray-200 text-gray-600'
                            }`}>
                              <TrendingUp className="w-4 h-4" />
                            </div>
                            <div>
                              <p className={`font-bold text-lg ${
                                index === 0 ? 'text-[#825B32]' : 'text-gray-700'
                              }`}>
                                {formatCurrency(priceChange.Gia)}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>Thay đổi: {new Date(priceChange.NgayThayDoi).toLocaleDateString('vi-VN')}</span>
                                <span>•</span>
                                <span>Áp dụng: {new Date(priceChange.NgayApDung).toLocaleDateString('vi-VN')}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {index === 0 && (
                            <Badge className="bg-[#825B32] hover:bg-[#825B32]/90">
                              Giá hiện tại
                            </Badge>
                          )}
                          {index > 0 && (
                            <Badge variant="outline" className="text-gray-600 border-gray-300">
                              #{product.ThayDoiGia.length - index}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có lịch sử giá</h3>
                <p className="text-gray-500 text-sm">
                  Sản phẩm này chưa có thông tin về các lần thay đổi giá
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowPriceHistory(false)}
              className="text-[#825B32] border-[#825B32] hover:bg-[#825B32] hover:text-white"
            >
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Stock Update Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-[#825B32]">
              <Package className="w-5 h-5 mr-2" />
              Xác nhận cập nhật tồn kho
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn cập nhật số lượng tồn kho cho {stockChangeCount} biến thể sản phẩm không?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            {Object.entries(editingVariants).map(([variantId, newQuantity]) => {
              const variant = product?.ChiTietSanPhams.find(v => v.MaCTSP.toString() === variantId);
              if (!variant) return null;
              
              const oldQuantity = variant.SoLuongTon;
              const difference = newQuantity - oldQuantity;
              
              return (
                <div key={variantId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                      style={{ backgroundColor: variant.Mau.MaHex }}
                    />
                    <div>
                      <p className="font-medium text-sm">
                        {variant.KichThuoc.TenKichThuoc} - {variant.Mau.TenMau}
                      </p>
                      <p className="text-xs text-gray-600">
                        {oldQuantity} → {newQuantity}
                      </p>
                    </div>
                  </div>
                  <Badge className={difference >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {difference >= 0 ? `+${difference}` : difference}
                  </Badge>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              className="text-gray-600 border-gray-300"
            >
              Hủy
            </Button>
            <Button
              onClick={confirmStockUpdate}
              className="bg-[#825B32] hover:bg-[#825B32]/90"
            >
              <Save className="w-4 h-4 mr-2" />
              Xác nhận cập nhật
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProductDetail;
