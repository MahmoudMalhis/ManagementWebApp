import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Login = () => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const { login, loading, error, isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate("/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name && password) {
      await login(name, password);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-md">
        {/* Language toggle at top */}
        <div className="flex justify-end mb-6">
          <Button
            variant="outline"
            size="sm"
            className="glass-btn"
            onClick={() => {
              const newLang = i18n.language === "ar" ? "en" : "ar";
              i18n.changeLanguage(newLang);
              document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
              document.body.dir = newLang === "ar" ? "rtl" : "ltr";
            }}
          >
            {i18n.language === "ar" ? "English" : "العربية"}
          </Button>
        </div>

        <Card className="glass-card border-none">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center glassy-text">
              {t("app.name")}
            </CardTitle>
            <CardDescription className="text-center glassy-text">
              {t("auth.login")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4 glass-card">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="glassy-text">
                  {t("auth.name")}
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={t("auth.name")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="glass-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="glassy-text">
                  {t("auth.password")}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="glass-input"
                />
              </div>
              <Button
                type="submit"
                className="w-full glass-btn"
                disabled={loading}
              >
                {loading ? t("common.loading") : t("auth.loginButton")}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-muted-foreground">
            {t("app.name")} &copy; {new Date().getFullYear()}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
