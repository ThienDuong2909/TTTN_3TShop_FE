import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
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
import { Card, CardContent } from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { ProductCard } from "../components/ProductCard";
import { useApp } from "../contexts/AppContext";
import { products, categories } from "../libs/data";
import { getProductDetail, getProductComments } from "../services/api";
import { mapProductDetailFromApi } from "../utils/productMapper";
import type { Product } from "../components/ProductCard";
import { addToCartApi } from "../services/api";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist, state } = useApp();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsSummary, setCommentsSummary] = useState<any>(null);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const stock = product?.stockMap?.[`${selectedColor}_${selectedSize}`] || 0;

  useEffect(() => {
    window.scrollTo(0, 0); // Scroll to top when component mounts
  }, []);
  useEffect(() => {
    const fetchProduct = async () => {
      const minLoading = new Promise((resolve) => setTimeout(resolve, 300));
      try {
        setLoading(true);

        if (!id) return;

        const raw = await getProductDetail(Number(id)); // Ép kiểu rõ ràng
        const mapped = mapProductDetailFromApi(raw);
        console.log(product);
        setProduct(mapped);
      } catch (err) {
        console.error("Lỗi khi lấy chi tiết sản phẩm:", err);
      } finally {
        await minLoading;
        setLoading(false); // Kết thúc loading
      }
    };

    fetchProduct();
  }, [id]);

  // Fetch product comments
  useEffect(() => {
    const fetchComments = async () => {
      if (!id) return;

      try {
        setCommentsLoading(true);
        const data = await getProductComments(Number(id));
        setComments(data.comments || []);
        setCommentsSummary(data.summary || null);
      } catch (error) {
        console.error("Error fetching comments:", error);
        setComments([]);
        setCommentsSummary(null);
      } finally {
        setCommentsLoading(false);
      }
    };

    fetchComments();
  }, [id]);

  const productImages = useMemo(() => {
    if (!product) return [];
    return product.images?.length ? product.images : [product.image];
  }, [product]);
  // Mock additional images for carousel
  // const productImages = product?.images?.length ? product.images : [product.image];
  // const productImages = product
  // ? [
  //     product.image,
  //     product.image.replace("400", "401"),
  //     product.image.replace("400", "402"),
  //     product.image.replace("400", "403"),
  //   ]
  // : [];

  // Related products
  const relatedProducts = products
    .filter((p) => p.id !== product?.id && p.category === product?.category)
    .slice(0, 4);

  // useEffect(() => {
  //   if (product?.colors && product.colors.length > 0) {
  //     setSelectedColor(product.colors[0]);
  //   }
  //   if (product?.sizes && product.sizes.length > 0) {
  //     setSelectedSize(product.sizes[0]);
  //   }
  // }, [product]);
  useEffect(() => {
    if (product?.colors && product.colors.length > 0) {
      setSelectedColor(product.colors[0]);
    }
  }, [product]);
  useEffect(() => {
    if (product?.sizeMap && selectedColor && product.sizeMap[selectedColor]) {
      const sizes = product.sizeMap[selectedColor];
      if (sizes.length > 0) {
        setSelectedSize(sizes[0]);
        setQuantity(1);
      }
    }
  }, [selectedColor]);

  const increaseQuantity = () => {
    setQuantity((prev) => Math.min(prev + 1, stock));
  };

  const decreaseQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  useEffect(() => {
    setQuantity(1); // 👈 reset lại khi chọn size
  }, [selectedSize]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <Loader2 className="animate-spin w-12 h-12 text-brand-600" />
      </div>
    );
  }

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

      addToCart(product, quantity, selectedColor, selectedSize);
      // alert("Đã thêm vào giỏ hàng!");
      // Optionally update local context/cart state if cần
    } catch (error) {
      alert("Thêm sản phẩm vào giỏ hàng thất bại");
      console.error(error);
    }
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) =>
      prev === productImages.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) =>
      prev === 0 ? productImages.length - 1 : prev - 1
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
              to={`/${
                categories.find(
                  (cat) => cat.id === product.category?.split("-")[0]
                )?.slug || ""
              }`}
              className="text-gray-500 hover:text-brand-600"
            >
              {categories.find(
                (cat) => cat.id === product.category?.split("-")[0]
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
            {/* {product.discount && (
              <Badge className="absolute top-4 left-4 bg-red-500 text-white">
                -{product.discount}%
              </Badge>
            )} */}
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
                      i <
                      Math.floor(
                        commentsSummary?.averageRating || product.rating
                      )
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {commentsSummary?.averageRating || product.rating} (
                {commentsSummary?.totalComments || product.reviews} đánh giá)
              </span>
            </div>

            {/* Badges */}
            {/* <div className="flex gap-2 mb-4">
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
            </div> */}

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
                      100
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
            {product.sizeMap &&
              product.sizeMap[selectedColor] &&
              product.sizeMap[selectedColor].length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Kích thước: {selectedSize}
                  </label>
                  <div className="flex gap-2">
                    {product.sizeMap[selectedColor].map((size) => (
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
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={increaseQuantity}
                  disabled={quantity >= stock || stock === 0}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {selectedColor && selectedSize && (
                <p className="text-sm text-gray-500 mb-1">Tồn kho: {stock}</p>
              )}
              {stock === 0 && (
                <p className="text-sm text-red-500 mt-2">
                  Sản phẩm với màu sắc và kích thước đã chọn hiện đang hết hàng.
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              className="w-full bg-brand-600 hover:bg-brand-700"
              size="lg"
              disabled={stock === 0}
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="description">Mô tả sản phẩm</TabsTrigger>
          {/* <TabsTrigger value="specifications">Thông số</TabsTrigger> */}
          <TabsTrigger value="reviews">
            Đánh giá ({commentsSummary?.totalComments || 0})
          </TabsTrigger>
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

        <TabsContent value="reviews" className="mt-6">
          <div className="space-y-6">
            {/* Comments Summary */}
            {commentsSummary && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        Tổng quan đánh giá
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i <
                                Math.floor(
                                  Number(commentsSummary.averageRating)
                                )
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-medium">
                          {commentsSummary.averageRating} sao
                        </span>
                        <span className="text-gray-500">
                          ({commentsSummary.totalComments} đánh giá)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rating Distribution */}
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count =
                        commentsSummary.ratingDistribution[star] || 0;
                      const percentage =
                        commentsSummary.totalComments > 0
                          ? (count / commentsSummary.totalComments) * 100
                          : 0;

                      return (
                        <div
                          key={star}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className="w-2">{star}</span>
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="w-8 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comments List */}
            {commentsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : comments.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center py-8">
                  <p className="text-gray-500">
                    Chưa có đánh giá nào cho sản phẩm này.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <Card key={comment.MaBL}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarFallback>
                            {comment.KhachHang.TenKH.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">
                              {comment.KhachHang.TenKH}
                            </span>
                            <Badge
                              variant="secondary"
                              className="text-green-600 text-xs"
                            >
                              Đã mua hàng
                            </Badge>
                            {comment.SanPham.ChiTiet.MauSac.TenMau &&
                              comment.SanPham.ChiTiet.KichThuoc
                                .TenKichThuoc && (
                                <span className="text-xs text-gray-500">
                                  • {comment.SanPham.ChiTiet.MauSac.TenMau},{" "}
                                  {
                                    comment.SanPham.ChiTiet.KichThuoc
                                      .TenKichThuoc
                                  }
                                </span>
                              )}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < comment.SoSao
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(
                                comment.NgayBinhLuan
                              ).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300">
                            {comment.MoTa}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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
