import api from "@/api/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideBell, LucideLoader } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationsContext";

const NotificationsPage = () => {
  const { notifications, setNotifications, loading } = useNotifications();

  const markAllAsRead = async () => {
    await api.post("/notifications/mark-all-read");
    setNotifications((notifs) => notifs.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div className="max-w-xl mx-auto mt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 glassy-text">
          <LucideBell className="h-6 w-6" /> الإشعارات
        </h2>
        <Button
          size="sm"
          variant="outline"
          onClick={markAllAsRead}
          disabled={notifications.every((n) => n.isRead)}
        >
          تعليم الكل كمقروء
        </Button>
      </div>
      {loading ? (
        <div className="flex justify-center p-12">
          <LucideLoader className="h-8 w-8 animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <Card className="glass-card border-none">
          <CardContent className="py-8 text-center text-muted-foreground">
            لا يوجد إشعارات حتى الآن.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <Card
              key={notif._id}
              className={`glass-card border-none flex flex-col p-4 ${
                notif.isRead ? "opacity-70" : "bg-blue-50"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`h-2 w-2 rounded-full ${
                    notif.isRead ? "bg-gray-300" : "bg-blue-600"
                  }`}
                ></span>
                <span className="font-bold">
                  {notif.type === "new_task"
                    ? "مهمة جديدة"
                    : notif.type === "comment"
                    ? "تعليق جديد"
                    : notif.type === "reply"
                    ? "رد جديد"
                    : "إشعار"}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {new Date(notif.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="text-sm">{notif.message}</div>
              {notif.data?.accomplishmentId && (
                <Button
                  className="mt-2 w-fit glass-btn"
                  size="sm"
                  onClick={async () => {
                    if (!notif.isRead) {
                      try {
                        await api.put(`/notifications/${notif._id}/read`);
                        setNotifications((notifs) =>
                          notifs.map((n) =>
                            n._id === notif._id ? { ...n, isRead: true } : n
                          )
                        );
                      } catch (e) {
                        // تجاهل الخطأ أو أظهر رسالة
                      }
                    }
                    window.location.href = `/accomplishments/${notif.data.accomplishmentId}`;
                  }}
                >
                  عرض المهمة
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
