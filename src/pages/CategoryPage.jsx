import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProductCard } from "../components/ProductCard.tsx";
import { getProductsByCategory, getCategoryById } from "../services/api";
import { mapSanPhamFromApi } from "../utils/productMapper";
import { useApp } from "../contexts/AppContext";
import { 
  GridIcon,
  List,
  ArrowLeft
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";

export default function CategoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("grid");
  const [sort, setSort] = useState("default");
  const { toggleWishlist, isInWishlist, addToCart } = useApp();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Lấy thông tin category
        try {
          const categoryData = await getCategoryById(Number(id));
          setCategoryName(categoryData.TenLoai || "Danh mục sản phẩm");
        } catch (error) {
          console.error("Lỗi khi lấy thông tin danh mục:", error);
          setCategoryName("Danh mục sản phẩm");
        }

        // Lấy sản phẩm theo category
        const res = await getProductsByCategory(Number(id));
        console.log("Sản phẩm theo loại:", res);
        const productArray = Array.isArray(res) ? res : res.data;
        const mapped = productArray.map(mapSanPhamFromApi);
        setProducts(mapped);
      } catch (error) {
        console.error("Lỗi khi lấy sản phẩm theo loại:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const sortedProducts = [...products].sort((a, b) => {
    switch (sort) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "newest":
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      case "bestseller":
        return (b.totalSold || 0) - (a.totalSold || 0);
      default:
        return 0;
    }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header với nút Back */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {categoryName}
            </h1>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300 ml-14">
          Khám phá các sản phẩm trong danh mục này
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-4 items-center justify-between mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-2">
          <Button
            variant={view === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setView("grid")}
          >
            <GridIcon className="h-4 w-4" />
          </Button>
          <div className="hidden md:block h-6 w-px bg-gray-200 dark:bg-gray-700" />
          <span className="hidden md:block text-sm text-gray-500 dark:text-gray-400">
            {products.length} sản phẩm
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sắp xếp theo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Mặc định</SelectItem>
              <SelectItem value="newest">Mới nhất</SelectItem>
              <SelectItem value="bestseller">Bán chạy nhất</SelectItem>
              <SelectItem value="price-asc">Giá tăng dần</SelectItem>
              <SelectItem value="price-desc">Giá giảm dần</SelectItem>
              <SelectItem value="name-asc">Tên A-Z</SelectItem>
              <SelectItem value="name-desc">Tên Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Grid/List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="w-full aspect-square rounded-xl" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex items-center justify-center h-80">
          <div className="text-center text-muted-foreground">
            <GridIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Chưa có sản phẩm</p>
            <p className="text-sm">Danh mục này hiện chưa có sản phẩm nào</p>
          </div>
        </div>
      ) : (
        <div
          className={
            view === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6"
              : "flex flex-col gap-6"
          }
        >
          {sortedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isLiked={isInWishlist(product.id)}
              onToggleLike={toggleWishlist}
              onAddToCart={(p) => addToCart(p, 1)}
              view={view}
            />
          ))}
        </div>
      )}
    </div>
  );
}