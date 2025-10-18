import { Product } from "@/types/product.type";

export const getProductsByCategory = (categorySlug: string): Product[] => {
  if (categorySlug === "sale") {
    return products.filter(
      (product) => product.discount && product.discount > 0,
    );
  }

  const category = categories.find((cat) => cat.slug === categorySlug);
  if (!category) return [];

  // Get products from main category and subcategories
  const categoryIds = [category.id];
  if (category.subcategories) {
    categoryIds.push(...category.subcategories.map((sub) => sub.id));
  }

  return products.filter((product) =>
    categoryIds.some((id) => product.category?.startsWith(id)),
  );
};