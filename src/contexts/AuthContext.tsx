import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authAPI } from "@/api/api";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "react-i18next";

interface User {
  _id: string;
  id: string;
  name: string;
  email: string;
  role: "manager" | "employee";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Check if user is authenticated on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const userData = await authAPI.getCurrentUser();
        setUser(userData.user);
        setIsAuthenticated(true);
      } catch (err) {
        console.error("Auth error:", err);
        localStorage.removeItem("token");
        setToken(null);
        setError(err.message || "Authentication failed");
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.login(email, password);

      const { token: newToken, user: userData } = response;

      // Save token to localStorage
      localStorage.setItem("token", newToken);
      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);

      toast({
        title: t("common.success"),
        description: `${t("auth.login")} ${t("common.success").toLowerCase()}`,
      });
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || t("auth.invalidCredentials"));
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: err.message || t("auth.invalidCredentials"),
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const isManager = user?.role === "manager";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        logout,
        isAuthenticated,
        isManager,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
