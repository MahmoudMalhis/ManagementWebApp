import React, { createContext, useContext, useEffect, useState } from "react";
import api from "@/api/api";
import { useSocket } from "@/contexts/SocketContext";
import { useAuth } from "@/contexts/AuthContext";

const NotificationsContext = createContext(null);

export const NotificationsProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // جلب الإشعارات عند أول دخول المستخدم (أو تبديل الحساب)
  useEffect(() => {
    if (!user?._id) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    api.get("/notifications").then((res) => {
      setNotifications(res.data.data);
      setLoading(false);
    });
  }, [user?._id]);

  // استقبال الإشعار الجديد من السوكيت
  useEffect(() => {
    if (!socket) return;
    const handleNotification = (notif) => {
      setNotifications((prev) => [notif, ...prev]);
    };
    socket.on("notification", handleNotification);
    return () => {
      socket.off("notification", handleNotification);
    };
  }, [socket]);

  // عدد الغير مقروء
  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
