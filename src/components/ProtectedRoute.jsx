import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
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

  // Yêu cầu admin nhưng user không phải admin
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute; 