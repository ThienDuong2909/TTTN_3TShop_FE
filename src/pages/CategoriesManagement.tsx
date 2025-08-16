"use client";
import React, { useState, useEffect, useRef } from "react";
import { Toaster } from "sonner";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/api";

type Category = {
  MaLoaiSP: number;
  TenLoai: string;
  NgayTao: string;
  HinhMinhHoa?: string;
};

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Edit2,
  Search,
  Trash2,
  Upload,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Progress } from "../components/ui/progress";
import { toast } from "sonner";
import { CLOUDINARY_CONFIG } from "../config/cloudinary";
import { usePermission } from "../components/PermissionGuard";

// Helper function to format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function CategoriesManagement() {
  const { hasPermission } = usePermission();
  const canCreate = hasPermission("danhmuc.tao") || hasPermission("toanquyen");
  const canEdit = hasPermission("danhmuc.sua") || hasPermission("toanquyen");
  const canDelete = hasPermission("danhmuc.xoa") || hasPermission("toanquyen");
  const [categories, setCategories] = useState<Category[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await getCategories();
        console.log("Fetched categories:", result);
        setCategories(result);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    TenLoai: "",
    HinhMinhHoa: "",
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");

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
      throw error;
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh hợp lệ!");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước file không được vượt quá 5MB!");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create image preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Simulate progress (Cloudinary doesn't provide real progress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const imageUrl = await uploadImageToCloudinary(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      setFormData((prev) => ({ ...prev, HinhMinhHoa: imageUrl }));
      toast.success("Upload ảnh thành công!");
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Upload ảnh thất bại!");
      setImagePreview("");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, HinhMinhHoa: "" }));
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAdd = () => {
    if (!canCreate) {
      toast.error("Bạn không có quyền thêm danh mục");
      return;
    }
    setEditingCategory(null);
    setFormData({ TenLoai: "", HinhMinhHoa: "" });
    setImagePreview("");
    setIsModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    if (!canEdit) {
      toast.error("Bạn không có quyền sửa danh mục");
      return;
    }
    setEditingCategory(category);
    setFormData({
      TenLoai: category.TenLoai,
      HinhMinhHoa: category.HinhMinhHoa || "",
    });
    setImagePreview(category.HinhMinhHoa || "");
    setIsModalOpen(true);
  };

  const handleDelete = (category: Category) => {
    if (!canDelete) {
      toast.error("Bạn không có quyền xóa danh mục");
      return;
    }
    setCategoryToDelete(category);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (categoryToDelete) {
      if (!canDelete) {
        toast.error("Bạn không có quyền xóa danh mục");
        setCategoryToDelete(null);
        setDeleteConfirmOpen(false);
        return;
      }
      try {
        const result = await deleteCategory(categoryToDelete.MaLoaiSP);
        if (result && !result.error) {
          setCategories((prev) =>
            prev.filter((c) => c.MaLoaiSP !== categoryToDelete.MaLoaiSP)
          );
          toast.success("Xóa thành công!");
        } else {
          toast.error(result?.message || "Xóa thất bại!");
        }
      } catch (error) {
        console.error("Error deleting category:", error);
        toast.error("Xóa thất bại!");
      }
      setCategoryToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCategory) {
      if (!canEdit) {
        toast.error("Bạn không có quyền sửa danh mục");
        return;
      }
      // Update category
      try {
        const result = await updateCategory(editingCategory.MaLoaiSP, {
          TenLoai: formData.TenLoai,
          HinhMinhHoa: formData.HinhMinhHoa,
        });

        if (result && !result.error) {
          toast.success("Cập nhật thành công!");
          setCategories((prev) =>
            prev.map((c) =>
              c.MaLoaiSP === editingCategory.MaLoaiSP
                ? {
                    ...c,
                    TenLoai: formData.TenLoai,
                    HinhMinhHoa: formData.HinhMinhHoa,
                  }
                : c
            )
          );
        } else {
          toast.error(result?.message || "Cập nhật thất bại!");
        }
      } catch (error) {
        console.error("Error updating category:", error);
        toast.error("Cập nhật thất bại!");
      }
    } else {
      // Add new category
      if (!canCreate) {
        toast.error("Bạn không có quyền thêm danh mục");
        return;
      }
      try {
        const result = await createCategory({
          TenLoai: formData.TenLoai,
          HinhMinhHoa: formData.HinhMinhHoa,
        });

        if (result && !result.error && result.data) {
          setCategories((prev) => [...prev, result.data]);
        }
      } catch (error) {
        console.error("Error creating category:", error);
        toast.error("Thêm thất bại!");
      }
    }

    setIsModalOpen(false);
    setEditingCategory(null);
  };

  // Filtered categories by search
  const filteredCategories = categories.filter((cat) =>
    cat.TenLoai.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <Toaster position="top-center" richColors />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý danh mục sản phẩm</h1>
        <Button onClick={handleAdd} disabled={!canCreate}>
          Thêm danh mục
        </Button>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <div className="relative w-full max-w-xs">
          <Input
            placeholder="Tìm kiếm danh mục..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-2"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Search className="w-5 h-5" />
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Hình ảnh</TableHead>
              <TableHead className="min-w-[200px]">Tên danh mục</TableHead>
              <TableHead className="w-40">Ngày tạo</TableHead>
              <TableHead className="w-32 text-center">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.map((cat) => (
              <TableRow
                key={cat.MaLoaiSP}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <TableCell>
                  <div className="flex items-center justify-center">
                    {cat.HinhMinhHoa ? (
                      <img
                        src={cat.HinhMinhHoa}
                        alt={cat.TenLoai}
                        className="w-24 h-20 object-cover rounded border"
                        onError={(e) =>
                          (e.currentTarget.src = "/default-category.png")
                        }
                      />
                    ) : (
                      <img
                        src="../assets/image/default_img.png"
                        alt="No image"
                        className="w-12 h-12 object-cover rounded border"
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-semibold text-gray-900 dark:text-white text-base">
                    {cat.TenLoai}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-gray-700 text-sm">
                    {formatDate(cat.NgayTao)}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 hover:shadow-md"
                      title="Sửa danh mục"
                      disabled={!canEdit}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-200 hover:shadow-md"
                      title="Xóa danh mục"
                      disabled={!canDelete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Sửa danh mục" : "Thêm danh mục mới"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="TenLoai">Tên danh mục *</Label>
                <Input
                  id="TenLoai"
                  value={formData.TenLoai}
                  onChange={(e) =>
                    setFormData({ ...formData, TenLoai: e.target.value })
                  }
                  required
                  className="mt-2"
                />
              </div>

              {/* Image Upload Section */}
              <div>
                <Label>Hình minh họa</Label>
                <div className="mt-2 space-y-4">
                  {/* Upload from device */}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploading ? "Đang upload..." : "Chọn ảnh từ thiết bị"}
                    </Button>
                  </div>

                  {/* Upload Progress */}
                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Đang upload...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="w-full" />
                    </div>
                  )}

                  {/* Manual URL Input */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="HinhMinhHoa"
                      className="text-sm text-gray-600"
                    >
                      Hoặc nhập URL ảnh:
                    </Label>
                    <Input
                      id="HinhMinhHoa"
                      placeholder="https://example.com/image.jpg"
                      value={formData.HinhMinhHoa}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          HinhMinhHoa: e.target.value,
                        });
                        setImagePreview(e.target.value);
                      }}
                      className="w-full"
                    />
                  </div>

                  {/* Image Preview */}
                  {(imagePreview || formData.HinhMinhHoa) && (
                    <div className="relative">
                      <div className="flex items-start gap-3 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                        <img
                          src={imagePreview || formData.HinhMinhHoa}
                          alt="Preview"
                          className="w-24 h-24 object-cover rounded border"
                          onError={() => {
                            setImagePreview("");
                            if (!imagePreview) {
                              setFormData((prev) => ({
                                ...prev,
                                HinhMinhHoa: "",
                              }));
                            }
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                            Xem trước hình ảnh
                          </div>
                          <div className="text-xs text-gray-500 break-all">
                            {(imagePreview || formData.HinhMinhHoa).length > 50
                              ? `${(
                                  imagePreview || formData.HinhMinhHoa
                                ).substring(0, 50)}...`
                              : imagePreview || formData.HinhMinhHoa}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeImage}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {!imagePreview && !formData.HinhMinhHoa && (
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                      <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        Chưa có hình ảnh
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Chọn ảnh từ thiết bị hoặc nhập URL
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading
                  ? "Đang upload..."
                  : editingCategory
                  ? "Cập nhật"
                  : "Thêm mới"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal xác nhận xóa */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-center">
            <div className="mb-2 text-base">
              Bạn có chắc chắn muốn xóa danh mục
            </div>
            <div className="mb-2 text-lg font-semibold text-red-600">
              {categoryToDelete?.TenLoai}
            </div>
            <div className="flex justify-evenly gap-4 mt-4">
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
}
