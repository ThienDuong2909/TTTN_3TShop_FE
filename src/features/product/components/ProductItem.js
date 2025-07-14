import { Link } from "react-router-dom";
// import defaultImage from "../../../assets/logo.svg"; // dùng ảnh mặc định nếu không có ảnh

const ProductItem = ({ product }) => {
  const { MaSP, TenSP, HinhAnh, Gia, MauSac } = product;

  return (
    <Link to={`/products/${MaSP}`} className="border rounded p-3 hover:shadow">
      <img
        src={
          HinhAnh
          // || defaultImage
        }
        alt={TenSP}
        className="w-full h-40 object-cover mb-2"
      />
      <h2 className="text-lg font-semibold">{TenSP}</h2>
      <p className="text-red-500 font-bold">{Gia.toLocaleString()}₫</p>
      <div className="flex gap-1 mt-2">
        {MauSac?.map((color, idx) => (
          <div
            key={idx}
            className="w-4 h-4 rounded-full border"
            style={{ backgroundColor: color.MaHex || "#ddd" }}
            title={color.TenMau}
          />
        ))}
      </div>
    </Link>
  );
};

export default ProductItem;
