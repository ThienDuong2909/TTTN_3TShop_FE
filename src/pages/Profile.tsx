import { User } from "lucide-react";
import { Badge } from "../components/ui/badge";

export default function Profile() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center py-20">
        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Trang quản lý tài khoản đang được phát triển
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
          Chúng tôi đang hoàn thiện trang này với quản lý thông tin cá nhân,
          lịch sử đơn hàng và danh sách yêu thích.
        </p>
        <Badge variant="secondary" className="text-brand-600">
          Sắp ra mắt
        </Badge>
      </div>
    </div>
  );
}
