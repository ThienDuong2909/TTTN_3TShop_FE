import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Eye, Star, TrendingUp } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";

export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  rating: number;
  reviews: number;
  totalSold: number;
  discount?: number;
  isNew?: boolean;
  isBestSeller?: boolean;
  category?: string;
  colors?: string[];
  sizes?: string[];
  sizeMap?: Record<string, string[]>;
  stockMap?: Record<string, number>; 
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onToggleLike?: (productId: number) => void;
  isLiked?: boolean;
  className?: string;
  titleClassName?: string; 
}

export function ProductCard({
  product,
  onAddToCart,
  onToggleLike,
  isLiked = false,
  className = "",
  titleClassName,
}: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart?.(product);
  };

  const handleToggleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleLike?.(product.id);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // TODO: Open quick view modal
  };

  return (
    <Card
      className={`group overflow-hidden hover:shadow-lg transition-all duration-300 ${className}`}
    >
      <CardContent className="p-0">
        <Link to={`/product/${product.id}`} className="block">
          <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-gray-800">
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
            )}
            <img
              src={product.image}
              alt={product.name}
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setImageLoaded(true)}
              loading="lazy"
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.isBestSeller ? (
                <Badge className="bg-yellow-500 text-black shadow-sm">
                  Đã bán {product.totalSold}/tháng
                </Badge>
              ) : (product.discount ?? 0) > 0 && product.discount && (
                <Badge className="bg-red-500 text-white shadow-sm">
                  -{product.discount}%
                </Badge>
              )}
              {product.isNew && (
                <Badge className="bg-green-500 text-white shadow-sm">Mới</Badge>
              )}
            </div>

            {/* Hover Actions */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
          </div>

          <div className="p-4">
            <h3 className={`font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors h-12 ${titleClassName || ''}`}>
              {product.name}
            </h3>

            {/* Rating */}
            <div className="flex items-center mb-3">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-300 ml-2">
                ({product.reviews})
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between">
              <div className="space-x-2">
                <span className="font-bold text-brand-600 dark:text-brand-400">
                  {formatPrice(product.price)}
                </span>
                {(product.discount ?? 0) > 0 && product.originalPrice && (
                  <span className="text-sm text-gray-500 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>

            {/* Colors preview */}
            {product.colors && product.colors.length > 0 && (
              <div className="flex items-center gap-1 mt-3">
                {product.colors.slice(0, 4).map((color, index) => (
                  <div
                    key={index}
                    className="w-4 h-4 rounded-full border border-gray-200 dark:border-gray-600"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                {product.colors.length > 4 && (
                  <span className="text-xs text-gray-500 ml-1">
                    +{product.colors.length - 4}
                  </span>
                )}
              </div>
            )}
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}