import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getSearchProducts, getAllProducts } from "../services/api";
import { mapSanPhamFromApi } from "../utils/productMapper";
import { ProductCard } from "../components/ProductCard";
import { useApp } from "../contexts/AppContext";
import { 
  ChevronRight, 
  GridIcon,
  List,
  ArrowLeft,
  Search,
  Package
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

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function SearchResults() {
  const query = useQuery().get("keyword") || "";
  const navigate = useNavigate();
  const { toggleWishlist, isInWishlist, addToCart } = useApp();
  
  // Data states
  const [products, setProducts] = useState([]);
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [suggestedLoading, setSuggestedLoading] = useState(true);
  
  // UI states
  const [view, setView] = useState("grid");
  const [sort, setSort] = useState("relevance");

  // Fetch search results
  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setProducts([]);
    
    getSearchProducts(query)
      .then((res) => {
        const mapped = (res || []).map(mapSanPhamFromApi);
        setProducts(mapped);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Lỗi khi tìm kiếm:", error);
        setLoading(false);
      });
  }, [query]);

  // Fetch suggested products
  useEffect(() => {
    setSuggestedLoading(true);
    setSuggestedProducts([]);
    
    getAllProducts()
      .then((res) => {
        const mapped = (res || []).map(mapSanPhamFromApi);
        setSuggestedProducts(mapped);
        setSuggestedLoading(false);
      })
      .catch((error) => {
        console.error("Lỗi khi lấy sản phẩm gợi ý:", error);
        setSuggestedLoading(false);
        setSuggestedProducts([]);
      });
  }, []);

  // Sort products
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
      case "relevance":
      default:
        return 0;
    }
  });

  // Skeleton components
  const ProductGridSkeleton = ({ count = 8 }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="space-y-4">
          <div className="w-full aspect-[3/4] rounded-xl shimmer" />
          <div className="space-y-2">
            <div className="h-12 w-full shimmer rounded" />
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-4 h-4 shimmer rounded" />
              ))}
              <div className="h-4 w-12 ml-2 shimmer rounded" />
            </div>
            <div className="h-6 w-20 shimmer rounded" />
          </div>
        </div>
      ))}
    </div>
  );

  const SuggestedProductsSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="space-y-4">
          <div className="w-full aspect-[3/4] rounded-xl shimmer" />
          <div className="space-y-2">
            <div className="h-12 w-full shimmer rounded" />
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-4 h-4 shimmer rounded" />
              ))}
              <div className="h-4 w-12 ml-2 shimmer rounded" />
            </div>
            <div className="h-6 w-20 shimmer rounded" />
          </div>
        </div>
      ))}
    </div>
  );

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
          <div className="flex items-center gap-3">
            
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Kết quả tìm kiếm
              </h1>
            </div>
          </div>
        </div>
        <div className="ml-14">
          <p className="text-gray-600 dark:text-gray-300">
            {query ? (
              <>
                Từ khóa: <span className="font-semibold text-blue-600">"{query}"</span>
                {!loading && (
                  <span className="ml-2 text-sm">
                    ({products.length} sản phẩm)
                  </span>
                )}
              </>
            ) : (
              "Vui lòng nhập từ khóa tìm kiếm"
            )}
          </p>
        </div>
      </div>

      {/* Search Results Section */}
      <section className="mb-16">
        {query && (
          <>
            {/* Toolbar */}
            <div className="flex flex-wrap gap-4 items-center justify-between mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2">
                <Button
                  variant={view === "grid" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setView("grid")}
                  disabled={loading}
                >
                  <GridIcon className="h-4 w-4" />
                </Button>
                {/* <Button
                  variant={view === "list" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setView("list")}
                  disabled={loading}
                >
                  <List className="h-4 w-4" />
                </Button> */}
                <div className="hidden md:block h-6 w-px bg-gray-200 dark:bg-gray-700" />
                <span className="hidden md:block text-sm text-gray-500 dark:text-gray-400">
                  {loading ? "Đang tìm kiếm..." : `${products.length} sản phẩm`}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <Select value={sort} onValueChange={setSort} disabled={loading}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sắp xếp theo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Liên quan nhất</SelectItem>
                    <SelectItem value="price-asc">Giá tăng dần</SelectItem>
                    <SelectItem value="price-desc">Giá giảm dần</SelectItem>
                    <SelectItem value="name-asc">Tên A-Z</SelectItem>
                    <SelectItem value="name-desc">Tên Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Search Results */}
            {loading ? (
              <ProductGridSkeleton />
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl max-w-md mx-auto">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Không tìm thấy sản phẩm
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Không có sản phẩm nào phù hợp với từ khóa "{query}"
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/")}
                    className="mx-auto"
                  >
                    Về trang chủ
                  </Button>
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
                    onAddToCart={(product) => addToCart(product, 1)}
                    view={view}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* Suggested Products Section */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                {query && products.length === 0 ? "Sản phẩm tương tự" : "Sản phẩm bạn có thể quan tâm"}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Gợi ý dành cho bạn
              </p>
            </div>
          </div>
          <Button variant="outline" className="hidden md:flex items-center">
            Xem tất cả
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {suggestedLoading ? (
          <SuggestedProductsSkeleton />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {suggestedProducts.slice(0, 5).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isLiked={isInWishlist(product.id)}
                onToggleLike={toggleWishlist}
                onAddToCart={(product) => addToCart(product, 1)}
              />
            ))}
          </div>
        )}

        <div className="text-center mt-8 md:hidden">
          <Button variant="outline">
            Xem tất cả
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}