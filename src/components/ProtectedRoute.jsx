import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { hasAnyPermission, getRoutePermissions } from '../utils/permissions';

const ProtectedRoute = ({ children, requireAdmin = false, requiredPermissions = [] }) => {
  const { state } = useApp();
  const { user, isInitialized } = state;
  const location = useLocation();

  // Hiển thị loading trong lúc đợi load từ localStorage
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Chưa đăng nhập
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Kiểm tra quyền admin nếu yêu cầu
  if (requireAdmin && user.role !== 'Admin') {
    return <Navigate to="/" replace />;
  }

  // Kiểm tra permissions cụ thể nếu có yêu cầu
  if (requiredPermissions.length > 0) {
    const userPermissions = user.permissions || [];
    if (!hasAnyPermission(userPermissions, requiredPermissions)) {
      return <Navigate to="/" replace />;
    }
  }

  // Kiểm tra quyền truy cập route dựa trên pathname
  const currentPath = location.pathname;
  const routePermissions = getRoutePermissions(currentPath);
  
  if (routePermissions.length > 0) {
    const userPermissions = user.permissions || [];
    if (!hasAnyPermission(userPermissions, routePermissions)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute; 