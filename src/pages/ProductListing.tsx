import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Filter,
  Grid,
  List,
  SlidersHorizontal,
  Star,
  X,
  ChevronDown,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../components/ui/collapsible";
import { ProductCard } from "../components/ProductCard";
import { useApp } from "../contexts/AppContext";
import { getProductsByCategory, categories, products } from "../libs/data";

interface ProductListingProps {
  category: string;
}

interface Filters {
  priceRange: [number, number];
  colors: string[];
  sizes: string[];
  rating: number;
  discount: boolean;
  inStock: boolean;
}

type SortOption =
  | "default"
  | "price-low"
  | "price-high"
  | "name-asc"
  | "name-desc"
  | "rating-high"
  | "newest";

export default function ProductListing({ category }: ProductListingProps) {
  const [searchParams] = useSearchParams();
  const { toggleWishlist, isInWishlist, addToCart } = useApp();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

  const [filters, setFilters] = useState<Filters>({
    priceRange: [0, 5000000],
    colors: [],
    sizes: [],
    rating: 0,
    discount: false,
    inStock: true,
  });

  // Get category info
  const categoryInfo = useMemo(() => {
    if (category === "sale") {
      return {
        name: "Sản phẩm giảm giá",
        description: "Khuyến mãi hấp dẫn",
      };
    }

    const allCategories = [...categories];
    categories.forEach((cat) => {
      if (cat.subcategories) {
        allCategories.push(...cat.subcategories);
      }
    });

    const found = allCategories.find((cat) => cat.slug === category);
    return found || { name: "Sản phẩm", description: "" };
  }, [category]);

  // Get and filter products
  const filteredProducts = useMemo(() => {
    let productList = [];

    if (searchQuery) {
      // Search mode
      productList = products.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    } else {
      // Category mode
      productList = getProductsByCategory(category);
    }

    // Apply filters
    productList = productList.filter((product) => {
      // Price range
      if (
        product.price < filters.priceRange[0] ||
        product.price > filters.priceRange[1]
      ) {
        return false;
      }

      // Colors
      if (
        filters.colors.length > 0 &&
        product.colors &&
        !filters.colors.some((color) => product.colors?.includes(color))
      ) {
        return false;
      }

      // Sizes
      if (
        filters.sizes.length > 0 &&
        product.sizes &&
        !filters.sizes.some((size) => product.sizes?.includes(size))
      ) {
        return false;
      }

      // Rating
      if (filters.rating > 0 && product.rating < filters.rating) {
        return false;
      }

      // Discount
      if (filters.discount && !product.discount) {
        return false;
      }

      return true;
    });

    // Apply sorting
    switch (sortBy) {
      case "price-low":
        productList.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        productList.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        productList.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        productList.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "rating-high":
        productList.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        productList.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      default:
        // Keep original order
        break;
    }

    return productList;
  }, [category, searchQuery, filters, sortBy]);

  // Get unique values for filters
  const filterOptions = useMemo(() => {
    const allProducts = searchQuery
      ? products
      : getProductsByCategory(category);

    const colors = new Set<string>();
    const sizes = new Set<string>();

    allProducts.forEach((product) => {
      product.colors?.forEach((color) => colors.add(color));
      product.sizes?.forEach((size) => sizes.add(size));
    });

    return {
      colors: Array.from(colors),
      sizes: Array.from(sizes),
    };
  }, [category, searchQuery]);

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleColorFilter = (color: string) => {
    setFilters((prev) => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter((c) => c !== color)
        : [...prev.colors, color],
    }));
  };

  const toggleSizeFilter = (size: string) => {
    setFilters((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const clearFilters = () => {
    setFilters({
      priceRange: [0, 5000000],
      colors: [],
      sizes: [],
      rating: 0,
      discount: false,
      inStock: true,
    });
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

  // Sync search query with URL
  useEffect(() => {
    const query = searchParams.get("q");
    if (query) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Price Range */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-medium">
          Khoảng giá
          <ChevronDown className="w-4 h-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Từ"
              value={filters.priceRange[0]}
              onChange={(e) =>
                updateFilter("priceRange", [
                  parseInt(e.target.value) || 0,
                  filters.priceRange[1],
                ])
              }
            />
            <Input
              type="number"
              placeholder="Đến"
              value={filters.priceRange[1]}
              onChange={(e) =>
                updateFilter("priceRange", [
                  filters.priceRange[0],
                  parseInt(e.target.value) || 5000000,
                ])
              }
            />
          </div>
          <div className="space-y-2">
            {[
              [0, 200000],
              [200000, 500000],
              [500000, 1000000],
              [1000000, 2000000],
              [2000000, 5000000],
            ].map(([min, max]) => (
              <Button
                key={`${min}-${max}`}
                variant="outline"
                size="sm"
                className="w-full justify-start h-8"
                onClick={() => updateFilter("priceRange", [min, max])}
              >
                {min.toLocaleString()} - {max.toLocaleString()} đ
              </Button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Colors */}
      {filterOptions.colors.length > 0 && (
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-medium">
            Màu sắc
            <ChevronDown className="w-4 h-4" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid grid-cols-2 gap-2">
              {filterOptions.colors.map((color) => (
                <Button
                  key={color}
                  variant={
                    filters.colors.includes(color) ? "default" : "outline"
                  }
                  size="sm"
                  className="justify-start h-8"
                  onClick={() => toggleColorFilter(color)}
                >
                  <div
                    className="w-3 h-3 rounded-full mr-2 border"
                    style={{ backgroundColor: color }}
                  />
                  {colorNames[color] || "Khác"}
                </Button>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Sizes */}
      {filterOptions.sizes.length > 0 && (
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-medium">
            Kích thước
            <ChevronDown className="w-4 h-4" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid grid-cols-4 gap-2">
              {filterOptions.sizes.map((size) => (
                <Button
                  key={size}
                  variant={filters.sizes.includes(size) ? "default" : "outline"}
                  size="sm"
                  className="h-8"
                  onClick={() => toggleSizeFilter(size)}
                >
                  {size}
                </Button>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Rating */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-medium">
          Đánh giá
          <ChevronDown className="w-4 h-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2">
          {[4, 3, 2, 1].map((rating) => (
            <Button
              key={rating}
              variant={filters.rating === rating ? "default" : "outline"}
              size="sm"
              className="w-full justify-start h-8"
              onClick={() => updateFilter("rating", rating)}
            >
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="ml-2">{rating} sao trở lên</span>
              </div>
            </Button>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Other Filters */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="discount"
            checked={filters.discount}
            onCheckedChange={(checked) => updateFilter("discount", !!checked)}
          />
          <label htmlFor="discount" className="text-sm font-medium">
            Chỉ sản phẩm giảm giá
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="inStock"
            checked={filters.inStock}
            onCheckedChange={(checked) => updateFilter("inStock", !!checked)}
          />
          <label htmlFor="inStock" className="text-sm font-medium">
            Còn hàng
          </label>
        </div>
      </div>

      {/* Clear Filters */}
      <Button variant="outline" onClick={clearFilters} className="w-full">
        <X className="w-4 h-4 mr-2" />
        Xóa bộ lọc
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {searchQuery
            ? `Kết quả tìm kiếm: "${searchQuery}"`
            : categoryInfo.name}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          {searchQuery
            ? `${filteredProducts.length} sản phẩm tìm thấy`
            : `${filteredProducts.length} sản phẩm ${categoryInfo.description || ""}`}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          {/* Mobile Filter */}
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden">
                <Filter className="w-4 h-4 mr-2" />
                Bộ lọc
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle>Bộ lọc sản phẩm</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>

          {/* View Mode */}
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              className="rounded-r-none"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              className="rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Sort */}
        <Select
          value={sortBy}
          onValueChange={(value: SortOption) => setSortBy(value)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sắp xếp theo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Mặc định</SelectItem>
            <SelectItem value="price-low">Giá: Thấp đến cao</SelectItem>
            <SelectItem value="price-high">Giá: Cao đến thấp</SelectItem>
            <SelectItem value="name-asc">Tên: A-Z</SelectItem>
            <SelectItem value="name-desc">Tên: Z-A</SelectItem>
            <SelectItem value="rating-high">Đánh giá cao nhất</SelectItem>
            <SelectItem value="newest">Mới nhất</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-8">
        {/* Desktop Filters */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
              <h3 className="font-semibold mb-4">Bộ lọc</h3>
              <FilterContent />
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="flex-1">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <SlidersHorizontal className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Không tìm thấy sản phẩm
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
                Thử điều chỉnh bộ lọc hoặc tìm kiếm với từ khóa khác.
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Xóa bộ lọc
              </Button>
            </div>
          ) : (
            <div
              className={`grid gap-6 ${
                viewMode === "grid"
                  ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                  : "grid-cols-1"
              }`}
            >
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isLiked={isInWishlist(product.id)}
                  onToggleLike={toggleWishlist}
                  onAddToCart={(product) => addToCart(product, 1)}
                  className={viewMode === "list" ? "flex-row" : ""}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
