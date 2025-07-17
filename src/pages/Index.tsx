import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../contexts/AppContext";
import { categories, getFeaturedProducts } from "../libs/data";
import {
  ChevronRight,
  Star,
  Heart,
  ShoppingCart,
  Eye,
  TrendingUp,
  Zap,
  Gift,
  Truck,
  Shield,
  Clock,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ProductCard, Product } from "../components/ProductCard";

export default function Index() {
  const { toggleWishlist, isInWishlist, addToCart } = useApp();
  const featuredProducts = getFeaturedProducts();

  const displayCategories = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    image: cat.image,
    href: `/${cat.slug}`,
    count: Math.floor(Math.random() * 300) + 50, // Mock count for demo
  }));

  const benefits = [
    {
      icon: Truck,
      title: "Miễn phí vận chuyển",
      description: "Cho đơn hàng trên 500K",
    },
    {
      icon: Shield,
      title: "Bảo hành chất lượng",
      description: "30 ngày đổi trả miễn phí",
    },
    {
      icon: Clock,
      title: "Giao hàng nhanh",
      description: "2-3 ngày trong nội thành",
    },
    {
      icon: Gift,
      title: "Quà tặng hấp dẫn",
      description: "Với mỗi đơn hàng",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-white/20 text-white border-white/30">
                <Zap className="w-4 h-4 mr-1" />
                Bộ sưu tập mới 2024
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                Thời trang
                <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  Hiện đại
                </span>
              </h1>
              <p className="text-xl text-brand-100 mb-8 max-w-md">
                Khám phá những xu hướng thời trang mới nhất với chất lượng cao
                và giá cả hợp lý.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-white text-brand-600 hover:bg-gray-100"
                >
                  Mua sắm ngay
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-brand-600"
                >
                  Xem bộ sưu tập
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-white/10 rounded-3xl backdrop-blur-sm border border-white/20 p-8">
                <img
                  src="/api/placeholder/500/500"
                  alt="Fashion Hero"
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
              <div className="absolute -top-4 -right-4 bg-yellow-400 text-black px-4 py-2 rounded-full font-bold text-sm">
                -30% OFF
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-100 dark:bg-brand-900 rounded-lg mb-4">
                  <benefit.icon className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Danh mục sản phẩm
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Khám phá các danh mục thời trang đa dạng với hàng ngàn sản phẩm
              chất lượng
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayCategories.map((category) => (
              <Link
                key={category.id}
                to={category.href}
                className="group relative overflow-hidden rounded-xl aspect-[4/3] hover:shadow-lg transition-all duration-300"
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
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Sản phẩm nổi bật
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Những sản phẩm được yêu thích nhất
              </p>
            </div>
            <Button variant="outline" className="hidden md:flex">
              Xem tất cả
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product) => (
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

          <div className="text-center mt-8 md:hidden">
            <Button variant="outline">
              Xem tất cả
              <ChevronRight className="ml-2 h-4 w-4" />
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
