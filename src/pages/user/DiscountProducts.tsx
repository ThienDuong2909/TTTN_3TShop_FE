import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDiscountProducts } from "../../services/api";
import { ProductCard, Product } from "../../components/ProductCard.tsx";
import { useApp } from "../../contexts/AppContext.tsx";
import { GridIcon, List, ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.tsx";
import { Button } from "../../components/ui/button.tsx";
import { Skeleton } from "../../components/ui/skeleton.tsx";
import { mapSanPhamFromApi } from "../../utils/productMapper.ts";

export default function DiscountProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState("discount-desc");
  const { toggleWishlist, isInWishlist, addToCart } = useApp();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getDiscountProducts();
        const mapped = data.map(mapSanPhamFromApi);
        setProducts(mapped);
      } catch (error) {
        console.error("Failed to fetch discount products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const sortedProducts = [...products].sort((a, b) => {
    switch (sort) {
      case "discount-desc":
        // Sắp xếp theo % giảm giá từ cao đến thấp
        const discountA = a.originalPrice
          ? ((a.originalPrice - a.price) / a.originalPrice) * 100
          : 0;
        const discountB = b.originalPrice
          ? ((b.originalPrice - b.price) / b.originalPrice) * 100
          : 0;
        return discountB - discountA;
      case "discount-asc":
        // Sắp xếp theo % giảm giá từ thấp đến cao
        const discountA2 = a.originalPrice
          ? ((a.originalPrice - a.price) / a.originalPrice) * 100
          : 0;
        const discountB2 = b.originalPrice
          ? ((b.originalPrice - b.price) / b.originalPrice) * 100
          : 0;
        return discountA2 - discountB2;
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
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
              Sản phẩm giảm giá
            </h1>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300 ml-14">
          Khám phá những sản phẩm đang có ưu đãi hấp dẫn
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
              <SelectItem value="discount-desc">Giảm giá nhiều nhất</SelectItem>
              <SelectItem value="discount-asc">Giảm giá ít nhất</SelectItem>
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
