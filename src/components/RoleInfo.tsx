import React from 'react';
import { useApp } from '../contexts/AppContext';
import { ROLES, PERMISSIONS } from '../utils/permissions';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';

export const RoleInfo: React.FC = () => {
  const { state } = useApp();
  const { user } = state;

  if (!user) return null;

  // Tìm role hiện tại
  const currentRole = Object.values(ROLES).find(role => role.name === user.role);

  const userPermissions = user.permissions || [];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Thông tin vai trò</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Thông tin user */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Tên:</span>
            <span className="text-sm">{user.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Email:</span>
            <span className="text-sm">{user.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Vai trò:</span>
            <Badge variant="outline" className="text-xs">
              {currentRole?.displayName || user.role}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Danh sách quyền hạn */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Quyền hạn:</h4>
          <div className="flex flex-wrap gap-1">
            {userPermissions.map((permission) => (
              <Badge key={permission} variant="secondary" className="text-xs">
                {PERMISSIONS[permission as keyof typeof PERMISSIONS] || permission}
              </Badge>
            ))}
          </div>
        </div>

        {/* Thống kê quyền hạn */}
        <Separator />
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Thống kê:</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span>Tổng quyền:</span>
              <span className="font-medium">{userPermissions.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Quyền admin:</span>
              <span className="font-medium">
                {userPermissions.includes('admin.*') ? 'Có' : 'Không'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoleInfo; 