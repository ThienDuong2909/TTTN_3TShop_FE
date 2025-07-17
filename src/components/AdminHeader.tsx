import { Link } from "react-router-dom";
import { useApp } from "../contexts/AppContext";

interface AdminHeaderProps {
  title: string;
  showBackButton?: boolean;
  backLink?: string;
}

export default function AdminHeader({ 
  title, 
  showBackButton = true, 
  backLink = "/" 
}: AdminHeaderProps) {
  const { state } = useApp();

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <h1 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
            {title}
          </h1>
        </div>
        <div className="flex flex-1 justify-end">
          {showBackButton && (
            <Link
              to={backLink}
              className="text-sm text-muted-foreground hover:text-brand-600"
            >
              ← Về trang chủ
            </Link>
          )}
        </div>
      </div>
    </div>
  );
} 