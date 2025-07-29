import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getSearchProducts, getAllProducts } from "../services/api";
import { mapSanPhamFromApi } from "../utils/productMapper";
import { ProductCard } from "../components/ProductCard";
import { useApp } from "../contexts/AppContext";
import { ChevronRight } from "lucide-react";
import { Button } from "../components/ui/button";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function SearchResults() {
  const query = useQuery().get("keyword") || "";
  const { toggleWishlist, isInWishlist, addToCart } = useApp();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    getSearchProducts(query)
      .then((res) => {
        const mapped = (res || []).map(mapSanPhamFromApi);
        setProducts(mapped);
      })
      .finally(() => setLoading(false));
  }, [query]);
  const [suggestedProducts, setSuggestedProducts] = useState([]);

useEffect(() => {
  getAllProducts()
    .then((res) => {
      const mapped = (res || []).map(mapSanPhamFromApi);
      setSuggestedProducts(mapped);
    })
    .catch(() => setSuggestedProducts([]));
}, []);

  return (
    <>
    <section className="py-8 bg-gray-50 dark:bg-gray-900 min-h-[60vh]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Kết quả tìm kiếm
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {query ? `Từ khóa: "${query}"` : "Vui lòng nhập từ khóa tìm kiếm"}
            </p>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-12 text-lg">Đang tìm kiếm...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-lg text-gray-500">
            Không tìm thấy sản phẩm nào phù hợp.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
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
      </div>
    </section>

    {/* Sản phẩm bạn có thể quan tâm */}
<section className="py-16">
  <div className="container mx-auto px-4">
    <div className="flex items-center justify-between mb-12">
      <div>
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Các sản phẩm bạn có thể quan tâm
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Gợi ý dành cho bạn
        </p>
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {suggestedProducts.slice(0, 8).map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isLiked={isInWishlist(product.id)}
          onToggleLike={toggleWishlist}
          onAddToCart={(product) => addToCart(product, 1)}
        />
      ))}
    </div>
  </div>
</section>
</>
    
  );
}