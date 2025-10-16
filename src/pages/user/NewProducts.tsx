import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getNewProducts } from "../../services/api";
import { ProductCard, Product } from "../../components/ProductCard.tsx";
import { useApp } from "../../contexts/AppContext.tsx";
import { GridIcon, ArrowLeft } from "lucide-react";
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

export default function NewProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState("price-asc");
  const { toggleWishlist, isInWishlist, addToCart } = useApp();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getNewProducts();
        const mapped = data.map((p) => ({
          ...mapSanPhamFromApi(p),
          isNew: true,
        }));
        setProducts(mapped);
      } catch (error) {
        console.error("Failed to fetch new products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

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
              Sản phẩm mới
            </h1>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300 ml-14">
          Khám phá những sản phẩm mới nhất vừa ra mắt
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
