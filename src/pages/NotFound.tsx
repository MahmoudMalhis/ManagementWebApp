import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { LucideAlertCircle, LucideHome } from 'lucide-react';

const NotFound = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="space-y-6 max-w-md">
        <div className="flex justify-center">
          <LucideAlertCircle className="h-16 w-16 text-muted-foreground" />
        </div>

        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-xl font-semibold">
          Page Not Found
        </p>
        
        <p className="text-muted-foreground">
          The page you are looking for does not exist or has been moved.
        </p>

        <Link to="/dashboard">
          <Button className="flex items-center gap-2">
            <LucideHome className="h-4 w-4" />
            {t('navigation.dashboard')}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;