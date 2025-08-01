import React from 'react';
import { useApp } from '../contexts/AppContext';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '../utils/permissions';

interface PermissionGuardProps {
  children: React.ReactNode;
  permissions?: string[];
  requireAny?: boolean;
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permissions = [],
  requireAny = true,
  requireAll = false,
  fallback = null,
}) => {
  const { state } = useApp();
  const userPermissions = state.user?.permissions || [];

  // Nếu không có permissions yêu cầu, hiển thị children
  if (permissions.length === 0) {
    return <>{children}</>;
  }

  let hasAccess = false;

  if (requireAll) {
    hasAccess = hasAllPermissions(userPermissions, permissions);
  } else if (requireAny) {
    hasAccess = hasAnyPermission(userPermissions, permissions);
  } else {
    // Mặc định kiểm tra permission đầu tiên
    hasAccess = hasPermission(userPermissions, permissions[0]);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// Hook để kiểm tra permission
export const usePermission = () => {
  const { state } = useApp();
  const userPermissions = state.user?.permissions || [];

  return {
    hasPermission: (permission: string) => hasPermission(userPermissions, permission),
    hasAnyPermission: (permissions: string[]) => hasAnyPermission(userPermissions, permissions),
    hasAllPermissions: (permissions: string[]) => hasAllPermissions(userPermissions, permissions),
    userPermissions,
  };
};

export default PermissionGuard; 