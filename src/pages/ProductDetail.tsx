import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Star,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  ShoppingCart,
  Truck,
  Shield,
  RotateCcw,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Textarea } from "../components/ui/textarea";
import { ProductCard } from "../components/ProductCard";
import { useApp } from "../contexts/AppContext";
import { getProductById, products, categories } from "../libs/data";
import { getProductDetail } from "../services/api";
import { mapProductDetailFromApi } from "../utils/productMapper";
import type { Product } from "../components/ProductCard";
import {addToCartApi} from '../services/api'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist, state } = useApp();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [reviewText, setReviewText] = useState("");
  const [userRating, setUserRating] = useState(5);

const [product, setProduct] = useState<Product | null>(null);

useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!id) return;

        const raw = await getProductDetail(Number(id)); // Ép kiểu rõ ràng
        const mapped = mapProductDetailFromApi(raw);
        console.log(mapped)
        setProduct(mapped);
      } catch (err) {
        console.error("Lỗi khi lấy chi tiết sản phẩm:", err);
      }
    };

    fetchProduct();
  }, [id]);


  // Mock additional images for carousel
  const productImages = product
    ? [
        product.image,
        product.image.replace("400", "401"),
        product.image.replace("400", "402"),
        product.image.replace("400", "403"),
      ]
    : [];

  // Mock reviews
  const reviews = [
    {
      id: 1,
      user: "Nguyễn Văn A",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      rating: 5,
      comment: "Sản phẩm chất lượng tốt, đúng như mô tả. Giao hàng nhanh!",
      date: "2024-01-15",
      verified: true,
    },
    {
      id: 2,
      user: "Trần Thị B",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616c273e185?w=100&h=100&fit=crop&crop=face",
      rating: 4,
      comment:
        "Thiết kế đẹp, chất liệu tốt. Chỉ có điều kích thước hơi nhỏ so với mô tả.",
      date: "2024-01-10",
      verified: true,
    },
    {
      id: 3,
      user: "Lê Văn C",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      rating: 5,
      comment: "Rất hài lòng với sản phẩm này. Sẽ mua lại.",
      date: "2024-01-08",
      verified: false,
    },
  ];

  // Related products
  const relatedProducts = products
    .filter((p) => p.id !== product?.id && p.category === product?.category)
    .slice(0, 4);

  useEffect(() => {
    if (product?.colors && product.colors.length > 0) {
      setSelectedColor(product.colors[0]);
    }
    if (product?.sizes && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0]);
    }
  }, [product]);

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Sản phẩm không tồn tại
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Sản phẩm bạn tìm kiếm không có trong hệ thống.
          </p>
          <Link to="/">
            <Button>Về trang chủ</Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleAddToCart = async () => {
  if (!selectedSize) {
    alert("Vui lòng chọn kích thước");
    return;
  }

  try {
    await addToCartApi({
      maKH: Number(state.user.id),
      maSP: product.id,
      soLuong: quantity,
      maHex: selectedColor,
      tenKichThuoc: selectedSize,
    });

    alert("Đã thêm vào giỏ hàng!");
    // Optionally update local context/cart state if cần
  } catch (error) {
    alert("Thêm sản phẩm vào giỏ hàng thất bại");
    console.error(error);
  }
};


  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock review submission
    console.log("Review submitted:", { userRating, reviewText });
    setReviewText("");
    setUserRating(5);
    alert("Cảm ơn bạn đã đánh giá sản phẩm!");
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) =>
      prev === productImages.length - 1 ? 0 : prev + 1,
    );
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) =>
      prev === 0 ? productImages.length - 1 : prev - 1,
    );
  };

  const colorNames: Record<string, string> = {
    "#000000": "Đen",
    "#ffffff": "Trắng",
    "#dc2626": "Đỏ",
    "#3b82f6": "Xanh dương",
    "#22c55e": "Xanh lá",
    "#f59e0b": "Vàng",
    "#ec4899": "Hồng",
    "#a855f7": "Tím",
    "#6b7280": "Xám",
    "#7c2d12": "Nâu",
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link to="/" className="text-gray-500 hover:text-brand-600">
              Trang chủ
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link
              to={`/${categories.find((cat) => cat.id === product.category?.split("-")[0])?.slug || ""}`}
              className="text-gray-500 hover:text-brand-600"
            >
              {categories.find(
                (cat) => cat.id === product.category?.split("-")[0],
              )?.name || "Sản phẩm"}
            </Link>
          </li>
          <li>/</li>
          <li className="text-gray-900 dark:text-white">{product.name}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
        {/* Product Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            <img
              src={productImages[selectedImageIndex]}
              alt={product.name}
              className="w-full h-full object-cover"
            />

            {/* Image Navigation */}
            {productImages.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                  onClick={prevImage}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                  onClick={nextImage}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}

            {/* Discount Badge */}
            {product.discount && (
              <Badge className="absolute top-4 left-4 bg-red-500 text-white">
                -{product.discount}%
              </Badge>
            )}
          </div>

          {/* Thumbnail Images */}
          {productImages.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {productImages.map((image, index) => (
                <button
                  key={index}
                  className={`aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border-2 ${
                    selectedImageIndex === index
                      ? "border-brand-600"
                      : "border-transparent"
                  }`}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(product.rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {product.rating} ({product.reviews} đánh giá)
              </span>
            </div>

            {/* Badges */}
            <div className="flex gap-2 mb-4">
              {product.isNew && (
                <Badge variant="secondary" className="text-green-600">
                  Mới
                </Badge>
              )}
              {product.isBestSeller && (
                <Badge variant="secondary" className="text-yellow-600">
                  Bán chạy
                </Badge>
              )}
            </div>

            {/* Price */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-brand-600 dark:text-brand-400">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-xl text-gray-500 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
              {product.originalPrice && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  Tiết kiệm {formatPrice(product.originalPrice - product.price)}{" "}
                  (
                  {Math.round(
                    ((product.originalPrice - product.price) /
                      product.originalPrice) *
                      100,
                  )}
                  %)
                </p>
              )}
            </div>
          </div>

          {/* Product Options */}
          <div className="space-y-4">
            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Màu sắc: {colorNames[selectedColor] || "Khác"}
                </label>
                <div className="flex gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${
                        selectedColor === color
                          ? "border-brand-600 ring-2 ring-brand-200"
                          : "border-gray-300"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                      title={colorNames[color] || color}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Kích thước: {selectedSize}
                </label>
                <div className="flex gap-2">
                  {product.sizes.map((size) => (
                    <Button
                      key={size}
                      variant={selectedSize === size ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium mb-2">Số lượng</label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              className="w-full bg-brand-600 hover:bg-brand-700"
              size="lg"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Thêm vào giỏ hàng - {formatPrice(product.price * quantity)}
            </Button>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => toggleWishlist(product.id)}
              >
                <Heart
                  className={`w-4 h-4 mr-2 ${
                    isInWishlist(product.id) ? "fill-red-500 text-red-500" : ""
                  }`}
                />
                {isInWishlist(product.id) ? "Đã yêu thích" : "Yêu thích"}
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-3 pt-6 border-t">
            <div className="flex items-center gap-3 text-sm">
              <Truck className="w-5 h-5 text-green-600" />
              <span>Miễn phí vận chuyển cho đơn hàng trên 500K</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Shield className="w-5 h-5 text-blue-600" />
              <span>Bảo hành chất lượng 30 ngày</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <RotateCcw className="w-5 h-5 text-orange-600" />
              <span>Đổi trả miễn phí trong 7 ngày</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <Tabs defaultValue="description" className="mb-12">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="description">Mô tả sản phẩm</TabsTrigger>
          <TabsTrigger value="specifications">Thông số</TabsTrigger>
          <TabsTrigger value="reviews">Đánh giá ({reviews.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="prose max-w-none">
                <p>
                  {product.name} là sản phẩm chất lượng cao được thiết kế với sự
                  tỉ mỉ trong từng chi tiết. Được làm từ những chất liệu tốt
                  nhất, sản phẩm mang đến sự thoải mái và phong cách cho người
                  sử dụng.
                </p>
                <p>
                  Với thiết kế hiện đại và tinh tế, sản phẩm phù hợp cho nhiều
                  hoàn cảnh khác nhau từ công việc đến giải trí. Đây chính là
                  lựa chọn hoàn hảo cho những ai yêu thích sự kết hợp giữa chất
                  lượng và phong cách.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="specifications" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Thông tin cơ bản</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Thương hiệu:</span>
                      <span>FashionHub</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Chất liệu:</span>
                      <span>Cotton cao cấp</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Xuất xứ:</span>
                      <span>Việt Nam</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Chăm sóc sản phẩm</h4>
                  <div className="space-y-2 text-sm">
                    <div>• Giặt máy ở nhiệt độ thấp</div>
                    <div>• Không sử dụng chất tẩy</div>
                    <div>• Phơi khô tự nhiên</div>
                    <div>• Ủi ở nhiệt độ trung bình</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <div className="space-y-6">
            {/* Review Form */}
            {state.user && (
              <Card>
                <CardHeader>
                  <CardTitle>Viết đánh giá</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Đánh giá của bạn
                      </label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setUserRating(star)}
                            className="p-1"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                star <= userRating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Nhận xét
                      </label>
                      <Textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                        required
                      />
                    </div>
                    <Button type="submit">Gửi đánh giá</Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarImage src={review.avatar} />
                        <AvatarFallback>
                          {review.user.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{review.user}</span>
                          {review.verified && (
                            <Badge
                              variant="secondary"
                              className="text-green-600 text-xs"
                            >
                              Đã mua hàng
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">
                            {review.date}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">
                          {review.comment}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Sản phẩm liên quan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard
                key={relatedProduct.id}
                product={relatedProduct}
                isLiked={isInWishlist(relatedProduct.id)}
                onToggleLike={toggleWishlist}
                onAddToCart={(product) => addToCart(product, 1)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
