import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { notificationsAPI } from "@/api/api";
import { useSocket } from "@/contexts/SocketContext";
import { useAuth } from "@/contexts/AuthContext";

type Notif = {
  _id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
};

type Ctx = {
  notifications: Notif[];
  loading: boolean;
  unreadCount: number;
  currentPage: number;
  totalPages: number;
  fetchNotifications: (page?: number, append?: boolean) => Promise<void>;
  fetchNext: () => Promise<void>;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
};

const NotificationsContext = createContext<Ctx | null>(null);

export const NotificationsProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const isFetchingMoreRef = useRef(false);

  const recalcUnread = (list: Notif[]) =>
    list.reduce((acc, n) => acc + (n.isRead ? 0 : 1), 0);

  const fetchNotifications = async (page = 1, append = false) => {
    if (!user?._id) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      if (append) isFetchingMoreRef.current = true;
      else setLoading(true);

      const { data, totalPages, currentPage } = await notificationsAPI.get(
        page,
        10
      );

      setNotifications((prev) => (append ? [...prev, ...data] : data));
      setTotalPages(totalPages);
      setCurrentPage(currentPage);
      setUnreadCount((prev) =>
        recalcUnread(append ? [...notifications, ...data] : data)
      );
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    } finally {
      if (append) isFetchingMoreRef.current = false;
      else setLoading(false);
    }
  };

  const fetchNext = async () => {
    if (isFetchingMoreRef.current) return;
    if (currentPage >= totalPages) return;
    await fetchNotifications(currentPage + 1, true);
  };

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error("markAllRead error:", e);
    }
  };

  const markRead = async (id: string) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (e) {
      console.error("markRead error:", e);
    }
  };

  // أول تحميل أو تبديل مستخدم
  useEffect(() => {
    if (!user?._id) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    fetchNotifications(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  // سوكِت: إدخال إشعار جديد أعلى القائمة
  useEffect(() => {
    if (!socket) return;
    const handleNotification = (notif: Notif) => {
      setNotifications((prev) => [notif, ...prev]);
      if (!notif.isRead) setUnreadCount((c) => c + 1);
    };
    socket.on("notification", handleNotification);
    return () => socket.off("notification", handleNotification);
  }, [socket]);

  const value = useMemo(
    () => ({
      notifications,
      loading,
      unreadCount,
      currentPage,
      totalPages,
      fetchNotifications,
      fetchNext,
      markAllRead,
      markRead,
    }),
    [notifications, loading, unreadCount, currentPage, totalPages]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications outside provider");
  return ctx;
};
