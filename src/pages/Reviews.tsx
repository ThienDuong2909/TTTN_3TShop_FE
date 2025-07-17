import AdminHeader from "../components/AdminHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { MessageSquare } from "lucide-react";

export default function Reviews() {
  return (
    <div>
      <AdminHeader title="Quản lý bình luận" />

      <main className="py-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Quản lý bình luận
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-20">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Trang quản lý bình luận
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Chức năng này đang được phát triển
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
} 