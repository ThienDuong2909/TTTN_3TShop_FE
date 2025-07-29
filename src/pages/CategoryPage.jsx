import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ProductCard } from "../components/ProductCard.tsx";
import { getProductsByCategory } from "../services/api";
import { mapSanPhamFromApi } from "../utils/productMapper";
import { ChevronRight } from "lucide-react";
import { Button } from "../components/ui/button";

export default function CategoryPage() {
  const { id } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
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

    fetchProducts();
  }, [id]);

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">Sản phẩm theo loại</h1>

      {loading ? (
        <p>Đang tải sản phẩm...</p>
      ) : products.length === 0 ? (
        <p>Không có sản phẩm nào trong danh mục này.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center mt-8">
            <Button variant="outline">
              Xem thêm
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
