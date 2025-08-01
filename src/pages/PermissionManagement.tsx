import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { ROLES, PERMISSIONS } from '../utils/permissions';
import { usePermission } from '../components/PermissionGuard';
import { Shield, Users, Key, CheckCircle, XCircle } from 'lucide-react';

export default function PermissionManagement() {
  const { hasPermission } = usePermission();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Kiểm tra quyền admin
  if (!hasPermission('admin.*')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600">Bạn cần quyền admin để truy cập trang này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý phân quyền</h1>
        <p className="text-gray-600">Quản lý vai trò và quyền hạn trong hệ thống</p>
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
                {Object.values(ROLES).map((role) => (
                  <div
                    key={role.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedRole === role.name
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedRole(role.name)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{role.displayName}</h3>
                        <p className="text-sm text-gray-500">ID: {role.id}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {role.permissions.length} quyền
                      </Badge>
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
                  Chi tiết vai trò: {ROLES[selectedRole as keyof typeof ROLES]?.displayName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Thông tin vai trò */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">Thông tin vai trò</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Tên:</span>
                        <p>{ROLES[selectedRole as keyof typeof ROLES]?.displayName}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">ID:</span>
                        <p>{ROLES[selectedRole as keyof typeof ROLES]?.id}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Tổng quyền:</span>
                        <p>{ROLES[selectedRole as keyof typeof ROLES]?.permissions.length}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Danh sách quyền hạn */}
                  <div>
                    <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      Quyền hạn
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {ROLES[selectedRole as keyof typeof ROLES]?.permissions.map((permission) => (
                        <div
                          key={permission}
                          className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded"
                        >
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">
                            {PERMISSIONS[permission as keyof typeof PERMISSIONS] || permission}
                          </span>
                        </div>
                      ))}
                    </div>
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
                <div className="text-2xl font-bold text-blue-600">{Object.keys(ROLES).length}</div>
                <div className="text-sm text-gray-600">Vai trò</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{Object.keys(PERMISSIONS).length}</div>
                <div className="text-sm text-gray-600">Quyền hạn</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {Object.values(ROLES).reduce((acc, role) => acc + role.permissions.length, 0)}
                </div>
                <div className="text-sm text-gray-600">Tổng phân quyền</div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {Object.values(ROLES).filter(role => role.permissions.includes('admin.*')).length}
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