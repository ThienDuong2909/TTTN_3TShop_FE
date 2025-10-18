import { Navigate, useLocation } from "react-router-dom";
import { useApp } from "../contexts/AppContext";
import { hasAnyPermission, getRoutePermissions } from "../utils/permissions";

const ProtectedRoute = ({
  children,
  requireAdmin = false,
  requiredPermissions = [],
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requiredPermissions?: string[];
}) => {
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
  if (requireAdmin && !user.permissions?.includes("toanquyen")) {
    console.log("Require admin");
    return <Navigate to="/" replace />;
  }

  // Kiểm tra permissions cụ thể nếu có yêu cầu
  if (requiredPermissions.length > 0) {
    console.log("Require permission");
    const userPermissions = user.permissions || [];
    console.log(requiredPermissions, userPermissions);
    if (!hasAnyPermission(userPermissions, requiredPermissions)) {
      return <Navigate to="/" replace />;
    }
  }

  // Kiểm tra quyền truy cập route dựa trên pathname
  const currentPath = location.pathname;
  const routePermissions = getRoutePermissions(currentPath);
  console.log("routePermissions", routePermissions);

  if (routePermissions.length > 0) {
    console.log("No permission was found");
    const userPermissions = user.permissions || [];
    console.log("userPermissions", userPermissions);
    if (!hasAnyPermission(userPermissions, routePermissions)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
