import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../contexts/AppContext";
import { getAllProducts,getAllCategories, getBestSellerProducts, getNewProducts, getDiscountProducts  } from "../services/api";
import { mapSanPhamFromApi } from "../utils/productMapper.ts";
import {
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ProductCard, Product } from "../components/ProductCard";

const HERO_SLIDES = [
  {
    key: "new",
    title: "Bộ sưu tập mới 2024",
    heading: (
      <>
        Thời trang
        <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent pb-1 line-height: 1.2">
          Hiện đại
        </span>
      </>
    ),
    description: "Khám phá những xu hướng thời trang mới nhất với chất lượng cao và giá cả hợp lý.",
    button: "Mua sắm ngay",
    productsKey: "newProducts",
    bg: "from-brand-600 via-brand-500 to-brand-400",
  },
  {
    key: "hot",
    title: "Sản phẩm hot sale",
    heading: (
      <>
        Sản phẩm
        <span className="block bg-gradient-to-r from-pink-400 to-red-400 bg-clip-text text-transparent">
          Hot Sale
        </span>
      </>
    ),
    description: "Những sản phẩm bán chạy nhất, được nhiều khách hàng lựa chọn.",
    button: "Khám phá ngay",
    productsKey: "bestSellerProducts",
    bg: "from-pink-600 via-pink-500 to-red-400",
  },
  {
    key: "discount",
    title: "Sản phẩm giảm giá",
    heading: (
      <>
        Ưu đãi
        <span className="block bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent pb-1 line-height: 1.2">
          Giảm giá sốc
        </span>
      </>
    ),
    description: "Săn ngay các sản phẩm đang giảm giá cực hấp dẫn.",
    button: "Xem ưu đãi",
    productsKey: "discountProducts",
    bg: "from-green-600 via-blue-500 to-blue-400",
  },
];

