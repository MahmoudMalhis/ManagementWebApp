import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LucideMenu, LucideUser } from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  // Toggle language function
  const toggleLanguage = () => {
    const newLang = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
    document.body.dir = newLang === "ar" ? "rtl" : "ltr";
  };

  return (
    <header className="glass-header py-4 px-6 flex items-center justify-between shadow-md">
      {/* Left side - Menu button for mobile */}
      <div>
        <Button
          variant="ghost"
          size="icon"
          className="glass-btn lg:hidden"
          onClick={onMenuClick}
        >
          <LucideMenu className="h-5 w-5" />
        </Button>
      </div>

      {/* Right side - User info and language toggle */}
      <div className="flex items-center gap-4">
        {/* Language toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleLanguage}
          className="glass-btn text-sm"
        >
          {i18n.language === "ar" ? t("common.english") : t("common.arabic")}
        </Button>

        {/* User info on larger screens */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-sm font-medium text-[#395275] glassy-text">
            {user?.name}
          </span>
          <div className="glass-avatar h-8 w-8 rounded-full flex items-center justify-center">
            <LucideUser className="h-4 w-4 text-[#395275]" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
