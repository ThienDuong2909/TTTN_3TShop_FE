import React, { useState, useEffect } from "react";
import { Plus, X, Upload, Eye, Trash2, Save, ArrowLeft } from "lucide-react";
import { toast, Toaster } from "sonner";
import { useNavigate } from "react-router-dom";
import { CLOUDINARY_CONFIG } from "../config/cloudinary";

interface ProductVariant {
  id: string;
  MaMau: number;
  MaKichThuoc: number;
  SoLuongTon: number;
  colorName?: string;
  sizeName?: string;
  colorHex?: string;
}

interface ProductImage {
  id: string;
  url: string;
  TenFile: string;
  AnhChinh: number;
  ThuTu: number;
  MoTa: string;
}

interface ProductFormData {
  TenSP: string;
  MaLoaiSP: number;
  MaNCC: number;
  MoTa: string;
  Gia: number;
  NgayApDung: string;
  TrangThai: boolean;
  images: ProductImage[];
  details: ProductVariant[];
}

interface Category {
  MaLoaiSP: number;
  TenLoai: string;
  NgayTao: string;
  HinhMinhHoa?: string;
}

interface Supplier {
  MaNCC: number;
  TenNCC: string;
  DiaChi: string;
  SDT: string;
  Email: string;
}

interface Color {
  MaMau: number;
  TenMau: string;
  MaHex: string;
  TrangThai: boolean;
}

interface Size {
  MaKichThuoc: number;
  TenKichThuoc: string;
}