export default function Index() {
  interface CategoryDisplay {
    id: number;
    name: string;
    image: string;
    href: string;
    count: number;
  }
  
  const { toggleWishlist, isInWishlist, addToCart } = useApp();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryDisplay[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const categoriesFromApi = await getAllCategories();
        console.log(categoriesFromApi);
        setCategories(
          categoriesFromApi.map((cat) => ({
            id: cat.MaLoaiSP,
            name: cat.TenLoai,
            image: cat.HinhMinhHoa || "/images/category-placeholder.jpg",
            href: `/category/${cat.MaLoaiSP}`,
            count: cat.soLuongSanPham, 
          }))
        );
      } catch (error) {
        console.error("Lỗi khi lấy danh mục:", error);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const [bestSellerProducts, setBestSellerProducts] = useState<Product[]>([]);
  const [bestSellerLoading, setBestSellerLoading] = useState(true);

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        setBestSellerLoading(true);
        const products = await getBestSellerProducts();
        console.log("Best seller products from API:", products);
        const mapped = products.map(mapSanPhamFromApi);
        setBestSellerProducts(mapped);
      } catch (error) {
        console.error("Lỗi khi lấy sản phẩm bán chạy:", error);
      } finally {
        setBestSellerLoading(false);
      }
    };
    fetchBestSellers();
  }, []);

  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [newProductsLoading, setNewProductsLoading] = useState(true);

  useEffect(() => {
    const fetchNewProducts = async () => {
      try {
        setNewProductsLoading(true);
        const products = await getNewProducts();
        const mapped = products.map((p) => ({
          ...mapSanPhamFromApi(p),
          isNew: true,
        }));
        setNewProducts(mapped);
      } catch (error) {
        console.error("Lỗi khi lấy sản phẩm mới:", error);
      } finally {
        setNewProductsLoading(false);
      }
    };
    fetchNewProducts();
  }, []);

  const [discountProducts, setDiscountProducts] = useState<Product[]>([]);
  const [discountLoading, setDiscountLoading] = useState(true);

  useEffect(() => {
    const fetchDiscountProducts = async () => {
      try {
        setDiscountLoading(true);
        const products = await getDiscountProducts();
        const mapped = products.map(mapSanPhamFromApi);
        setDiscountProducts(mapped);
      } catch (error) {
        console.error("Lỗi khi lấy sản phẩm giảm giá:", error);
      } finally {
        setDiscountLoading(false);
      }
    };
    fetchDiscountProducts();
  }, []);

  const displayCategories = categories;

  const [slide, setSlide] = useState(0);
  const slideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tự động chuyển slide
  useEffect(() => {
    if (slideTimeout.current) clearTimeout(slideTimeout.current);
    slideTimeout.current = setTimeout(() => {
      setSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => {
      if (slideTimeout.current) clearTimeout(slideTimeout.current);
    };
  }, [slide]);

  // Lấy sản phẩm mẫu cho từng slide
  const slideData = HERO_SLIDES[slide];
  let productSamples: Product[] = [];
  let heroLoading = true;

  if (slideData.productsKey === "newProducts") {
    productSamples = newProducts.slice(0, 3);
    heroLoading = newProductsLoading;
  } else if (slideData.productsKey === "bestSellerProducts") {
    productSamples = bestSellerProducts.slice(0, 3);
    heroLoading = bestSellerLoading;
  } else if (slideData.productsKey === "discountProducts") {
    productSamples = discountProducts.slice(0, 3);
    heroLoading = discountLoading;
  }

  const [catStart, setCatStart] = useState(0);
  
  const catPerPage = 4;
  const maxStart = Math.max(0, categories.length - catPerPage);
  const categoryWidth = 260;
  const gap = 24;
  const canPrev = catStart > 0;
  const canNext = catStart + catPerPage < categories.length;
  const translateX = -(
    (catStart > maxStart ? maxStart : catStart) *
    (categoryWidth + gap)
  );

  // Component skeleton cho hero products
   const HeroProductsSkeleton = () => (
    <div className="flex justify-center gap-6 flex-nowrap overflow-x-auto lg:overflow-visible">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="min-w-[180px] max-w-[240px]">
          <div className="bg-white rounded-lg overflow-hidden shadow-xl border-2 border-white/40">
            <div className="w-full aspect-[3/4] shimmer rounded-t-lg" />
            <div className="p-3 space-y-2">
              <div className="h-8 w-full shimmer rounded" />
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-4 h-4 shimmer rounded" />
                ))}
                <div className="h-4 w-12 ml-2 shimmer rounded" />
              </div>
              <div className="h-6 w-20 shimmer rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Component skeleton cho categories
  const CategoriesSkeleton = () => (
    <div className="relative flex justify-center items-center overflow-hidden">
      <div
        className="w-full overflow-hidden"
        style={{ maxWidth: catPerPage * categoryWidth + (catPerPage - 1) * gap }}
      >
        <div className="flex gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden shimmer"
              style={{ minWidth: categoryWidth, maxWidth: categoryWidth }}
            >
              <div className="w-full aspect-[4/3]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Component skeleton cho product grid
  const ProductGridSkeleton = ({ count = 5 }: { count?: number }) => (
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

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className={`relative bg-gradient-to-r ${slideData.bg} text-white overflow-hidden transition-all duration-700`}>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-12 lg:py-20 max-w-[1200px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-white/20 text-white border-white/30">
                {slideData.title}
              </Badge>
              <h1 className="text-4xl font-bold mb-3 leading-[1.3] lg:text-[3.75rem] lg:leading-[1.3]">
                {slideData.heading}
              </h1>
              <p className="text-xl text-brand-100 mb-8 max-w-md">
                {slideData.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-white text-brand-600 hover:bg-gray-100"
                >
                  {slideData.button}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2 mt-8">
                {HERO_SLIDES.map((s, idx) => (
                  <button
                    key={s.key}
                    className={`w-3 h-3 rounded-full border-2 ${slide === idx ? "bg-white border-white" : "bg-white/30 border-white/30"} transition`}
                    onClick={() => setSlide(idx)}
                    aria-label={`Chuyển đến slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
            <div className="relative flex justify-center min-h-[300px] items-center">
              {heroLoading ? (
                <HeroProductsSkeleton />
              ) : productSamples.length > 0 ? (
                <div className="flex justify-center gap-6 flex-nowrap overflow-x-auto lg:overflow-visible">
                  {productSamples.map((product) => (
                    <div key={product.id} className="min-w-[180px] max-w-[240px]">
                      <ProductCard
                        product={product}
                        isLiked={isInWishlist(product.id)}
                        onToggleLike={toggleWishlist}
                        onAddToCart={(p) => addToCart(p, 1)}
                        className="shadow-xl border-2 border-white/40"
                        titleClassName="h-8 text-sm leading-4 line-clamp-2"
                      />
                    </div>
                  ))}
                  {[...Array(3 - productSamples.length)].map((_, idx) => (
                    <div key={`placeholder-${idx}`} className="min-w-[180px] max-w-[200px] invisible" />
                  ))}
                </div>
              ) : (
                <img
                  src="/api/placeholder/500/500"
                  alt="Fashion Hero"
                  className="w-full h-full object-cover rounded-2xl"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-6">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Danh mục sản phẩm
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Khám phá các danh mục thời trang đa dạng với hàng ngàn sản phẩm chất lượng
            </p>
          </div>
          
          {categoriesLoading ? (
            <CategoriesSkeleton />
          ) : (
            <div className="relative flex justify-center items-center overflow-hidden">
              {canPrev && (
                <button
                  className="absolute left-0 z-10 bg-white shadow rounded-full p-2 hover:bg-gray-100 transition"
                  onClick={() => setCatStart((prev) => Math.max(0, prev - 1))}
                  aria-label="Xem danh mục trước"
                  style={{ top: "50%", transform: "translateY(-50%)" }}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              <div
                className="w-full overflow-hidden"
                style={{ maxWidth: catPerPage * categoryWidth + (catPerPage - 1) * gap }}
              >
                <div
                  className="flex gap-6 transition-transform duration-500"
                  style={{
                    width: categories.length * categoryWidth + (categories.length - 1) * gap,
                    transform: `translateX(${translateX}px)`,
                  }}
                >
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      to={category.href}
                      className="group relative overflow-hidden rounded-xl aspect-[4/3] hover:shadow-lg transition-all duration-300"
                      style={{ minWidth: categoryWidth, maxWidth: categoryWidth }}
                    >
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute bottom-6 left-6 text-white">
                        <h3 className="text-xl font-bold mb-1">{category.name}</h3>
                        <p className="text-white/80">{category.count} sản phẩm</p>
                      </div>
                      <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-5 h-5 text-white" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              {canNext && (
                <button
                  className="absolute right-0 z-10 bg-white shadow rounded-full p-2 hover:bg-gray-100 transition"
                  onClick={() => setCatStart((prev) => Math.min(maxStart, prev + 1))}
                  aria-label="Xem danh mục tiếp"
                  style={{ top: "50%", transform: "translateY(-50%)" }}
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* New Product Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Sản phẩm mới
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Những sản phẩm vừa ra mắt
              </p>
            </div>
            <Button variant="outline" className="hidden md:flex items-center">
              <Link to="/new-products" className="flex items-center">
                Xem tất cả
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          {newProductsLoading ? (
            <ProductGridSkeleton />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {newProducts.slice(0, 5).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isLiked={isInWishlist(product.id)}
                  onToggleLike={toggleWishlist}
                  onAddToCart={(product) => {
                    addToCart(product, 1);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Best Seller Products Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Sản phẩm bán chạy
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Những sản phẩm được mua nhiều nhất
              </p>
            </div>
            <Button variant="outline" className="hidden md:flex items-center">
              <Link to="/bestseller-products" className="flex items-center">
                Xem tất cả
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          {bestSellerLoading ? (
            <ProductGridSkeleton />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {bestSellerProducts.slice(0, 5).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isLiked={isInWishlist(product.id)}
                  onToggleLike={toggleWishlist}
                  onAddToCart={(product) => {
                    addToCart(product, 1);
                  }}
                />
              ))}
            </div>
          )}
          
          <div className="text-center mt-8 md:hidden">
            <Button variant="outline">
              <Link to="/bestseller-products" className="flex items-center">
                Xem tất cả
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Discount Products Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Sản phẩm giảm giá
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Những sản phẩm đang có ưu đãi hấp dẫn
              </p>
            </div>
            <Button variant="outline" className="hidden md:flex items-center">
              <Link to="/discount-products" className="flex items-center">
                Xem tất cả
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          {discountLoading ? (
            <ProductGridSkeleton />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {discountProducts.slice(0, 5).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isLiked={isInWishlist(product.id)}
                  onToggleLike={toggleWishlist}
                  onAddToCart={(product) => {
                    addToCart(product, 1);
                  }}
                />
              ))}
            </div>
          )}
          
          <div className="text-center mt-8 md:hidden">
            <Button variant="outline">
              <Link to="/discount-products" className="flex items-center">
                Xem tất cả
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-brand-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Đăng ký nhận ưu đãi đặc biệt
          </h2>
          <p className="text-brand-100 mb-8 max-w-2xl mx-auto">
            Nhận thông tin về sản phẩm mới, giảm giá và các ưu đãi độc quyền
            trước người khác
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Nhập email của bạn"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <Button className="bg-white text-brand-600 hover:bg-gray-100">
              Đăng ký ngay
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}