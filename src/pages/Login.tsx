import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { useApp } from "../contexts/AppContext";
import * as api from "../services/api";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  const { setUser } = useApp();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = "Email là bắt buộc";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!password) {
      newErrors.password = "Mật khẩu là bắt buộc";
    } else if (password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  function mapUserFromApi(res: any) {
    // Extract role from response
    let role = res.data?.role || res.data?.user?.TaiKhoan?.VaiTro?.TenVaiTro;
    if (role === "Admin") role = "admin";
    else if (role === "NhanVien") role = "staff";
    else if (role === "KhachHang") role = "customer";

    // Extract user info
    const apiUser = res.data?.user;
    return {
      id: apiUser?.MaKH || apiUser?.id || apiUser?.MaTK || apiUser?.TaiKhoan?.MaTK,
      email: apiUser?.TaiKhoan?.Email || apiUser?.Email || apiUser?.TenKH,
      name: apiUser?.TenKH || apiUser?.TaiKhoan?.Email || apiUser?.Email,
      role,
      avatar: apiUser?.avatar || undefined,
      // Add more fields if needed
    };
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Call real API
      const res = await api.login({ email, password });
      console.log("API LOGIN RESPONSE", res);
      if (res?.success && res.data?.token && res.data?.user) {
        // Save token
        localStorage.setItem("token", res.data.token);
        // Set user context
        const userObj = mapUserFromApi(res);
        console.log("USER AFTER MAP", userObj);
        setUser(userObj);
        toast.success("Đăng nhập thành công!");
        navigate("/");
      } else {
        toast.error(res?.error || res?.message || "Đăng nhập thất bại");
        setErrors({ email: res?.error || res?.message || "Đăng nhập thất bại" });
      }
    } catch (error: any) {
      toast.error(error.message || "Đăng nhập thất bại");
      setErrors({ email: error.message || "Đăng nhập thất bại" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Removed logo and FashionHub text for a cleaner login form */}

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Đăng nhập</CardTitle>
            <CardDescription className="text-center">
              Đăng nhập vào tài khoản của bạn để tiếp tục mua sắm
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Nhập email của bạn"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked: boolean) =>
                      setRememberMe(!!checked)
                    }
                  />
                  <Label htmlFor="remember" className="text-sm">
                    Ghi nhớ đăng nhập
                  </Label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm text-brand-600 hover:text-brand-500"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-700"
                disabled={isLoading}
              >
                {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                    Hoặc đăng nhập với
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <Button variant="outline" className="w-full">
                  <svg
                    className="w-4 h-4 mr-2"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </Button>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              Chưa có tài khoản?{" "}
              <Link
                to="/register"
                className="font-medium text-brand-600 hover:text-brand-500"
              >
                Đăng ký ngay
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Demo Account Info */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <p className="font-semibold text-center">Tài khoản demo:</p>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div>
                  <strong>Admin:</strong> admin@fashionhub.vn
                </div>
                <div>
                  <strong>Nhân viên:</strong> nhanvien@fashionhub.vn
                </div>
                <div>
                  <strong>Khách hàng:</strong> Email bất kỳ khác
                </div>
                <div className="text-center mt-2">
                  <em>Mật khẩu: Nhập bất kỳ</em>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
