import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  LucideHome,
  LucideCheckSquare,
  LucideUsers,
  LucideLogOut,
  LucideX,
  LucideImage,
  LucideTags,
  LucideBell,
} from "lucide-react";
import { useNotifications } from "@/contexts/NotificationsContext";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar = ({ open, onClose }: SidebarProps) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  const navigationItems = [
    {
      name: t("navigation.dashboard"),
      path: "/dashboard",
      icon: LucideHome,
      roles: ["manager", "employee"],
    },
    {
      name: t("navigation.accomplishments"),
      path: "/accomplishments",
      icon: LucideCheckSquare,
      roles: ["manager", "employee"],
    },
    {
      name: t("navigation.employees"),
      path: "/employees",
      icon: LucideUsers,
      roles: ["manager"],
    },
    {
      name: t("navigation.gallery"),
      path: "/gallery",
      icon: LucideImage,
      roles: ["manager"],
    },
    {
      name: t("navigation.taskTitles"),
      path: "/task-titles",
      icon: LucideTags,
      roles: ["manager"],
    },
    {
      name: t("navigation.notifications"),
      path: "/notifications",
      icon: LucideBell,
      roles: ["manager", "employee"],
      badge: true,
    },
  ];

  const filteredNavItems = navigationItems.filter((item) =>
    item.roles.includes(user?.role || "")
  );

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      <aside
        className={cn(
          "fixed inset-y-0 z-50 flex flex-col w-72 glass-sidebar transition-transform duration-300 lg:relative lg:translate-x-0",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/20">
          <h2 className="text-2xl font-bold text-[#385272] glassy-text select-none">
            {t("app.name")}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="glass-btn lg:hidden"
            onClick={onClose}
          >
            <LucideX className="h-5 w-5" />
          </Button>
        </div>

        {/* User Info */}
        {user && (
          <div className="px-6 py-4 border-b border-white/20">
            <p className="text-sm text-[#5479a7]">{t("dashboard.welcome")}</p>
            <p className="text-base font-semibold text-[#385272] glassy-text">
              {user.name}
            </p>
            <p className="text-xs text-[#8cb7e8] mt-1 glassy-text">
              {user.role === "manager" ? "مدير" : "موظف"}
            </p>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {filteredNavItems.map((item) => (
              <li key={item.path} className="relative">
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all glass-nav-link",
                    location.pathname.startsWith(item.path)
                      ? "glass-nav-link-active"
                      : "hover:bg-white/25"
                  )}
                  onClick={onClose}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                  {item.badge && unreadCount > 0 && (
                    <span className="absolute right-0 -top-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="px-3 py-4 border-t border-white/20">
          <Button
            variant="ghost"
            className="glass-btn w-full justify-start gap-3"
            onClick={logout}
          >
            <LucideLogOut className="h-5 w-5" />
            <span>{t("auth.logout")}</span>
          </Button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
