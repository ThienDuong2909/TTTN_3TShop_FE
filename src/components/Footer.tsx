import { Link } from "react-router-dom";
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

function Footer() {
  const customerLinks = [
    { name: "Giới thiệu", href: "/about" },
    { name: "Liên hệ", href: "/contact" },
    { name: "Hướng dẫn mua hàng", href: "/guide" },
    { name: "Chính sách đổi trả", href: "/return-policy" },
    { name: "Chính sách bảo mật", href: "/privacy" },
    { name: "Điều khoản sử dụng", href: "/terms" },
  ];

  const categoryLinks = [
    { name: "Thời trang nam", href: "/nam" },
    { name: "Thời trang nữ", href: "/nu" },
    { name: "Thời trang trẻ em", href: "/tre-em" },
    { name: "Phụ kiện", href: "/phu-kien" },
    { name: "Giày dép", href: "/giay-dep" },
    { name: "Túi xách", href: "/tui-xach" },
  ];

  const supportLinks = [
    { name: "Hỗ trợ khách hàng", href: "/support" },
    { name: "Câu hỏi thường gặp", href: "/faq" },
    { name: "Theo dõi đơn hàng", href: "/track-order" },
    { name: "Kích thước", href: "/size-guide" },
    { name: "Thanh toán", href: "/payment-methods" },
    { name: "Vận chuyển", href: "/shipping" },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Company Info */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-gradient-to-r from-brand-500 to-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              3TShop
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Thời trang hiện đại, chất lượng cao với giá cả hợp lý. Mang đến
            phong cách thời trang tốt nhất cho bạn.
          </p>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
              <MapPin className="h-4 w-4" />
              <span>123 Nguyễn Huệ, Q1, TP.HCM</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
              <Phone className="h-4 w-4" />
              <span>0123 456 789</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
              <Mail className="h-4 w-4" />
              <span>info@fashionhub.vn</span>
            </div>
          </div>
        </div>

        {/* Customer Service */}
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
            Khách hàng
          </h4>
          <ul className="space-y-3">
            {customerLinks.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.href}
                  className="text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
            Danh mục
          </h4>
          <ul className="space-y-3">
            {categoryLinks.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.href}
                  className="text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
            Hỗ trợ
          </h4>
          <ul className="space-y-3">
            {supportLinks.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.href}
                  className="text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Social Media & Payment */}
      <div className="border-t border-gray-200 dark:border-gray-700 mt-12 pt-8">
        <div className="flex flex-col lg:flex-row justify-between items-center">
          <div className="flex items-center space-x-4 mb-4 lg:mb-0">
            <span className="text-gray-600 dark:text-gray-300">
              Theo dõi chúng tôi:
            </span>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="p-2">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="p-2">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="p-2">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="p-2">
                <Youtube className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-gray-600 dark:text-gray-300">
              Thanh toán:
            </span>
            <div className="flex space-x-2">
              <div className="bg-white border rounded px-2 py-1 text-xs font-medium">
                VISA
              </div>
              <div className="bg-white border rounded px-2 py-1 text-xs font-medium">
                MASTER
              </div>
              <div className="bg-white border rounded px-2 py-1 text-xs font-medium">
                COD
              </div>
              <div className="bg-white border rounded px-2 py-1 text-xs font-medium">
                MOMO
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8 text-center">
        <p className="text-gray-600 dark:text-gray-300">
          © 2024 FashionHub. Tất cả quyền được bảo lưu.
        </p>
      </div>
    </div>
  );
}

export default Footer;
