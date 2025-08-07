import { createContext, useContext, useEffect, useState } from "react";
import api from "@/api/api";
import { useSocket } from "@/contexts/SocketContext";
import { useAuth } from "@/contexts/AuthContext";

const NotificationsContext = createContext(null);

export const NotificationsProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // جلب الإشعارات عند أول دخول المستخدم (أو تبديل الحساب)
  useEffect(() => {
    if (!user?._id) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    api
      .get("/notifications")
      .then((res) => {
        setNotifications(res.data.data);
        // حساب عدد الإشعارات غير المقروءة عند جلب البيانات
        const count = res.data.data.filter((n) => !n.isRead).length;
        setUnreadCount(count);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch notifications:", err);
        setLoading(false);
      });
  }, [user?._id]);

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      // زيادة العداد فقط إذا كان الإشعار غير مقروء
      if (!notif.isRead) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    socket.on("notification", handleNotification);
    return () => {
      socket.off("notification", handleNotification);
    };
  }, [socket]);

  // عدد الغير مقروء

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        setNotifications,
        unreadCount,
        loading,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications outside provider");
  return ctx;
};
