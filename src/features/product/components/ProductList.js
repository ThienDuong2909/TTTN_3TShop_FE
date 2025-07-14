import { useEffect, useState } from "react";
import { getAllProducts } from "../services/productService";
import ProductItem from "./ProductItem";

const ProductList = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    getAllProducts()
      .then(setProducts)
      .catch((err) => console.error("Lỗi lấy sản phẩm:", err));
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductItem key={product.MaSP} product={product} />
      ))}
    </div>
  );
};

export default ProductList;
