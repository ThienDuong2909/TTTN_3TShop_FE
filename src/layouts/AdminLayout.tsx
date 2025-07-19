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
    if (path.includes("/admin/dashboard")) return "overview";
    if (path.includes("/admin/products")) return "products";
    if (path.includes("/admin/categories")) return "categories";
    if (path.includes("/admin/orders")) return "orders";
    if (path.includes("/admin/purchase-orders")) return "purchase-orders";
    if (path.includes("/admin/goods-receipt")) return "goods-receipt";
    if (path.includes("/admin/suppliers")) return "suppliers";
    if (path.includes("/admin/invoices")) return "invoices";
    if (path.includes("/admin/discounts")) return "discounts";
    if (path.includes("/admin/reviews")) return "reviews";
    if (path.includes("/admin/staff")) return "staff";
    if (path.includes("/admin/departments")) return "departments";
    return "overview";
  });

  // Update active tab when route changes
  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/admin/dashboard")) {
      setActiveTab("overview");
    } else if (path.includes("/admin/products")) {
      setActiveTab("products");
    } else if (path.includes("/admin/categories")) {
      setActiveTab("ctegories");
    } else if (path.includes("/admin/orders")) {
      setActiveTab("orders");
    } else if (path.includes("/admin/purchase-orders")) {
      setActiveTab("purchase-orders");
    } else if (path.includes("/admin/goods-receipt")) {
      setActiveTab("goods-receipt");
    } else if (path.includes("/admin/suppliers")) {
      setActiveTab("suppliers");
    } else if (path.includes("/admin/invoices")) {
      setActiveTab("invoices");
    } else if (path.includes("/admin/discounts")) {
      setActiveTab("discounts");
    } else if (path.includes("/admin/reviews")) {
      setActiveTab("reviews");
    } else if (path.includes("/admin/staff")) {
      setActiveTab("staff");
    } else if (path.includes("/admin/departments")) {
      setActiveTab("departments");
    } else {
      setActiveTab("overview");
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Main content */}
      <main className="lg:pl-64">
        <div className="px-2 py-3 sm:px-3 lg:px-4">
          {children}
        </div>
      </main>
    </div>
  );
} 