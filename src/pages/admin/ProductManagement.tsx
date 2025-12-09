import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Edit,
  Eye,
  EyeOff,
  ImagePlus,
  Info,
  Plus,
  Save,
  Star,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "sonner";
import AdminHeader from "../../components/AdminHeader";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Textarea } from "../../components/ui/textarea";
import { CLOUDINARY_CONFIG } from "../../config/cloudinary";

// Import API functions
import {
  getCategories,
  getProducts,
  updateProduct,
  updateProductStatus,
} from "../../services/api";
import { useApp } from "@/contexts/AppContext";

// API interfaces
interface ApiProduct {
  MaSP: number;
  TenSP: string;
  MaLoaiSP: number;
  MaNCC: number;
  MoTa: string;
  TrangThai: boolean;
  NgayTao?: string;
  SoLuongBinhLuan?: number; // new field from API
  SoSaoTrungBinh?: string | null; // new field from API (string representation)
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
  AnhSanPhams: Array<{
    MaAnh: number;
    MaSP: number;
    TenFile: string;
    DuongDan: string;
    AnhChinh: boolean;
    ThuTu: number;
    MoTa: string;
  }>;
  ThayDoiGia: Array<{
    MaSP: number;
    NgayThayDoi: string;
    Gia: string;
    NgayApDung: string;
  }>;
  ChiTietSanPhams: Array<{
    MaCTSP: number;
    MaKichThuoc: number;
    MaMau: number;
    SoLuongTon: number;
    KichThuoc: { TenKichThuoc: string };
    Mau: { TenMau: string; MaHex: string };
  }>;
}

interface Category {
  MaLoaiSP: number;
  TenLoai: string;
  NgayTao: string;
  HinhMinhHoa?: string;
}