export const ProductAdd = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ProductFormData>({
    TenSP: "",
    MaLoaiSP: 0,
    MaNCC: 0,
    MoTa: "",
    Gia: 0,
    NgayApDung: new Date().toISOString().split('T')[0], // Current date
    TrangThai: true, // Default to active
    images: [],
    details: [],
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  
  const [isAddingVariant, setIsAddingVariant] = useState(false);
  const [newVariant, setNewVariant] = useState({
    MaMau: 0,
    MaKichThuoc: 0,
    SoLuongTon: 0,
  });

  const [isUploading, setIsUploading] = useState(false);

  // Fetch data from APIs
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesRes = await fetch("http://localhost:8080/api/category");
        const categoriesData = await categoriesRes.json();
        if (categoriesData.success) {
          setCategories(categoriesData.data);
        }

        // Fetch suppliers
        const suppliersRes = await fetch("http://localhost:8080/api/suppliers");
        const suppliersData = await suppliersRes.json();
        if (
          suppliersData.success &&
          suppliersData.data &&
          Array.isArray(suppliersData.data.data)
        ) {
          setSuppliers(suppliersData.data.data);
        } else {
          setSuppliers([]);
        }

        // Fetch colors
        const colorsRes = await fetch("http://localhost:8080/api/colors");
        const colorsData = await colorsRes.json();
        if (colorsData.success) {
          setColors(colorsData.data.filter((color: Color) => color.TrangThai));
        }

        // Fetch sizes
        const sizesRes = await fetch("http://localhost:8080/api/sizes");
        const sizesData = await sizesRes.json();
        if (sizesData.success) {
          setSizes(sizesData.data);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Có lỗi xảy ra khi tải dữ liệu");
      }
    };

    fetchData();
  }, []);

  // Add product variant
  const addVariant = () => {
    if (!newVariant.MaMau || !newVariant.MaKichThuoc) {
      toast.warning("Vui lòng chọn màu sắc và kích thước!");
      return;
    }

    // Check if variant already exists
    const exists = formData.details.some(
      (v) => v.MaMau === newVariant.MaMau && v.MaKichThuoc === newVariant.MaKichThuoc,
    );

    if (exists) {
      toast.warning("Biến thể này đã tồn tại!");
      return;
    }

    const selectedColor = colors.find(c => c.MaMau === newVariant.MaMau);
    const selectedSize = sizes.find(s => s.MaKichThuoc === newVariant.MaKichThuoc);

    const variant: ProductVariant = {
      id: Date.now().toString(),
      MaMau: newVariant.MaMau,
      MaKichThuoc: newVariant.MaKichThuoc,
      SoLuongTon: newVariant.SoLuongTon,
      colorName: selectedColor?.TenMau,
      sizeName: selectedSize?.TenKichThuoc,
      colorHex: selectedColor?.MaHex,
    };

    setFormData({
      ...formData,
      details: [...formData.details, variant],
    });

    setNewVariant({ MaMau: 0, MaKichThuoc: 0, SoLuongTon: 0 });
    setIsAddingVariant(false);
    toast.success("Thêm biến thể thành công!");
  };

  // Remove variant
  const removeVariant = (variantId: string) => {
    setFormData({
      ...formData,
      details: formData.details.filter((v) => v.id !== variantId),
    });
    toast.success("Xóa biến thể thành công!");
  };

  // Update variant quantity
  const updateVariantQuantity = (variantId: string, quantity: number) => {
    setFormData({
      ...formData,
      details: formData.details.map((v) =>
        v.id === variantId ? { ...v, SoLuongTon: quantity } : v,
      ),
    });
  };

  // Upload image to Cloudinary
  const uploadImageToCloudinary = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_CONFIG.UPLOAD_PRESET);
      formData.append('cloud_name', CLOUDINARY_CONFIG.CLOUD_NAME);

      const response = await fetch(CLOUDINARY_CONFIG.API_URL, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.secure_url) {
        return data.secure_url;
      } else {
        console.error('Cloudinary upload failed:', data);
        return null;
      }
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      return null;
    }
  };

  // Validate file before upload
  const validateFile = (file: File): boolean => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error(`File "${file.name}" không phải là hình ảnh!`);
      return false;
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error(`File "${file.name}" quá lớn! Vui lòng chọn file nhỏ hơn 5MB.`);
      return false;
    }

    return true;
  };

  // Add image from file upload
  const addImage = async () => {
    if (formData.images.length >= 5) {
      toast.warning("Chỉ được upload tối đa 5 hình ảnh!");
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    
    input.onchange = async (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (!files) return;

      const remainingSlots = 5 - formData.images.length;
      const filesToProcess = Array.from(files).slice(0, remainingSlots);

      // Validate all files first
      const validFiles = filesToProcess.filter(validateFile);
      if (validFiles.length === 0) {
        return;
      }

      if (files.length > remainingSlots) {
        toast.warning(`Chỉ có thể thêm ${remainingSlots} ảnh nữa. Đã chọn ${remainingSlots} ảnh đầu tiên.`);
      }

      setIsUploading(true);
      toast.info(`Đang upload ${validFiles.length} hình ảnh...`);

      try {
        const uploadPromises = validFiles.map(async (file, index) => {
          const url = await uploadImageToCloudinary(file);
          if (url) {
            return {
              id: `${Date.now()}_${index}`,
              url: url,
              TenFile: file.name,
              AnhChinh: formData.images.length === 0 && index === 0 ? 1 : 0,
              ThuTu: formData.images.length + index + 1,
              MoTa: formData.images.length === 0 && index === 0 ? "Ảnh chính" : "Ảnh phụ",
            };
          }
          return null;
        });

        const uploadResults = await Promise.all(uploadPromises);
        const successfulUploads = uploadResults.filter((result): result is ProductImage => result !== null);

        if (successfulUploads.length > 0) {
          setFormData({
            ...formData,
            images: [...formData.images, ...successfulUploads],
          });
          toast.success(`Upload thành công ${successfulUploads.length}/${validFiles.length} hình ảnh!`);
        } else {
          toast.error("Không thể upload hình ảnh. Vui lòng kiểm tra cấu hình Cloudinary!");
        }

        if (successfulUploads.length < validFiles.length) {
          toast.warning(`${validFiles.length - successfulUploads.length} ảnh upload thất bại!`);
        }
      } catch (error) {
        console.error('Error uploading images:', error);
        toast.error("Có lỗi xảy ra khi upload hình ảnh!");
      } finally {
        setIsUploading(false);
      }
    };

    input.click();
  };

  // Remove image
  const removeImage = (imageId: string) => {
    const updatedImages = formData.images.filter((img) => img.id !== imageId);
    // Reorder and set new primary image if needed
    const reorderedImages = updatedImages.map((img, index) => ({
      ...img,
      ThuTu: index + 1,
      AnhChinh: index === 0 ? 1 : 0,
      MoTa: index === 0 ? "Ảnh chính" : "Ảnh phụ",
    }));
    
    setFormData({
      ...formData,
      images: reorderedImages,
    });
    toast.success("Xóa hình ảnh thành công!");
  };

  // Set primary image
  const setPrimaryImage = (imageId: string) => {
    setFormData({
      ...formData,
      images: formData.images.map((img) => ({
        ...img,
        AnhChinh: img.id === imageId ? 1 : 0,
        MoTa: img.id === imageId ? "Ảnh chính" : "Ảnh phụ",
      })),
    });
    toast.success("Đặt ảnh chính thành công!");
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();


    // Validation
    if (!formData.TenSP || !formData.MaLoaiSP || !formData.MaNCC || !formData.Gia || !formData.NgayApDung) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc!");
      return;
    }

    // Validate Ngày áp dụng không nhỏ hơn ngày hiện tại
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const appliedDate = new Date(formData.NgayApDung);
    appliedDate.setHours(0, 0, 0, 0);
    if (appliedDate < today) {
      toast.error("Ngày áp dụng không được nhỏ hơn ngày hiện tại!");
      return;
    }

    if (formData.details.length === 0) {
      toast.error("Vui lòng thêm ít nhất một biến thể sản phẩm!");
      return;
    }

    if (formData.images.length === 0) {
      toast.error("Vui lòng thêm ít nhất một hình ảnh!");
      return;
    }

    if (isUploading) {
      toast.warning("Vui lòng chờ upload hình ảnh hoàn tất!");
      return;
    }

    try {
      // Prepare data for API
      const productData = {
        TenSP: formData.TenSP,
        MaLoaiSP: formData.MaLoaiSP,
        MaNCC: formData.MaNCC,
        MoTa: formData.MoTa,
        Gia: formData.Gia,
        NgayApDung: formData.NgayApDung,
        TrangThai: formData.TrangThai,
        details: formData.details.map(detail => ({
          MaMau: detail.MaMau,
          MaKichThuoc: detail.MaKichThuoc,
          SoLuongTon: detail.SoLuongTon,
        })),
        images: formData.images.map(img => ({
          url: img.url,
          TenFile: img.TenFile,
          AnhChinh: img.AnhChinh,
          ThuTu: img.ThuTu,
          MoTa: img.MoTa,
        })),
      };

      const response = await fetch("http://localhost:8080/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Thêm sản phẩm thành công!");
        // Reset form
        setFormData({
          TenSP: "",
          MaLoaiSP: 0,
          MaNCC: 0,
          MoTa: "",
          Gia: 0,
          NgayApDung: new Date().toISOString().split('T')[0], // Reset to current date
          TrangThai: true, // Reset to active
          images: [],
          details: [],
        });
      } else {
        toast.error(result.message || "Có lỗi xảy ra khi thêm sản phẩm!");
      }
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error("Có lỗi xảy ra khi thêm sản phẩm!");
    }
  };

  const totalQuantity = formData.details.reduce(
    (sum, variant) => sum + variant.SoLuongTon,
    0,
  );

  return (
    <>
      <Toaster position="top-center" richColors />
      
      {/* Header with back button */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-[#825B32] hover:bg-gray-50 rounded-md transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay về trang sản phẩm
            </button>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Thêm sản phẩm mới</h1>
            <p className="text-sm text-gray-600 mt-1">Nhập thông tin chi tiết để tạo sản phẩm</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Thông tin cơ bản
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Tên sản phẩm *
              </label>
              <input
                type="text"
                value={formData.TenSP}
                onChange={(e) =>
                  setFormData({ ...formData, TenSP: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#825B32] focus:border-[#825B32] focus:outline-none"
                placeholder="Nhập tên sản phẩm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Danh mục *
              </label>
              <select
                value={formData.MaLoaiSP}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    MaLoaiSP: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#825B32] focus:border-[#825B32] focus:outline-none"
                required
              >
                <option value="0">Chọn danh mục</option>
                {categories.map((category) => (
                  <option key={category.MaLoaiSP} value={category.MaLoaiSP}>
                    {category.TenLoai}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nhà cung cấp *
              </label>
              <select
                value={formData.MaNCC}
                onChange={(e) =>
                  setFormData({ ...formData, MaNCC: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#825B32] focus:border-[#825B32] focus:outline-none"
                required
              >
                <option value="0">Chọn nhà cung cấp</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.MaNCC} value={supplier.MaNCC}>
                    {supplier.TenNCC}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Giá sản phẩm *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.Gia.toLocaleString('vi-VN')}
                  onChange={(e) => {
                    // Remove all non-digit characters
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    setFormData({ ...formData, Gia: parseInt(raw) || 0 });
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#825B32] focus:border-[#825B32] focus:outline-none pr-16"
                  placeholder="Nhập giá sản phẩm"
                  min="0"
                  required
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm select-none">₫</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Ngày áp dụng *
              </label>
              <input
                type="date"
                value={formData.NgayApDung}
                onChange={(e) =>
                  setFormData({ ...formData, NgayApDung: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#825B32] focus:border-[#825B32] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Trạng thái *
              </label>
              <select
                value={formData.TrangThai ? "true" : "false"}
                onChange={(e) =>
                  setFormData({ ...formData, TrangThai: e.target.value === "true" })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#825B32] focus:border-[#825B32] focus:outline-none"
                required
              >
                <option value="true">Hoạt động</option>
                <option value="false">Dừng bán</option>
              </select>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Mô tả sản phẩm
          </h2>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Mô tả sản phẩm
            </label>
            <textarea
              value={formData.MoTa}
              onChange={(e) =>
                setFormData({ ...formData, MoTa: e.target.value })
              }
              rows={4}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#825B32] focus:border-[#825B32] focus:outline-none"
              placeholder="Mô tả chi tiết về sản phẩm, đặc điểm, ưu điểm..."
            />
          </div>
        </div>

        {/* Product Images */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Hình ảnh sản phẩm ({formData.images.length}/5)
              </h2>
              <p className="text-xs text-gray-600 mt-1">
                Upload từ 1-5 hình ảnh. Ảnh đầu tiên sẽ là ảnh chính.
              </p>
            </div>
            <button
              type="button"
              onClick={addImage}
              disabled={isUploading || formData.images.length >= 5}
              className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                isUploading || formData.images.length >= 5
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-[#825B32] text-white hover:bg-[#6d4a2a]'
              }`}
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Đang upload...' : 'Thêm hình ảnh'}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {formData.images.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                  <img
                    src={image.url}
                    alt={image.MoTa}
                    className="w-full h-full object-cover"
                  />
                </div>
                {image.AnhChinh === 1 && (
                  <div className="absolute top-1 left-1 bg-[#825B32] text-white text-xs px-2 py-1 rounded">
                    Chính
                  </div>
                )}
                <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {image.AnhChinh !== 1 && (
                    <button
                      type="button"
                      onClick={() => setPrimaryImage(image.id)}
                      className="p-1 bg-[#825B32] text-white rounded hover:bg-[#6d4a2a]"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {formData.images.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Chưa có hình ảnh nào</p>
              <p className="text-xs text-gray-400 mt-1">
                Click "Thêm hình ảnh" để upload từ máy tính (tối đa 5 ảnh)
              </p>
            </div>
          )}
        </div>

        {/* Product Variants */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Biến thể sản phẩm ({formData.details.length})
              </h2>
              <p className="text-xs text-gray-600 mt-1">
                Tổng số lượng: {totalQuantity} sản phẩm
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingVariant(true)}
              className="flex items-center px-3 py-2 text-sm bg-[#825B32] text-white rounded-md hover:bg-[#6d4a2a] transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm biến thể
            </button>
          </div>

          {/* Add Variant Form */}
          {isAddingVariant && (
            <div className="mb-4 p-3 border border-[#825B32] border-opacity-30 rounded-lg bg-[#825B32] bg-opacity-5">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Thêm biến thể mới
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Kích thước *
                  </label>
                  <select
                    value={newVariant.MaKichThuoc}
                    onChange={(e) =>
                      setNewVariant({ ...newVariant, MaKichThuoc: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#825B32] focus:border-[#825B32] focus:outline-none"
                  >
                    <option value="0">Chọn kích thước</option>
                    {sizes.map((size) => (
                      <option key={size.MaKichThuoc} value={size.MaKichThuoc}>
                        {size.TenKichThuoc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Màu sắc *
                  </label>
                  <select
                    value={newVariant.MaMau}
                    onChange={(e) =>
                      setNewVariant({ ...newVariant, MaMau: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#825B32] focus:border-[#825B32] focus:outline-none"
                  >
                    <option value="0">Chọn màu</option>
                    {colors.map((color) => (
                      <option key={color.MaMau} value={color.MaMau}>
                        {color.TenMau}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Số lượng *
                  </label>
                  <input
                    type="number"
                    value={newVariant.SoLuongTon}
                    onChange={(e) =>
                      setNewVariant({
                        ...newVariant,
                        SoLuongTon: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#825B32] focus:border-[#825B32] focus:outline-none"
                    min="0"
                    placeholder="0"
                  />
                </div>

                <div className="flex items-end space-x-2">
                  <button
                    type="button"
                    onClick={addVariant}
                    className="px-3 py-2 text-sm bg-[#825B32] text-white rounded-md hover:bg-[#6d4a2a] transition-colors"
                  >
                    Thêm
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingVariant(false)}
                    className="px-3 py-2 text-sm bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Variants List */}
          <div className="space-y-2">
            {formData.details.map((variant) => (
              <div
                key={variant.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-5 h-5 rounded-full border border-gray-300"
                    style={{ backgroundColor: variant.colorHex }}
                  ></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {variant.sizeName} - {variant.colorName}
                    </div>
                    <div className="text-xs text-gray-500">
                      Mã màu: {variant.MaMau} | Mã size: {variant.MaKichThuoc}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Số lượng
                    </label>
                    <input
                      type="number"
                      value={variant.SoLuongTon}
                      onChange={(e) =>
                        updateVariantQuantity(
                          variant.id!,
                          parseInt(e.target.value) || 0,
                        )
                      }
                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center focus:border-[#825B32] focus:outline-none"
                      min="0"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVariant(variant.id!)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {formData.details.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <Plus className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Chưa có biến thể nào</p>
              <p className="text-xs text-gray-400 mt-1">
                Thêm các biến thể kích thước và màu sắc cho sản phẩm
              </p>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="flex items-center px-4 py-2 text-sm bg-[#825B32] text-white rounded-md hover:bg-[#6d4a2a] transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            Lưu sản phẩm
          </button>
        </div>
      </form>
    </>
  );
};

export default ProductAdd;