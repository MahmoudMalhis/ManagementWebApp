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
} from "lucide-react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar = ({ open, onClose }: SidebarProps) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, logout, isManager } = useAuth();

  // Navigation items based on user role
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
  ];

  // Filter navigation items by user role
  const filteredNavItems = navigationItems.filter((item) =>
    item.roles.includes(user?.role || "")
  );

  return (
    <>
      {/* Backdrop for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 z-50 flex flex-col w-72 bg-white dark:bg-gray-800 shadow-lg transition-transform duration-300 lg:relative lg:translate-x-0",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t("app.name")}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
          >
            <LucideX className="h-5 w-5" />
          </Button>
        </div>

        {/* User Info */}
        {user && (
          <div className="px-6 py-4 border-b dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("dashboard.welcome")}
            </p>
            <p className="text-base font-medium text-gray-900 dark:text-gray-100">
              {user.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user.role === "manager" ? "مدير" : "موظف"}
            </p>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {filteredNavItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    location.pathname.startsWith(item.path)
                      ? "bg-primary text-primary-foreground"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="px-3 py-4 border-t dark:border-gray-700">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-gray-700 dark:text-gray-200"
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
