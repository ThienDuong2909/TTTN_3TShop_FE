import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    // Determine active tab based on current route
    const path = location.pathname;
    if (path.includes("/admin/purchase-orders")) return "purchase-orders";
    if (path.includes("/admin/goods-receipt")) return "goods-receipt";
    if (path.includes("/admin/products")) return "products";
    return "overview";
  });

  // Update active tab when route changes
  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/admin/purchase-orders")) {
      setActiveTab("purchase-orders");
    } else if (path.includes("/admin/goods-receipt")) {
      setActiveTab("goods-receipt");
    } else if (path.includes("/admin/products")) {
      setActiveTab("products");
    } else {
      setActiveTab("overview");
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Main content */}
      <main className="lg:pl-72">
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
} 