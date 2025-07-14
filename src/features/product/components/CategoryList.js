import { useEffect, useState } from "react";
import { getCategories } from "../services/categoryService";

const CategoryList = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err) => console.error("Lỗi lấy category:", err));
  }, []);

  return (
    <div className="flex gap-2 overflow-x-auto">
      {categories.map((c) => (
        <div
          key={c.MaLoaiSP}
          className="px-3 py-2 border rounded hover:bg-gray-100 cursor-pointer"
        >
          {c.TenLoai}
        </div>
      ))}
    </div>
  );
};

export default CategoryList;
