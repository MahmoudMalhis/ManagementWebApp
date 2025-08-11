import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LucideBell, LucideLoader } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationsContext";
import { useNavigate } from "react-router-dom";

const NotificationsPage = () => {
  const { t } = useTranslation();
  const {
    notifications,
    loading,
    unreadCount,
    currentPage,
    totalPages,
    fetchNext,
    markAllRead,
    markRead,
    // ملاحظة: إذا بدّك تجيب أول صفحة يدوي، عندك fetchNotifications(page?, append?)
  } = useNotifications();

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Infinite scroll: لما نوصل آخر القائمة، جيب الصفحة التالية
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && currentPage < totalPages && !loading) {
          fetchNext();
        }
      },
      { rootMargin: "200px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [currentPage, totalPages, loading, fetchNext]);

  const markAllAsRead = () => {
    if (notifications.every((n) => n.isRead)) return;
    markAllRead();
  };

  return (
    <div className="max-w-xl mx-auto mt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 glassy-text">
          <LucideBell className="h-6 w-6" /> {t("notificationsPage.title")}
        </h2>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {t("notificationsPage.unread")} : {unreadCount}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={markAllAsRead}
            disabled={notifications.every((n) => n.isRead)}
          >
            {t("notificationsPage.markAllRead")}
          </Button>
        </div>
      </div>

      {loading && notifications.length === 0 ? (
        <div className="flex justify-center p-12">
          <LucideLoader className="h-8 w-8 animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <Card className="glass-card border-none">
          <CardContent className="py-8 text-center text-muted-foreground">
            {t("notificationsPage.noNotifications")}
          </CardContent>
        </Card>
      ) : (
        <>
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
                      ? t("notificationsPage.newTask")
                      : notif.type === "comment"
                      ? t("notificationsPage.newComment")
                      : notif.type === "reply"
                      ? t("notificationsPage.newReply")
                      : t("notificationsPage.notification")}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(notif.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="text-sm">{notif.message}</div>

                {/* زر العرض + تعليم كمقروء */}
                {notif.data?.accomplishmentId && (
                  <Button
                    className="mt-2 w-fit glass-btn"
                    size="sm"
                    onClick={async () => {
                      if (!notif.isRead) {
                        await markRead(notif._id);
                      }
                     navigate(`/accomplishments/${notif.data.accomplishmentId}`);
                    }}
                  >
                    {t("notificationsPage.viewAccomplishment")}
                  </Button>
                )}
              </Card>
            ))}

            {/* حالة تحميل أثناء جلب صفحات إضافية */}
            {loading && (
              <div className="flex justify-center py-4">
                <LucideLoader className="h-5 w-5 animate-spin" />
              </div>
            )}

            {/* Sentinel لآخر القائمة */}
            <div ref={sentinelRef} style={{ height: 1 }} />

            {/* وصلنا للنهاية */}
            {currentPage >= totalPages && !loading && (
              <div className="text-center text-sm text-muted-foreground py-3">
                {t("notificationsPage.noMore")}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationsPage;