export default function ProductManagement() {
  const { state } = useApp();
  const navigate = useNavigate();
  const isInitialized = useRef(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(null);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [allProducts, setAllProducts] = useState<ApiProduct[]>([]); // full dataset for client-side filtering
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 8,
    total: 0,
    totalPages: 0,
  });

  // Modal state for status change confirmation
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ApiProduct | null>(
    null
  );

  // Form state for add/edit product
  const [productForm, setProductForm] = useState({
    name: "",
    price: 0,
    images: [] as string[],
    category: "",
    description: "",
    status: true,
    priceChanged: false,
    priceApplyDate: "",
  });

  // State for formatted price display
  const [formattedPrice, setFormattedPrice] = useState("");

  // Image upload state
  const [imageUploadProgress, setImageUploadProgress] = useState<{
    [key: string]: number;
  }>({});

  // Sorting config: key null => no sort (original order), direction cycles asc -> desc -> none
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: "asc" | "desc" | null;
  }>({
    key: null,
    direction: null,
  });

  // Fetch initial data only
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch a large page size to have full dataset for client-side filtering
      const result = await getProducts({
        page: 1,
        pageSize: 1000,
        search: "",
        category: "", // always empty; category filtering is client-side now
      });

      if (result.success && Array.isArray(result.data)) {
        setAllProducts(result.data);
        // products will be derived in effect below
        setPagination((prev) => ({ ...prev, page: 1 }));
      } else {
        console.error("Error fetching initial products:", result);
        setAllProducts([]);
        setProducts([]);
        setPagination({ page: 1, pageSize: 8, total: 0, totalPages: 0 });
      }
    } catch (error) {
      console.error("Error fetching initial products:", error);
      setAllProducts([]);
      setProducts([]);
      setPagination({ page: 1, pageSize: 8, total: 0, totalPages: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await getCategories();
      if (Array.isArray(data)) {
        setCategories(data);
      } else {
        console.error("Categories data is not in expected format:", data);
        setCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchInitialData(), // Load initial data
          fetchCategories(),
        ]);
        isInitialized.current = true;
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Có lỗi xảy ra khi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Only run once on component mount

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setPagination((prev) => ({ ...prev, page: 1, pageSize: newPageSize }));
  };

  // Handle search change with debounce
  const handleSearchChange = useCallback((newSearch: string) => {
    setSearchQuery(newSearch);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Handle category change
  const handleCategoryFilterChange = useCallback((newCategory: string) => {
    setSelectedCategory(newCategory);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Handle sort toggling
  const handleSort = useCallback((key: string) => {
    setSortConfig((prev) => {
      if (prev.key !== key) {
        return { key, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { key, direction: "desc" };
      }
      // Third click resets sorting
      return { key: null, direction: null };
    });
    // Reset to first page whenever sorting changes
    setPagination((p) => ({ ...p, page: 1 }));
  }, []);

  // Derived filtered list (unsorted baseline)
  const filteredProducts = useMemo(() => {
    let list = allProducts;
    if (selectedCategory && selectedCategory !== "all") {
      list = list.filter((p) => p.MaLoaiSP?.toString() === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((p) => p.TenSP.toLowerCase().includes(q));
    }
    return list;
  }, [allProducts, selectedCategory, searchQuery]);

  // Apply sorting
  const sortedProducts = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return filteredProducts;
    const dir = sortConfig.direction === "asc" ? 1 : -1;
    return [...filteredProducts].sort((a, b) => {
      switch (sortConfig.key) {
        case "name":
          return a.TenSP.localeCompare(b.TenSP, "vi") * dir;
        case "price": {
          const getPrice = (p: ApiProduct) => {
            const lp = getLatestPrice(p);
            return lp ? parseFloat(lp.Gia) : Number.NaN;
          };
          const pa = getPrice(a);
          const pb = getPrice(b);
          if (isNaN(pa) && isNaN(pb)) return 0;
          if (isNaN(pa)) return 1;
          if (isNaN(pb)) return -1;
          return (pa - pb) * dir;
        }
        case "stock": {
          const sa = a.ChiTietSanPhams.reduce((s, ct) => s + ct.SoLuongTon, 0);
          const sb = b.ChiTietSanPhams.reduce((s, ct) => s + ct.SoLuongTon, 0);
          return (sa - sb) * dir;
        }
        case "rating": {
          const ra = a.SoSaoTrungBinh ? parseFloat(a.SoSaoTrungBinh) : 0;
          const rb = b.SoSaoTrungBinh ? parseFloat(b.SoSaoTrungBinh) : 0;
          return (ra - rb) * dir;
        }
        default:
          return 0;
      }
    });
  }, [filteredProducts, sortConfig]);

  useEffect(() => {
    const total = sortedProducts.length;
    const totalPages = Math.max(1, Math.ceil(total / pagination.pageSize));
    setPagination((prev) => {
      const newPage = Math.min(prev.page, totalPages);
      return { ...prev, page: newPage, total, totalPages };
    });
  }, [sortedProducts, pagination.pageSize]);

  // Slice products for current page
  useEffect(() => {
    const start = (pagination.page - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    setProducts(sortedProducts.slice(start, end));
  }, [sortedProducts, pagination.page, pagination.pageSize]);
  // Check permissions
  if (
    !state.user ||
    (!state.user.permissions?.includes("sanpham.xem") &&
      !state.user.permissions?.includes("toanquyen"))
  ) {
    navigate("/");
    return null;
  }

  useEffect(() => {
    if (
      !state.user ||
      (!state.user.permissions?.includes("sanpham.xem") &&
        !state.user.permissions?.includes("toanquyen"))
    ) {
      navigate("/");
    }
  }, [state.user, navigate]);

  const canCreate =
    state.user?.permissions?.includes("sanpham.tao") ||
    state.user?.permissions?.includes("toanquyen");
  const canEdit =
    state.user?.permissions?.includes("sanpham.sua") ||
    state.user?.permissions?.includes("toanquyen");

  function getLatestPrice(product: ApiProduct) {
    if (!product.ThayDoiGia || product.ThayDoiGia.length === 0) {
      return null;
    }
    return [...product.ThayDoiGia].sort(
      (a, b) =>
        new Date(b.NgayApDung).getTime() - new Date(a.NgayApDung).getTime()
    )[0];
  }

  // Helper function to format currency
  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(numAmount);
  };

  // Helper function to format input currency
  const formatInputCurrency = (value: number) => {
    if (!value || value === 0) return "";
    return new Intl.NumberFormat("vi-VN").format(value);
  };

  // Helper function to parse currency input
  const parseCurrencyInput = (value: string): number => {
    if (!value) return 0;
    // Remove all non-digit characters except for decimal points
    const numericValue = value.replace(/[^\d]/g, "");
    return parseInt(numericValue) || 0;
  };

  // Helper function to upload image to Cloudinary
  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_CONFIG.UPLOAD_PRESET);
    formData.append("cloud_name", CLOUDINARY_CONFIG.CLOUD_NAME);

    try {
      const response = await fetch(CLOUDINARY_CONFIG.API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      throw new Error("Không thể tải ảnh lên. Vui lòng thử lại.");
    }
  };

  // Helper function to handle file selection and upload
  const handleImageUpload = async (files: FileList) => {
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error(`File "${file.name}" không phải là ảnh hợp lệ`);
        continue;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File "${file.name}" quá lớn. Kích thước tối đa là 5MB`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Initialize upload progress
    const uploadProgressKeys = validFiles.map(
      (_, index) => `upload-${Date.now()}-${index}`
    );

    setImageUploadProgress((prev) => {
      const newProgress = { ...prev };
      uploadProgressKeys.forEach((key) => {
        newProgress[key] = 0;
      });
      return newProgress;
    });

    // Upload files
    try {
      const uploadPromises = validFiles.map(async (file, index) => {
        const progressKey = uploadProgressKeys[index];

        try {
          // Simulate progress (Cloudinary doesn't provide real progress)
          const progressInterval = setInterval(() => {
            setImageUploadProgress((prev) => ({
              ...prev,
              [progressKey]: Math.min(prev[progressKey] + 10, 90),
            }));
          }, 200);

          const imageUrl = await uploadImageToCloudinary(file);

          clearInterval(progressInterval);
          setImageUploadProgress((prev) => ({
            ...prev,
            [progressKey]: 100,
          }));

          return imageUrl;
        } catch (error) {
          throw new Error(`Không thể tải ảnh "${file.name}": ${error}`);
        }
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      // Add uploaded URLs to form
      setProductForm((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));

      // Clean up progress
      setTimeout(() => {
        setImageUploadProgress((prev) => {
          const newProgress = { ...prev };
          uploadProgressKeys.forEach((key) => {
            delete newProgress[key];
          });
          return newProgress;
        });
      }, 1000);

      toast.success(`Đã tải lên ${uploadedUrls.length} ảnh thành công!`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Có lỗi xảy ra khi tải ảnh"
      );

      // Clean up progress on error
      setImageUploadProgress((prev) => {
        const newProgress = { ...prev };
        uploadProgressKeys.forEach((key) => {
          delete newProgress[key];
        });
        return newProgress;
      });
    }
  };

  const handleAddProduct = () => {
    if (!canCreate) {
      toast.error("Bạn không có quyền thêm sản phẩm");
      return;
    }
    navigate("/admin/add-product");
  };

  const handleEditProduct = (product: ApiProduct) => {
    if (!canEdit) {
      return toast.error("Bạn không có quyền sửa sản phẩm");
    }
    const latestPrice = getLatestPrice(product);
    const priceValue = latestPrice ? parseFloat(latestPrice.Gia) : 0;

    setEditingProduct(product);
    setProductForm({
      name: product.TenSP,
      price: priceValue,
      images: product.AnhSanPhams.map((img) => img.DuongDan),
      category: product.MaLoaiSP.toString(),
      description: product.MoTa,
      status: product.TrangThai,
      priceChanged: false,
      priceApplyDate: "",
    });
    setFormattedPrice(formatInputCurrency(priceValue));
  };

  const handleViewProductDetail = (productId: number) => {
    navigate(`/admin/products/${productId}`);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    // Validation
    if (productForm.priceChanged && !productForm.priceApplyDate) {
      toast.error("Vui lòng chọn ngày áp dụng cho giá mới!");
      return;
    }

    try {
      // Prepare images data with proper format
      const imagesData = productForm.images.map((url, index) => {
        // Extract filename from URL
        const urlParts = url.split("/");
        const filename =
          urlParts[urlParts.length - 1] || `image-${index + 1}.jpg`;

        return {
          url: url,
          TenFile: filename,
          AnhChinh: index === 0 ? 1 : 0, // First image is main (1), others are secondary (0)
          ThuTu: index + 1,
          MoTa: index === 0 ? "Ảnh chính" : "Ảnh phụ",
        };
      });

      const updateData: any = {
        TenSP: productForm.name,
        MaLoaiSP: parseInt(productForm.category),
        MoTa: productForm.description,
        TrangThai: productForm.status,
        images: imagesData,
      };
      if (productForm.priceChanged) {
        updateData.Gia = productForm.price;
        updateData.NgayApDung = productForm.priceApplyDate;
      }

      const result = await updateProduct(editingProduct.MaSP, updateData);

      if (result.success) {
        toast.success("Cập nhật sản phẩm thành công!");
        // Update allProducts locally
        setAllProducts((prev) =>
          prev.map((p) =>
            p.MaSP === editingProduct.MaSP
              ? {
                  ...p,
                  TenSP: updateData.TenSP,
                  MaLoaiSP: updateData.MaLoaiSP,
                  MoTa: updateData.MoTa,
                  TrangThai: updateData.TrangThai,
                  AnhSanPhams: p.AnhSanPhams,
                }
              : p
          )
        );
        setEditingProduct(null);
        resetForm();
      } else {
        toast.error("Có lỗi xảy ra khi cập nhật sản phẩm");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Có lỗi xảy ra khi cập nhật sản phẩm");
    }
  };

  const handleToggleProductStatus = (product: ApiProduct) => {
    if (!canEdit) {
      return toast.error("Bạn không có quyền cập nhật sản phẩm");
    }
    setSelectedProduct(product);
    setStatusModalOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!selectedProduct) return;

    try {
      const newStatus = !selectedProduct.TrangThai;
      const result = await updateProductStatus(selectedProduct.MaSP, newStatus);

      if (result.success) {
        toast.success(`${newStatus ? "Hiển thị" : "Ẩn"} sản phẩm thành công!`);
        setAllProducts((prev) =>
          prev.map((p) =>
            p.MaSP === selectedProduct.MaSP ? { ...p, TrangThai: newStatus } : p
          )
        );
        setStatusModalOpen(false);
        setSelectedProduct(null);
      } else {
        toast.error(
          result.message || "Có lỗi xảy ra khi cập nhật trạng thái sản phẩm"
        );
      }
    } catch (error) {
      console.error("Error updating product status:", error);
      toast.error("Có lỗi xảy ra khi cập nhật trạng thái sản phẩm");
    }
  };

  const resetForm = () => {
    setProductForm({
      name: "",
      price: 0,
      images: [],
      category: "",
      description: "",
      status: true,
      priceChanged: false,
      priceApplyDate: "",
    });
    setFormattedPrice("");
    setImageUploadProgress({});
  };

  // Event handlers with useCallback to prevent re-renders
  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setProductForm((prev) => ({ ...prev, name: e.target.value }));
    },
    []
  );

  const handleCategoryChange = useCallback((value: string) => {
    setProductForm((prev) => ({ ...prev, category: value }));
  }, []);

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setProductForm((prev) => ({ ...prev, description: e.target.value }));
    },
    []
  );

  const handleStatusChange = useCallback((value: string) => {
    setProductForm((prev) => ({ ...prev, status: value === "true" }));
  }, []);

  const handlePriceApplyDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setProductForm((prev) => ({ ...prev, priceApplyDate: e.target.value }));
    },
    []
  );

  const handleImageUploadInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleImageUpload(e.target.files);
        e.target.value = "";
      }
    },
    []
  );

  const handleImageUploadClick = useCallback(() => {
    document.getElementById("imageUpload")?.click();
  }, []);

  const handleCancelEdit = useCallback(() => {
    if (editingProduct) {
      setEditingProduct(null);
    }
    resetForm();
  }, [editingProduct]);

  const ProductForm = useCallback(
    ({ isEdit = false }) => {
      // Get original price for comparison
      const originalPrice =
        isEdit && editingProduct
          ? getLatestPrice(editingProduct)
            ? parseFloat(getLatestPrice(editingProduct)!.Gia)
            : 0
          : 0;

      const handlePriceChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
          const inputValue = e.target.value;
          const numericValue = parseCurrencyInput(inputValue);
          const formatted = formatInputCurrency(numericValue);

          const hasChanged = isEdit
            ? numericValue !== originalPrice
            : numericValue !== 0;

          setFormattedPrice(formatted);
          setProductForm((prev) => ({
            ...prev,
            price: numericValue,
            priceChanged: hasChanged,
          }));
        },
        [isEdit, originalPrice]
      );

      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                Tên sản phẩm
              </Label>
              <Input
                id="name"
                className="text-sm outline-none"
                value={productForm.name}
                onChange={handleNameChange}
                placeholder="Nhập tên sản phẩm"
              />
            </div>

            <div>
              <Label htmlFor="category" className="text-sm font-medium">
                Danh mục
              </Label>
              <Select
                value={productForm.category}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {(Array.isArray(categories) ? categories : []).map((cat) => (
                    <SelectItem
                      key={cat.MaLoaiSP}
                      value={cat.MaLoaiSP.toString()}
                    >
                      {cat.TenLoai}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Price and Date Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price" className="text-sm font-medium">
                Giá bán (VNĐ)
                {isEdit && originalPrice > 0 && (
                  <span className="text-xs text-gray-500 ml-2">
                    (Hiện tại: {formatCurrency(originalPrice)})
                  </span>
                )}
              </Label>
              <Input
                id="price"
                type="text"
                className="text-sm"
                value={formattedPrice}
                onChange={handlePriceChange}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="priceApplyDate" className="text-sm font-medium">
                Ngày áp dụng giá{" "}
                {productForm.priceChanged && (
                  <span className="text-red-500">*</span>
                )}
              </Label>
              <Input
                id="priceApplyDate"
                type="date"
                className="text-sm outline-none"
                value={productForm.priceApplyDate}
                onChange={handlePriceApplyDateChange}
                disabled={!productForm.priceChanged}
                min={new Date().toISOString().split("T")[0]}
              />
              {productForm.priceChanged && (
                <p className="text-xs text-red-500 mt-1">
                  Bắt buộc chọn ngày áp dụng khi thay đổi giá
                </p>
              )}
            </div>
          </div>

          {/* Images Section */}
          <div>
            <Label className="text-sm font-medium">Hình ảnh sản phẩm</Label>
            <div className="space-y-3">
              {/* Current Images Display */}
              {productForm.images.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {productForm.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-[3/4] w-full overflow-hidden rounded border bg-gray-100">
                        <img
                          src={image}
                          alt={`Sản phẩm ${index + 1}`}
                          className="w-full h-full object-cover transition-all group-hover:opacity-75"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-1 -right-1 h-4 w-4 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          const newImages = productForm.images.filter(
                            (_, i) => i !== index
                          );
                          setProductForm((prev) => ({
                            ...prev,
                            images: newImages,
                          }));
                        }}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                      {index === 0 && (
                        <Badge className="absolute bottom-1 left-1 text-[10px] px-1 py-0 bg-green-500 hover:bg-green-600">
                          Chính
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Progress Display */}
              {Object.keys(imageUploadProgress).length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">
                    Đang tải lên...
                  </Label>
                  {Object.entries(imageUploadProgress).map(
                    ([key, progress]) => (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Đang tải ảnh...</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div
                            className="bg-[#825B32] h-1 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Upload Options */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#825B32] transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ImagePlus className="h-5 w-5 text-[#825B32]" />
                    <span className="text-sm font-medium text-gray-700">
                      Thêm ảnh ({productForm.images.length})
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs py-1 px-3 border-[#825B32] text-[#825B32] hover:bg-[#825B32] hover:text-white"
                    onClick={handleImageUploadClick}
                    disabled={Object.keys(imageUploadProgress).length > 0}
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Chọn ảnh
                  </Button>
                </div>

                <input
                  type="file"
                  id="imageUpload"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUploadInput}
                />

                <div className="text-center text-[10px] text-gray-500 space-y-1">
                  <p>
                    JPG, PNG, GIF • Tối đa 5MB mỗi ảnh • Ảnh đầu tiên làm ảnh
                    chính
                  </p>
                  <p>Khuyến nghị: 800x800px trở lên cho chất lượng tốt nhất</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Mô tả
            </Label>
            <Textarea
              id="description"
              className="text-sm"
              value={productForm.description}
              onChange={handleDescriptionChange}
              placeholder="Mô tả chi tiết sản phẩm"
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="status" className="text-sm font-medium">
              Trạng thái
            </Label>
            <Select
              value={productForm.status ? "true" : "false"}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Hoạt động</SelectItem>
                <SelectItem value="false">Dừng bán</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              className="text-sm px-4"
              onClick={handleCancelEdit}
            >
              Hủy
            </Button>
            <Button
              onClick={isEdit ? handleUpdateProduct : handleAddProduct}
              className="bg-[#825B32] hover:bg-[#6B4423] text-white text-sm px-4"
              disabled={productForm.priceChanged && !productForm.priceApplyDate}
            >
              <Save className="h-4 w-4 mr-2" />
              {isEdit ? "Cập nhật" : "Thêm"} sản phẩm
            </Button>
          </div>
        </div>
      );
    },
    [
      editingProduct,
      productForm,
      categories,
      handleNameChange,
      handleCategoryChange,
      handlePriceApplyDateChange,
      handleImageUploadClick,
      handleImageUploadInput,
      handleDescriptionChange,
      handleStatusChange,
      handleCancelEdit,
      imageUploadProgress,
      formatCurrency,
      handleImageUpload,
      handleUpdateProduct,
      handleAddProduct,
      getLatestPrice,
    ]
  );

  // Helper to render sort indicator
  const renderSortIndicator = (key: string) => {
    if (sortConfig.key !== key)
      return <ArrowUpDown className="h-3 w-3 inline ml-1 opacity-50" />;
    if (sortConfig.direction === "asc")
      return <ArrowUp className="h-3 w-3 inline ml-1" />;
    if (sortConfig.direction === "desc")
      return <ArrowDown className="h-3 w-3 inline ml-1" />;
    return null;
  };

  return (
    <div className="max-w-max">
      <Toaster position="top-center" richColors />
      <AdminHeader title="Quản lý sản phẩm" />

      <main className="py-4">
        <div className="px-1 sm:px-2 max-w-none w-full">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Quản lý sản phẩm
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Quản lý thông tin sản phẩm, kho và giá cả
                </p>
              </div>
              {canCreate && (
                <Button
                  className="bg-[#825B32] hover:bg-[#6B4423] text-white text-sm py-2 px-4"
                  onClick={handleAddProduct}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm sản phẩm
                </Button>
              )}
            </div>

            {/* Filters */}
            <Card className="w-full">
              <CardHeader className="pb-2 px-2">
                <CardTitle className="text-lg">Bộ lọc và tìm kiếm</CardTitle>
              </CardHeader>
              <CardContent className="px-2 pt-2">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      className="text-sm"
                      placeholder="Tìm kiếm sản phẩm..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                    />
                  </div>
                  <Select
                    value={selectedCategory}
                    onValueChange={handleCategoryFilterChange}
                  >
                    <SelectTrigger className="w-48 text-sm border-[#825B32] focus:ring-2 focus:ring-[#825B32]">
                      <SelectValue placeholder="Danh mục" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#825B32] shadow-lg">
                      <SelectItem value="all">Tất cả danh mục</SelectItem>
                      {(Array.isArray(categories) ? categories : []).map(
                        (cat) => (
                          <SelectItem
                            key={cat.MaLoaiSP}
                            value={cat.MaLoaiSP.toString()}
                            className="hover:bg-[#825B32]/10"
                          >
                            {cat.TenLoai}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Products Table */}
            <Card className="w-full">
              <CardHeader className="pb-2 px-2">
                <CardTitle className="text-lg">
                  Danh sách sản phẩm ({pagination.total})
                </CardTitle>
                <CardDescription className="text-sm">
                  Quản lý tất cả sản phẩm trong hệ thống
                </CardDescription>
              </CardHeader>
              <CardContent className="px-2 pt-2">
                <div className="w-full overflow-x-auto">
                  <Table className="w-full min-w-[1200px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead
                          onClick={() => handleSort("name")}
                          className="text-sm font-medium w-[25%] cursor-pointer select-none"
                        >
                          Sản phẩm {renderSortIndicator("name")}
                        </TableHead>
                        <TableHead className="text-sm font-medium w-[15%]">
                          Danh mục
                        </TableHead>
                        <TableHead
                          onClick={() => handleSort("price")}
                          className="text-sm font-medium w-[20%] cursor-pointer select-none"
                        >
                          Giá {renderSortIndicator("price")}
                        </TableHead>
                        <TableHead
                          onClick={() => handleSort("stock")}
                          className="text-sm font-medium w-[12%] cursor-pointer select-none"
                        >
                          Kho {renderSortIndicator("stock")}
                        </TableHead>
                        <TableHead
                          onClick={() => handleSort("rating")}
                          className="text-sm font-medium w-[10%] cursor-pointer select-none"
                        >
                          Đánh giá {renderSortIndicator("rating")}
                        </TableHead>
                        <TableHead className="text-sm font-medium w-[10%]">
                          Trạng thái
                        </TableHead>
                        <TableHead className="text-sm font-medium w-[8%]">
                          Thao tác
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center py-8 text-sm"
                          >
                            Đang tải dữ liệu...
                          </TableCell>
                        </TableRow>
                      ) : (Array.isArray(products) ? products : []).length ===
                        0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <span className="text-base font-semibold text-gray-700">
                                Không tìm thấy sản phẩm phù hợp
                              </span>
                              <span className="text-xs text-gray-500">
                                Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                                khác.
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        (Array.isArray(products) ? products : []).map(
                          (product) => {
                            const mainImage =
                              product.AnhSanPhams.find((img) => img.AnhChinh) ||
                              product.AnhSanPhams[0];
                            const totalStock = product.ChiTietSanPhams.reduce(
                              (sum, ct) => sum + ct.SoLuongTon,
                              0
                            );
                            const latestPrice = getLatestPrice(product);

                            return (
                              <TableRow key={product.MaSP}>
                                <TableCell className="py-3">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={
                                        mainImage?.DuongDan ||
                                        "/placeholder.jpg"
                                      }
                                      alt={product.TenSP}
                                      className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="font-medium text-sm truncate">
                                        {product.TenSP}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        ID: {product.MaSP}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm py-3">
                                  <div className="truncate">
                                    {product.LoaiSP.TenLoai}
                                  </div>
                                </TableCell>
                                <TableCell className="py-3">
                                  <div>
                                    <div className="font-medium text-sm">
                                      {latestPrice
                                        ? formatCurrency(latestPrice.Gia)
                                        : "Liên hệ"}
                                    </div>
                                    {latestPrice && (
                                      <div className="text-xs text-gray-500">
                                        Áp dụng:{" "}
                                        {new Date(
                                          latestPrice.NgayApDung
                                        ).toLocaleDateString("vi-VN")}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="py-3">
                                  <Badge
                                    variant={
                                      totalStock > 0 ? "default" : "destructive"
                                    }
                                    className="text-xs px-2 py-1"
                                    style={{
                                      backgroundColor:
                                        totalStock > 0 ? "#825B32" : undefined,
                                      color:
                                        totalStock > 0 ? "white" : undefined,
                                    }}
                                  >
                                    {totalStock > 0
                                      ? `Còn ${totalStock}`
                                      : "Hết hàng"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-3">
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm">
                                      {product.SoSaoTrungBinh
                                        ? parseFloat(
                                            product.SoSaoTrungBinh
                                          ).toFixed(2)
                                        : "-"}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      ({product.SoLuongBinhLuan ?? 0})
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="py-3">
                                  <Badge
                                    variant={
                                      product.TrangThai
                                        ? "default"
                                        : "secondary"
                                    }
                                    className="text-xs px-2 py-1 text-nowrap"
                                    style={{
                                      backgroundColor: product.TrangThai
                                        ? "#825B32"
                                        : "#6B7280",
                                      color: "white",
                                    }}
                                  >
                                    {product.TrangThai
                                      ? "Hoạt động"
                                      : "Dừng bán"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-3">
                                  <div className="flex gap-1 justify-center">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 w-7 p-0"
                                      title="Xem chi tiết sản phẩm"
                                      onClick={() =>
                                        handleViewProductDetail(product.MaSP)
                                      }
                                    >
                                      <Info className="h-3 w-3" />
                                    </Button>
                                    {canEdit && (
                                      <>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-7 w-7 p-0"
                                          onClick={() =>
                                            handleEditProduct(product)
                                          }
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                        {/* <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-7 w-7 p-0"
                                          onClick={() =>
                                            handleToggleProductStatus(product)
                                          }
                                          title={
                                            product.TrangThai
                                              ? "Ẩn sản phẩm"
                                              : "Hiển thị sản phẩm"
                                          }
                                        >
                                          {product.TrangThai ? (
                                            <EyeOff className="h-3 w-3" />
                                          ) : (
                                            <Eye className="h-3 w-3" />
                                          )}
                                        </Button> */}
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          }
                        )
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>Hiển thị</span>
                      <select
                        value={pagination.pageSize}
                        onChange={(e) =>
                          handlePageSizeChange(Number(e.target.value))
                        }
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value={8}>8</option>
                        <option value={16}>16</option>
                        <option value={24}>24</option>
                        <option value={50}>50</option>
                      </select>
                      <span>trên {pagination.total} sản phẩm</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                        className="h-8 px-3"
                      >
                        Trước
                      </Button>

                      <div className="flex gap-1">
                        {Array.from(
                          { length: Math.min(5, pagination.totalPages) },
                          (_, i) => {
                            let pageNum;
                            if (pagination.totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (pagination.page <= 3) {
                              pageNum = i + 1;
                            } else if (
                              pagination.page >=
                              pagination.totalPages - 2
                            ) {
                              pageNum = pagination.totalPages - 4 + i;
                            } else {
                              pageNum = pagination.page - 2 + i;
                            }

                            return (
                              <Button
                                key={pageNum}
                                variant={
                                  pagination.page === pageNum
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => handlePageChange(pageNum)}
                                className={`h-8 w-8 p-0 ${
                                  pagination.page === pageNum
                                    ? "bg-[#825B32] text-white hover:bg-[#6B4728]"
                                    : ""
                                }`}
                              >
                                {pageNum}
                              </Button>
                            );
                          }
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages}
                        className="h-8 px-3"
                      >
                        Sau
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Edit Product Dialog */}
            <Dialog
              open={!!editingProduct}
              onOpenChange={(open) => {
                if (!open) {
                  setEditingProduct(null);
                  resetForm();
                }
              }}
            >
              <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold">
                    Chỉnh sửa sản phẩm
                  </DialogTitle>
                  <DialogDescription className="text-sm">
                    Cập nhật thông tin sản phẩm:{" "}
                    <span className="font-medium">{editingProduct?.TenSP}</span>
                  </DialogDescription>
                </DialogHeader>
                {ProductForm({ isEdit: true })}
              </DialogContent>
            </Dialog>

            {/* Status Change Confirmation Dialog */}
            <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {selectedProduct?.TrangThai
                      ? "Ẩn sản phẩm"
                      : "Hiển thị sản phẩm"}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedProduct?.TrangThai
                      ? `Bạn có chắc chắn muốn ẩn sản phẩm "${selectedProduct?.TenSP}" không? Sản phẩm sẽ không hiển thị trên website.`
                      : `Bạn có chắc chắn muốn hiển thị sản phẩm "${selectedProduct?.TenSP}" không? Sản phẩm sẽ được hiển thị trên website.`}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStatusModalOpen(false);
                      setSelectedProduct(null);
                    }}
                    className="text-sm px-4"
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={confirmToggleStatus}
                    className="bg-[#825B32] hover:bg-[#6B4423] text-white text-sm px-4"
                  >
                    {selectedProduct?.TrangThai
                      ? "Ẩn sản phẩm"
                      : "Hiển thị sản phẩm"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </main>
    </div>
  );
}
