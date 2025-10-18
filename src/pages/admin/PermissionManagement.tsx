import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Separator } from "../../components/ui/separator";
import { PERMISSIONS } from "../../utils/permissions";
import { usePermission } from "../../components/PermissionGuard";
import {
  Shield,
  Users,
  Key,
  CheckCircle,
  XCircle,
  Edit2,
  Save,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

// Interface cho Role từ API
interface RoleFromAPI {
  id: number;
  name: string;
  displayName: string;
  permissions: string[];
}

// Interface cho Permission từ API
interface PermissionFromAPI {
  key: string;
  name: string;
  description?: string;
}

export default function PermissionManagement() {
  const { hasPermission } = usePermission();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editedPermissions, setEditedPermissions] = useState<string[]>([]);

  // State cho dữ liệu từ API
  const [roles, setRoles] = useState<Record<string, RoleFromAPI>>({});
  const [permissions, setPermissions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tất cả roles và permissions khi component mount
  useEffect(() => {
    fetchRolesAndPermissions();
  }, []);

  const fetchRolesAndPermissions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Gọi API lấy tất cả roles
      const rolesResponse = await fetch("http://localhost:8080/api/roles", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!rolesResponse.ok) {
        throw new Error("Không thể lấy danh sách vai trò");
      }

      const rolesData = await rolesResponse.json();

      // Gọi API lấy tất cả permissions
      const permissionsResponse = await fetch(
        "http://localhost:8080/api/permissions",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!permissionsResponse.ok) {
        throw new Error("Không thể lấy danh sách quyền hạn");
      }

      const permissionsData = await permissionsResponse.json();

      // Xử lý dữ liệu roles
      if (rolesData.success && rolesData.data) {
        const rolesMap: Record<string, RoleFromAPI> = {};
        rolesData.data.forEach((role: RoleFromAPI) => {
          // Tạo key cho role (ví dụ: ADMIN, STORE_STAFF, etc.)
          const roleKey = role.name.toUpperCase().replace(/\s+/g, "_");
          rolesMap[roleKey] = role;
        });
        setRoles(rolesMap);
      }

      // Xử lý dữ liệu permissions
      if (permissionsData.success && permissionsData.data) {
        const permissionsMap: Record<string, string> = {};
        permissionsData.data.forEach((permission: PermissionFromAPI) => {
          permissionsMap[permission.key] = permission.name;
        });
        setPermissions(permissionsMap);
      }
    } catch (error) {
      console.error("Error fetching roles and permissions:", error);
      setError(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = (roleKey: string) => {
    setEditingRole(roleKey);
    setEditedPermissions([...(roles[roleKey]?.permissions || [])]);
  };

  const handleCancelEdit = () => {
    setEditingRole(null);
    setEditedPermissions([]);
  };

  const handleSaveRole = async (roleKey: string) => {
    try {
      const role = roles[roleKey];
      if (!role) return;

      // Gọi API để cập nhật quyền cho vai trò
      const response = await fetch(
        `http://localhost:8080/api/roles/${role.id}/permissions`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            permissions: editedPermissions,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Cập nhật state local với permissions mới
          setRoles((prev) => ({
            ...prev,
            [roleKey]: {
              ...prev[roleKey],
              permissions: [...editedPermissions],
            },
          }));

          toast.success(
            `Cập nhật quyền cho vai trò "${role.displayName}" thành công!`
          );
          setEditingRole(null);
          setEditedPermissions([]);
        } else {
          toast.error(result.message || "Cập nhật thất bại");
        }
      } else {
        toast.error("Có lỗi khi cập nhật quyền");
      }
    } catch (error) {
      console.error("Error updating role permissions:", error);
      toast.error("Có lỗi khi cập nhật quyền");
    }
  };

  const togglePermission = (permission: string) => {
    setEditedPermissions((prev) => {
      // Nếu đang chọn "toàn quyền"
      if (permission === "toanquyen") {
        if (prev.includes("toanquyen")) {
          // Nếu đã có "toàn quyền", bỏ chọn tất cả
          return [];
        } else {
          // Nếu chọn "toàn quyền", chọn tất cả permissions
          return Object.keys(permissions);
        }
      }

      // Nếu đang bỏ chọn một permission khác "toàn quyền"
      if (prev.includes(permission)) {
        const newPermissions = prev.filter((p) => p !== permission);
        // Nếu bỏ chọn bất kỳ permission nào, cũng bỏ chọn "toàn quyền"
        return newPermissions.filter((p) => p !== "toanquyen");
      } else {
        // Nếu chọn thêm permission
        const newPermissions = [...prev, permission];
        // Kiểm tra xem có phải đã chọn tất cả permissions không
        const allPermissions = Object.keys(permissions);
        const hasAllPermissions = allPermissions.every((p) =>
          newPermissions.includes(p)
        );

        if (hasAllPermissions) {
          // Nếu đã chọn tất cả, thay bằng "toàn quyền"
          return ["toanquyen"];
        } else {
          return newPermissions;
        }
      }
    });
  };

  // Hàm kiểm tra xem permission có được chọn không (bao gồm cả toàn quyền)
  const isPermissionSelected = (permission: string) => {
    if (editedPermissions.includes("toanquyen")) {
      return true; // Nếu có "toàn quyền", tất cả đều được chọn
    }
    return editedPermissions.includes(permission);
  };

  // Hàm kiểm tra xem có phải đang edit không
  const isEditing = editingRole === selectedRole;

  const getPermissionCategory = (permission: string) => {
    const [module] = permission.split(".");
    switch (module) {
      case "sanpham":
        return "Sản phẩm";
      case "donhang":
        return "Đơn hàng";
      case "binhluan":
        return "Bình luận";
      case "giohang":
        return "Giỏ hàng";
      case "nhanvien":
        return "Nhân viên";
      case "hoadon":
        return "Hóa đơn";
      case "nhacungcap":
        return "Nhà cung cấp";
      case "danhmuc":
        return "Danh mục";
      case "mausac":
        return "Màu sắc";
      case "kichthuoc":
        return "Kích thước";
      case "nhaphang":
        return "Nhập hàng";
      case "dathang":
        return "Đặt hàng";
      case "bophan":
        return "Bộ phận";
      case "tigia":
        return "Tỷ giá";
      case "trangthaidonhang":
        return "Trạng thái đơn hàng";
      case "taikhoan":
        return "Tài khoản";
      case "thongtin":
        return "Thông tin";
      case "toanquyen":
        return "Toàn quyền";
      case "taobaocao":
        return "Tạo báo cáo";
      default:
        return "Khác";
    }
  };

  const groupedPermissions = Object.entries(permissions).reduce(
    (acc, [key, value]) => {
      const category = getPermissionCategory(key);
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({ key, value });
      return acc;
    },
    {} as Record<string, Array<{ key: string; value: string }>>
  );

  // Kiểm tra quyền admin
  if (!hasPermission("toanquyen")) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Không có quyền truy cập
          </h2>
          <p className="text-gray-600">
            Bạn cần quyền admin để truy cập trang này.
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Loader2 className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Đang tải dữ liệu...
          </h2>
          <p className="text-gray-600">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Có lỗi xảy ra
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button
            onClick={fetchRolesAndPermissions}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Quản lý phân quyền
        </h1>
        <p className="text-gray-600">
          Quản lý vai trò và quyền hạn trong hệ thống
        </p>
        <Button
          onClick={fetchRolesAndPermissions}
          variant="outline"
          size="sm"
          className="mt-2"
        >
          <Loader2 className="h-4 w-4 mr-2" />
          Làm mới dữ liệu
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Danh sách vai trò */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Vai trò hệ thống
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(roles).map(([roleKey, role]) => (
                  <div
                    key={role.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedRole === roleKey
                        ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedRole(roleKey)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {role.displayName}
                        </h3>
                        <p className="text-sm text-gray-500">ID: {role.id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {role.permissions.length} quyền
                        </Badge>
                        {hasPermission("toanquyen") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditRole(roleKey);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chi tiết vai trò */}
        <div className="lg:col-span-2">
          {selectedRole ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Chi tiết vai trò: {roles[selectedRole]?.displayName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Thông tin vai trò */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">
                      Thông tin vai trò
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Tên:</span>
                        <p>{roles[selectedRole]?.displayName}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">ID:</span>
                        <p>{roles[selectedRole]?.id}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">
                          Tổng quyền:
                        </span>
                        <p>{roles[selectedRole]?.permissions.length}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Danh sách quyền hạn */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        Quyền hạn
                      </h3>
                      {editingRole === selectedRole ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveRole(selectedRole)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Lưu
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Hủy
                          </Button>
                        </div>
                      ) : (
                        hasPermission("toanquyen") && (
                          <Button
                            size="sm"
                            onClick={() => handleEditRole(selectedRole)}
                          >
                            <Edit2 className="h-4 w-4 mr-1" />
                            Chỉnh sửa
                          </Button>
                        )
                      )}
                    </div>

                    {editingRole === selectedRole ? (
                      // Chế độ chỉnh sửa
                      <div className="space-y-4">
                        {Object.entries(groupedPermissions).map(
                          ([category, permissions]) => (
                            <div
                              key={category}
                              className="border rounded-lg p-3"
                            >
                              <h4 className="font-medium text-gray-700 mb-2">
                                {category}
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {permissions.map(({ key, value }) => (
                                  <label
                                    key={key}
                                    className="flex items-center gap-2 p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isPermissionSelected(key)}
                                      onChange={() => togglePermission(key)}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">
                                      {value}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      // Chế độ xem
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {roles[selectedRole]?.permissions.includes("toanquyen")
                          ? // Nếu có "toàn quyền", hiển thị tất cả permissions
                            Object.entries(permissions).map(([key, value]) => (
                              <div
                                key={key}
                                className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded"
                              >
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-sm">{value}</span>
                                {key === "toanquyen" && (
                                  <Badge
                                    variant="secondary"
                                    className="ml-auto text-xs bg-green-100 text-green-800"
                                  >
                                    Toàn quyền
                                  </Badge>
                                )}
                              </div>
                            ))
                          : // Nếu không có "toàn quyền", hiển thị permissions thông thường
                            roles[selectedRole]?.permissions.map(
                              (permission) => (
                                <div
                                  key={permission}
                                  className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded"
                                >
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span className="text-sm">
                                    {permissions[permission] || permission}
                                  </span>
                                </div>
                              )
                            )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-4" />
                  <p>Chọn một vai trò để xem chi tiết</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Tổng quan hệ thống */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Tổng quan hệ thống phân quyền</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Object.keys(roles).length}
                </div>
                <div className="text-sm text-gray-600">Vai trò</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Object.keys(permissions).length}
                </div>
                <div className="text-sm text-gray-600">Quyền hạn</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {Object.values(roles).reduce((acc, role) => {
                    if (role.permissions.includes("toanquyen")) {
                      // Nếu có "toàn quyền", tính tất cả permissions
                      return acc + Object.keys(permissions).length;
                    }
                    return acc + role.permissions.length;
                  }, 0)}
                </div>
                <div className="text-sm text-gray-600">Tổng phân quyền</div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {
                    Object.values(roles).filter((role) =>
                      role.permissions.includes("toanquyen")
                    ).length
                  }
                </div>
                <div className="text-sm text-gray-600">Quản trị viên</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
