import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LucideMenu, LucideUser } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  // Toggle language function
  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.body.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 py-4 px-6 flex items-center justify-between">
      {/* Left side - Menu button for mobile */}
      <div>
        <Button 
          variant="ghost" 
          size="icon"
          className="lg:hidden"
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
          className="text-sm"
        >
          {i18n.language === 'ar' ? 'English' : 'العربية'}
        </Button>

        {/* User info on larger screens */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-sm font-medium">
            {user?.name}
          </span>
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
            <LucideUser className="h-4 w-4" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;