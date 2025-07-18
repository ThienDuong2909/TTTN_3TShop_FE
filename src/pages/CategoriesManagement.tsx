"use client"
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster } from "sonner";

type Category = {
  MaLoaiSP: number;
  TenLoai: string;
  hinhanh?: string;
};
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Search } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { toast } from "sonner";


export default function CategoriesManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/category");
        const result = await res.json();
        console.log("Fetched categories:", result.data);
        if (result && result.success && Array.isArray(result.data)) {
          console.log("Fetched categories:", result.data);
          setCategories(result.data);
        } else if (Array.isArray(result)) {
          setCategories(result);
        } else {
          setCategories([]);
        }
      } catch (err) {
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
    hinhanh: "",
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const handleAdd = () => {
    setEditingCategory(null);
    setFormData({ TenLoai: "", hinhanh: "" });
    setIsModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({ TenLoai: category.TenLoai, hinhanh: category.hinhanh || "" });
    setIsModalOpen(true);
  };

  const handleDelete = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (categoryToDelete) {
      try {
        const res = await fetch(`http://localhost:8080/api/category/${categoryToDelete.MaLoaiSP}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setCategories((prev) => prev.filter((c) => c.MaLoaiSP !== categoryToDelete.MaLoaiSP));
          toast.success("Xóa thành công!");
        } else {
          toast.error("Xóa thất bại!");
        }
      } catch {
        toast.error("Xóa thất bại!");
      }
      setCategoryToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCategory) {
      // Update category
      try {
        const res = await fetch(`http://localhost:8080/api/category/${editingCategory.MaLoaiSP}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ TenLoai: formData.TenLoai, hinhanh: formData.hinhanh }),
        });
        if (res.ok) {
          toast.success("Cập nhật thành công!");
          setCategories((prev) =>
            prev.map((c) =>
              c.MaLoaiSP === editingCategory.MaLoaiSP ? { ...c, TenLoai: formData.TenLoai } : c
            )
          );
        } else {
          toast.error("Cập nhật thất bại!");
        }
      } catch {
        toast.error("Cập nhật thất bại!");
      }
    } else {
      // Add new category
      try {
        const res = await fetch("http://localhost:8080/api/category", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ TenLoai: formData.TenLoai, hinhanh: formData.hinhanh }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.data) {
            setCategories((prev) => [...prev, data.data]);
          }
          toast.success("Thêm thành công!");
        } else {
          toast.error("Thêm thất bại!");
        }
      } catch {
        toast.error("Thêm thất bại!");
      }
    }

    setIsModalOpen(false);
    setEditingCategory(null);
  };

  // Get all parent categories for dropdown


  // Filtered categories by search
  const filteredCategories = categories.filter((cat) =>
    cat.TenLoai.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <Toaster position="top-center" richColors />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý danh mục sản phẩm</h1>
        <Button onClick={handleAdd}>Thêm danh mục</Button>
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
              <TableRow key={cat.MaLoaiSP} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                <TableCell>
                  <div className="flex items-center justify-center">
                    {cat.hinhanh ? (
                      <img
                        src={cat.hinhanh}
                        alt={cat.TenLoai}
                        className="w-12 h-12 object-cover rounded border"
                        onError={e => (e.currentTarget.src = '/default-category.png')}
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
                  <div className="font-semibold text-gray-900 dark:text-white text-base">{cat.TenLoai}</div>
                </TableCell>
                <TableCell>
                  <span className="text-gray-700 text-sm">--</span>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                    onClick={() => handleEdit(cat)}
                    className="hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30"
                    title="Sửa"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13h3l8-8a2.828 2.828 0 00-4-4l-8 8v3zm0 0v3a2 2 0 002 2h3" /></svg>
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                    onClick={() => handleDelete(cat)}
                    className="hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
                    title="Xóa"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </Button>
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
            <DialogTitle>{editingCategory ? "Sửa danh mục" : "Thêm danh mục mới"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="TenLoai">Tên danh mục *</Label>
                <Input
                  id="TenLoai"
                  value={formData.TenLoai}
                  onChange={(e) => setFormData({ ...formData, TenLoai: e.target.value })}
                  required
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="hinhanh">Đường dẫn hình ảnh</Label>
                <Input
                  id="hinhanh"
                  placeholder="https://..."
                  value={formData.hinhanh}
                  onChange={(e) => setFormData({ ...formData, hinhanh: e.target.value })}
                  className="mt-2"
                />
                {formData.hinhanh && (
                  <div className="mt-3 flex flex-col items-start gap-2">
                    <span className="text-xs text-gray-500">Xem trước:</span>
                    <img
                      src={formData.hinhanh}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded border"
                      onError={e => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
              <Button type="submit">{editingCategory ? "Cập nhật" : "Thêm mới"}</Button>
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
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Hủy</Button>
              <Button variant="destructive" onClick={confirmDelete}>Xóa</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};