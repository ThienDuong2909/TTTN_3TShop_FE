// Tạo file src/pages/AccountSettings.tsx

import { useState, useEffect } from "react";
import {
  AccountInfo,
  VaiTro,
  getAccountInfo,
  changePassword,
} from "../../services/api";
import { toast } from "sonner";
import {
  Settings,
  Mail,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useApp } from "@/contexts/AppContext";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@radix-ui/react-dialog";
import { Label } from "@radix-ui/react-dropdown-menu";

// Skeleton Component
const Skeleton = ({ className = "", ...props }) => (
  <div
    className={`animate-pulse bg-gray-200 rounded ${className}`}
    {...props}
  />
);

// Account Settings Skeleton Component
const AccountSettingsSkeleton = () => (
  <div className="space-y-6">
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-40" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email Field */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Role Field */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default function AccountSettings() {
  const { state } = useApp();
  const [loading, setLoading] = useState(true);
  const [accountData, setAccountData] = useState<AccountInfo | null>(null);

  // Change password modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  // Password form data
  const [passwordForm, setPasswordForm] = useState({
    matKhauCu: "",
    matKhauMoi: "",
    xacNhanMatKhau: "",
  });

  // Progressive loading states
  const [progressiveStates, setProgressiveStates] = useState({
    header: false,
    accountInfo: false,
    security: false,
  });

  // Load account data
  useEffect(() => {
    loadAccountInfo();
  }, []);

  const loadAccountInfo = async () => {
    try {
      setLoading(true);
      // Reset progressive states
      setProgressiveStates({
        header: false,
        accountInfo: false,
        security: false,
      });

      const response = await getAccountInfo();
      console.log("Account info response:", response);

      if (response.success) {
        setAccountData(response.data);
        setLoading(false);

        // Start progressive loading animation
        setTimeout(
          () => setProgressiveStates((prev) => ({ ...prev, header: true })),
          100
        );
        setTimeout(
          () =>
            setProgressiveStates((prev) => ({ ...prev, accountInfo: true })),
          300
        );
        setTimeout(
          () => setProgressiveStates((prev) => ({ ...prev, security: true })),
          500
        );
      }
    } catch (error) {
      toast.error("Không thể tải thông tin tài khoản");
      console.error("Error loading account info:", error);
      setLoading(false);
    }
  };

  // Handle password form change
  const handlePasswordChange = (field: string, value: string) => {
    setPasswordForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // Validate password form
  const validatePasswordForm = () => {
    const { matKhauCu, matKhauMoi, xacNhanMatKhau } = passwordForm;

    if (!matKhauCu.trim()) {
      toast.error("Vui lòng nhập mật khẩu cũ");
      return false;
    }

    if (!matKhauMoi.trim()) {
      toast.error("Vui lòng nhập mật khẩu mới");
      return false;
    }

    if (!xacNhanMatKhau.trim()) {
      toast.error("Vui lòng xác nhận mật khẩu mới");
      return false;
    }

    if (matKhauMoi.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return false;
    }

    if (matKhauMoi === matKhauCu) {
      toast.error("Mật khẩu mới phải khác mật khẩu cũ");
      return false;
    }

    if (matKhauMoi !== xacNhanMatKhau) {
      toast.error("Xác nhận mật khẩu không khớp");
      return false;
    }

    return true;
  };

  // Handle change password
  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return;

    try {
      setPasswordChanging(true);
      const passwordData = {
        matKhauCu: passwordForm.matKhauCu,
        matKhauMoi: passwordForm.matKhauMoi,
      };

      const response = await changePassword(passwordData);

      if (response.success) {
        toast.success("Đổi mật khẩu thành công");
        setIsPasswordModalOpen(false);
        setPasswordForm({
          matKhauCu: "",
          matKhauMoi: "",
          xacNhanMatKhau: "",
        });
        setShowPasswords({
          old: false,
          new: false,
          confirm: false,
        });
      } else {
        toast.error(response.message || "Không thể đổi mật khẩu");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi đổi mật khẩu");
      console.error("Error changing password:", error);
    } finally {
      setPasswordChanging(false);
    }
  };

  // Get role display text
  const getRoleDisplayText = (vaiTroObj: VaiTro | undefined) => {
    if (!vaiTroObj) return "Không xác định";

    const roleMap: Record<string, string> = {
      KhachHang: "Khách hàng",
    };

    return (
      roleMap[vaiTroObj.TenVaiTro] || vaiTroObj.TenVaiTro || "Không xác định"
    );
  };

  // Hiển thị skeleton khi đang loading
  if (loading) {
    return <AccountSettingsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Account Information Card */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle
            className={`flex items-center gap-2 transition-all duration-500 ${
              progressiveStates.header
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            <Settings className="h-5 w-5" />
            Cài đặt tài khoản
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Account Info Section */}
          <div
            className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-500 ${
              progressiveStates.accountInfo
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            {/* Email */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                value={accountData?.Email || state.user?.email || ""}
                disabled
                className="bg-gray-50 text-gray-900 font-medium"
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Vai trò
              </Label>
              <Input
                value={getRoleDisplayText(accountData?.VaiTro)}
                disabled
                className="bg-gray-50 text-gray-900 font-medium"
              />
            </div>

            {/* Password Section */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Mật khẩu
              </Label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value="••••••••••••"
                  disabled
                  className="bg-gray-50 text-gray-900 font-medium"
                />
                <Dialog
                  open={isPasswordModalOpen}
                  onOpenChange={setIsPasswordModalOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 hover:bg-yellow-50 hover:border-yellow-300"
                    >
                      <Shield className="h-4 w-4" />
                      Đổi mật khẩu
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Đổi mật khẩu
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      {/* Current Password */}
                      <div className="space-y-2">
                        <Label htmlFor="oldPassword">Mật khẩu hiện tại *</Label>
                        <div className="relative">
                          <Input
                            id="oldPassword"
                            type={showPasswords.old ? "text" : "password"}
                            value={passwordForm.matKhauCu}
                            onChange={(e) =>
                              handlePasswordChange("matKhauCu", e.target.value)
                            }
                            placeholder="Nhập mật khẩu hiện tại"
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => togglePasswordVisibility("old")}
                          >
                            {showPasswords.old ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* New Password */}
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">Mật khẩu mới *</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showPasswords.new ? "text" : "password"}
                            value={passwordForm.matKhauMoi}
                            onChange={(e) =>
                              handlePasswordChange("matKhauMoi", e.target.value)
                            }
                            placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => togglePasswordVisibility("new")}
                          >
                            {showPasswords.new ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Confirm New Password */}
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">
                          Xác nhận mật khẩu mới *
                        </Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showPasswords.confirm ? "text" : "password"}
                            value={passwordForm.xacNhanMatKhau}
                            onChange={(e) =>
                              handlePasswordChange(
                                "xacNhanMatKhau",
                                e.target.value
                              )
                            }
                            placeholder="Nhập lại mật khẩu mới"
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => togglePasswordVisibility("confirm")}
                          >
                            {showPasswords.confirm ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Password Requirements - Đổi từ blue sang yellow-orange */}
                      <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                        <p className="text-sm text-yellow-800 font-medium mb-1">
                          Yêu cầu mật khẩu:
                        </p>
                        <ul className="text-xs text-yellow-700 space-y-1">
                          <li>• Tối thiểu 6 ký tự</li>
                          <li>• Khác với mật khẩu hiện tại</li>
                          <li>• Nên kết hợp chữ, số và ký tự đặc biệt</li>
                        </ul>
                      </div>

                      {/* Action Buttons - Đổi từ blue sang yellow-orange */}
                      <div className="flex gap-3 pt-4 border-t">
                        <Button
                          onClick={handleChangePassword}
                          disabled={passwordChanging}
                          className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                          {passwordChanging ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Đang đổi...
                            </>
                          ) : (
                            <>
                              <Shield className="h-4 w-4 mr-2" />
                              Đổi mật khẩu
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsPasswordModalOpen(false)}
                          disabled={passwordChanging}
                          className="hover:bg-yellow-50 hover:border-yellow-300"
                        >
                          Hủy
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div
            className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 transition-all duration-500 ${
              progressiveStates.security
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800 mb-1">
                  Bảo mật tài khoản
                </h4>
                <p className="text-sm text-yellow-700">
                  Để bảo vệ tài khoản của bạn, hãy thường xuyên thay đổi mật
                  khẩu và không chia sẻ thông tin đăng nhập với người khác.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
