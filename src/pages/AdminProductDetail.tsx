import {
  ArrowLeft,
  Calendar,
  Camera,
  Eye,
  History,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Palette,
  Phone,
  Star,
  TrendingUp,
  User,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
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
  AddProductDetailDialog,
  CommentsDialog,
  PriceHistoryDialog,
  StockHistoryDialog,
} from "../components/admin-product-detail";
import { Separator } from "../components/ui/separator";
import { getProductDetailById } from "../services/api.js";
import {
  ApiProductDetail,
  ApiProductVariant,
} from "@/types/admin-prouduct-detail.type.js";

export const AdminProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<ApiProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const result = await getProductDetailById(id);

        if (result && result.success) {
          setProduct(result.data);
        } else {
          console.error("Error fetching product:", result?.message);
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

  const getLatestPrice = (product: ApiProductDetail) => {
    if (!product.ThayDoiGia || product.ThayDoiGia.length === 0) {
      return null;
    }
    const sortedPrices = [...product.ThayDoiGia].sort(
      (a, b) =>
        new Date(b.NgayApDung).getTime() - new Date(a.NgayApDung).getTime()
    );

    return sortedPrices[0];
  };

  // Helper function to format currency
  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
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

  const refreshProductData = async () => {
    if (!id) return;

    try {
      const result = await getProductDetailById(id);
      if (result && result.success) {
        setProduct(result.data);
      }
    } catch (error) {
      console.error("Error refreshing product data:", error);
    }
  };

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

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Không tìm thấy sản phẩm
          </h1>
          <p className="text-gray-600 mb-4">
            Sản phẩm không tồn tại hoặc đã bị xóa
          </p>
          <Button onClick={() => navigate("/admin/products")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  // Calculate totals from API data
  const totalQuantity = product.ChiTietSanPhams.reduce(
    (sum, variant) => sum + variant.SoLuongTon,
    0
  );

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-[#825B32]" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Đánh giá</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-xl font-bold text-[#825B32]">
                      {product.BinhLuan?.avgRate
                        ? product.BinhLuan.avgRate.toFixed(1)
                        : "0.0"}
                    </p>
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  </div>
                  <p className="text-xs text-gray-500">
                    {product.BinhLuan?.luotBinhLuan || 0} bình luận
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowComments(true)}
                className="text-[#825B32] border-[#825B32] hover:bg-[#825B32] hover:text-white"
                disabled={
                  !product.BinhLuan?.DanhSachBinhLuan ||
                  product.BinhLuan.DanhSachBinhLuan.length === 0
                }
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Xem
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
                    <p className="font-bold text-base text-gray-800 leading-tight">
                      {product.TenSP}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      #{product.MaSP}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-gray-800 flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#825B32] mr-2"></div>
                    Danh mục
                  </h3>
                  <div className="bg-gray-50/50 rounded-lg p-3 border border-gray-200">
                    <p className="font-bold text-sm text-gray-800">
                      {product.LoaiSP.TenLoai}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Mã: #{product.MaLoaiSP}
                    </p>
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
                          <span>
                            Áp dụng:{" "}
                            {new Date(
                              latestPrice.NgayApDung
                            ).toLocaleDateString("vi-VN")}
                          </span>
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
                  <div
                    className={`rounded-lg p-3 border ${
                      product.TrangThai
                        ? "bg-gradient-to-br from-green-50 to-green-100 border-green-200"
                        : "bg-gradient-to-br from-red-50 to-red-100 border-red-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className={`font-bold text-sm ${
                            product.TrangThai
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          {product.TrangThai
                            ? "🟢 Đang hoạt động"
                            : "🔴 Ngừng hoạt động"}
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            product.TrangThai
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {product.TrangThai
                            ? "Sản phẩm đang được bán"
                            : "Sản phẩm tạm ngừng bán"}
                        </p>
                      </div>
                      <Badge
                        className={`px-2 py-1 text-xs font-medium ${
                          product.TrangThai
                            ? "bg-green-100 text-green-800 border border-green-200"
                            : "bg-red-100 text-red-800 border border-red-200"
                        }`}
                      >
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
                        <p className="font-bold text-sm text-gray-800">
                          {product.NhaCungCap.TenNCC}
                        </p>
                      </div>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex items-start">
                          <MapPin className="w-3 h-3 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="leading-tight">
                            {product.NhaCungCap.DiaChi}
                          </span>
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
                    <Badge
                      variant="outline"
                      className="text-[#825B32] border-[#825B32] text-xs px-2"
                    >
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
                    src={
                      product.AnhSanPhams[selectedImage]?.DuongDan ||
                      "/placeholder.svg"
                    }
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
                        <div
                          className={`absolute inset-0 transition-all duration-200 ${
                            selectedImage === index
                              ? "bg-[#825B32]/10 border border-[#825B32]/20"
                              : "bg-black/0 group-hover:bg-black/5"
                          }`}
                        />
                        {/* Main Image Indicator */}
                        {image.AnhChinh && (
                          <div className="absolute top-1 right-1">
                            <div className="w-2 h-2 bg-[#825B32] rounded-full shadow-sm"></div>
                          </div>
                        )}
                        {/* Image Order */}
                        <div
                          className={`absolute bottom-1 left-1 text-xs font-medium px-1.5 py-0.5 rounded ${
                            selectedImage === index
                              ? "bg-[#825B32] text-white"
                              : "bg-black/50 text-white opacity-0 group-hover:opacity-100"
                          } transition-all duration-200`}
                        >
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
                    #
                    {product.AnhSanPhams[selectedImage]?.ThuTu ||
                      selectedImage + 1}
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
              </div>
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
                {/* <TableHead>Cập nhật lần cuối</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {product.ChiTietSanPhams.map((variant) => {
                const stockStatus = getStockStatus(variant);
                // const editingQuantity = editingVariants[variant.MaCTSP.toString()];
                // const currentQuantity =
                //   editingQuantity !== undefined
                //     ? editingQuantity
                //     : variant.SoLuongTon;

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
                        {product.MaSP}-{variant.KichThuoc.TenKichThuoc}-
                        {variant.Mau.TenMau}
                      </code>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{variant.SoLuongTon}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={stockStatus.color}>
                        {stockStatus.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Price History Modal */}
      <PriceHistoryDialog
        isOpen={showPriceHistory}
        onClose={() => setShowPriceHistory(false)}
        productName={product.TenSP}
        priceHistory={product.ThayDoiGia}
        formatCurrency={formatCurrency}
      />

      {/* Comments Modal */}
      <CommentsDialog
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        productName={product.TenSP}
        averageRating={product.BinhLuan?.avgRate?.toString()}
        totalComments={product.BinhLuan?.luotBinhLuan}
        comments={product.BinhLuan?.DanhSachBinhLuan}
      />
    </div>
  );
};

export default AdminProductDetail;
