import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { LucideAlertCircle, LucideHome } from "lucide-react";

const NotFound = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
      <div className="space-y-6 max-w-md w-full glass-card border-none shadow-xl p-8">
        <div className="flex justify-center">
          <LucideAlertCircle className="h-16 w-16 text-blue-400 glassy-text" />
        </div>
        <h1 className="text-5xl font-bold glassy-text">404</h1>
        <p className="text-xl font-semibold glassy-text">
          {t("common.pageNotFound") || "Page Not Found"}
        </p>
        <p className="text-muted-foreground glassy-text">
          {t("common.pageNotFoundDesc") ||
            "The page you are looking for does not exist or has been moved."}
        </p>
        <Link to="/dashboard">
          <Button className="flex items-center gap-2 glass-btn">
            <LucideHome className="h-4 w-4" />
            {t("navigation.dashboard")}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
