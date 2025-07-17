import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Upload,
  Save,
  X,
  Star,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Separator } from "../components/ui/separator";
import { useApp } from "../contexts/AppContext";
import { products, categories } from "../libs/data";
import { Product } from "../components/ProductCard";

export default function ProductManagement() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state for add/edit product
  const [productForm, setProductForm] = useState({
    name: "",
    price: 0,
    originalPrice: 0,
    image: "",
    category: "",
    colors: [] as string[],
    sizes: [] as string[],
    description: "",
  });

  // Check permissions
  if (
    !state.user ||
    (state.user.role !== "admin" && state.user.role !== "staff") ||
    (!state.user.permissions?.includes("all") &&
      !state.user.permissions?.includes("view_products"))
  ) {
    navigate("/");
    return null;
  }

  const canEdit =
    state.user.role === "admin" ||
    state.user.permissions?.includes("manage_products");

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" ||
      product.category?.startsWith(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const handleAddProduct = () => {
    // Mock add product logic
    console.log("Adding product:", productForm);
    setIsAddProductOpen(false);
    resetForm();
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice || 0,
      image: product.image,
      category: product.category || "",
      colors: product.colors || [],
      sizes: product.sizes || [],
      description: "Mô tả sản phẩm...",
    });
  };

  const handleUpdateProduct = () => {
    // Mock update product logic
    console.log("Updating product:", editingProduct?.id, productForm);
    setEditingProduct(null);
    resetForm();
  };

  const handleDeleteProduct = (productId: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này không?")) {
      // Mock delete logic
      console.log("Deleting product:", productId);
    }
  };

  const resetForm = () => {
    setProductForm({
      name: "",
      price: 0,
      originalPrice: 0,
      image: "",
      category: "",
      colors: [],
      sizes: [],
      description: "",
    });
  };

  const ProductForm = ({ isEdit = false }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Tên sản phẩm</Label>
          <Input
            id="name"
            value={productForm.name}
            onChange={(e) =>
              setProductForm({ ...productForm, name: e.target.value })
            }
            placeholder="Nhập tên sản phẩm"
          />
        </div>

        <div>
          <Label htmlFor="category">Danh mục</Label>
          <Select
            value={productForm.category}
            onValueChange={(value) =>
              setProductForm({ ...productForm, category: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn danh mục" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Giá bán</Label>
          <Input
            id="price"
            type="number"
            value={productForm.price}
            onChange={(e) =>
              setProductForm({
                ...productForm,
                price: parseInt(e.target.value) || 0,
              })
            }
            placeholder="0"
          />
        </div>

        <div>
          <Label htmlFor="originalPrice">Giá gốc (tùy chọn)</Label>
          <Input
            id="originalPrice"
            type="number"
            value={productForm.originalPrice}
            onChange={(e) =>
              setProductForm({
                ...productForm,
                originalPrice: parseInt(e.target.value) || 0,
              })
            }
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="image">Hình ảnh sản phẩm</Label>
        <div className="flex gap-2">
          <Input
            id="image"
            value={productForm.image}
            onChange={(e) =>
              setProductForm({ ...productForm, image: e.target.value })
            }
            placeholder="URL hình ảnh hoặc upload"
          />
          <Button variant="outline" type="button">
            <Upload className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Mô tả</Label>
        <Textarea
          id="description"
          value={productForm.description}
          onChange={(e) =>
            setProductForm({ ...productForm, description: e.target.value })
          }
          placeholder="Mô tả chi tiết sản phẩm"
          rows={4}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Màu sắc (nhập mã màu, cách nhau bởi dấu phẩy)</Label>
          <Input
            value={productForm.colors.join(", ")}
            onChange={(e) =>
              setProductForm({
                ...productForm,
                colors: e.target.value.split(", ").filter(Boolean),
              })
            }
            placeholder="#000000, #ffffff, #ff0000"
          />
        </div>

        <div>
          <Label>Kích thước (cách nhau bởi dấu phẩy)</Label>
          <Input
            value={productForm.sizes.join(", ")}
            onChange={(e) =>
              setProductForm({
                ...productForm,
                sizes: e.target.value.split(", ").filter(Boolean),
              })
            }
            placeholder="S, M, L, XL"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            if (isEdit) {
              setEditingProduct(null);
            } else {
              setIsAddProductOpen(false);
            }
            resetForm();
          }}
        >
          Hủy
        </Button>
        <Button
          onClick={isEdit ? handleUpdateProduct : handleAddProduct}
          className="bg-brand-600 hover:bg-brand-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {isEdit ? "Cập nhật" : "Thêm"} sản phẩm
        </Button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Quản lý sản phẩm
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Quản lý thông tin sản phẩm, kho và giá cả
            </p>
          </div>
          {canEdit && (
            <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
              <DialogTrigger asChild>
                <Button className="bg-brand-600 hover:bg-brand-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm sản phẩm
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Thêm sản phẩm mới</DialogTitle>
                  <DialogDescription>
                    Nhập thông tin chi tiết cho sản phẩm mới
                  </DialogDescription>
                </DialogHeader>
                <ProductForm />
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Bộ lọc và tìm kiếm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Lọc
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Danh sách sản phẩm ({filteredProducts.length})
            </CardTitle>
            <CardDescription>
              Quản lý tất cả sản phẩm trong hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Kho</TableHead>
                  <TableHead>Đánh giá</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {product.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {categories.find(
                        (cat) =>
                          cat.id === product.category?.split("-")[0] ||
                          cat.subcategories?.some(
                            (sub) => sub.id === product.category,
                          ),
                      )?.name || "Khác"}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {formatPrice(product.price)}
                        </div>
                        {product.originalPrice && (
                          <div className="text-sm text-muted-foreground line-through">
                            {formatPrice(product.originalPrice)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">Còn hàng</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{product.rating}</span>
                        <span className="text-sm text-muted-foreground">
                          ({product.reviews})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">Hoạt động</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3" />
                        </Button>
                        {canEdit && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditProduct(product)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa sản phẩm</DialogTitle>
              <DialogDescription>
                Cập nhật thông tin sản phẩm: {editingProduct?.name}
              </DialogDescription>
            </DialogHeader>
            <ProductForm isEdit />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
