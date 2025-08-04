import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { authAPI, accomplishmentsAPI } from "@/api/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LucideCheckSquare,
  LucideUsers,
  LucideClipboard,
  LucideFileCheck,
} from "lucide-react";

interface Accomplishment {
  _id: string;
  description: string;
  status: "pending" | "reviewed" | "needs_modification";
  createdAt: string;
  files: Array<{ _id: string; fileName: string; filePath: string }>;
  comments: Array<{ _id: string; text: string; createdAt: string }>;
  employee: {
    _id: string;
    name: string;
  };
}

interface DashboardStats {
  totalEmployees: number;
  pendingReviews: number;
  recentAccomplishments: Accomplishment[];
}

const Dashboard = () => {
  const { t } = useTranslation();
  const { user, isManager } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    pendingReviews: 0,
    recentAccomplishments: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"day" | "week" | "month" | "last30">(
    "day"
  );

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const accomplishmentsResponse =
          await accomplishmentsAPI.getAccomplishments();
        const accomplishments = accomplishmentsResponse.data || [];

        let employeeCount = 0;
        if (isManager) {
          const employeesResponse = await authAPI.getEmployees();
          employeeCount = employeesResponse.count || 0;
        }

        // **هنا فقط قمنا بحذف الفلترة**
        const filtered = filterByPeriod(accomplishments, period);

        setStats({
          totalEmployees: employeeCount,
          pendingReviews: isManager
            ? accomplishments.filter(
                (acc: Accomplishment) => acc.status !== "reviewed"
              ).length
            : 0,
          recentAccomplishments: filtered,
        });
      } catch (err) {
        setError(
          err instanceof Error && err.message
            ? err.message
            : "Failed to load dashboard data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isManager, period]);

  function filterByPeriod(
    accomplishments: Accomplishment[],
    period: "day" | "week" | "month" | "last30"
  ) {
    const now = new Date();
    return accomplishments.filter((acc) => {
      const accDate = new Date(acc.createdAt);
      if (period === "day") {
        return accDate.toDateString() === now.toDateString();
      }
      if (period === "week") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return accDate >= startOfWeek && accDate <= endOfWeek;
      }
      if (period === "month") {
        return (
          accDate.getFullYear() === now.getFullYear() &&
          accDate.getMonth() === now.getMonth()
        );
      }
      if (period === "last30") {
        const days30Ago = new Date(now);
        days30Ago.setDate(now.getDate() - 29);
        days30Ago.setHours(0, 0, 0, 0);
        return accDate >= days30Ago && accDate <= now;
      }

      return true;
    });
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-screen p-5 bg-gradient-to-br from-[#daeaff] via-[#f5f8fa] to-[#c9e4ff]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight glassy-text">
          {t("dashboard.welcome")}, {user?.name}!
        </h1>
        <p className="text-muted-foreground">
          {new Date().toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {!isManager && (
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 glassy-text">
              <CardTitle className="text-sm font-medium ">
                {t("accomplishments.add")}
              </CardTitle>
              <LucideClipboard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Link to="/accomplishments/add">
                <Button className="glass-btn px-5 py-2 rounded-xl font-bold text-[#42689c]">
                  {t("accomplishments.add")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Recent Accomplishments Card */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium glassy-text">
              {t("accomplishments.title")}
            </CardTitle>

            <LucideCheckSquare className="h-4 w-4 text-muted-foreground " />
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setPeriod("day")}
              className={`ml-3 glass-btn glass-nav-link ${
                period === "day" ? "glass-nav-link-active" : ""
              }`}
              variant={period === "day" ? "default" : "outline"}
            >
              1
            </Button>
            <Button
              onClick={() => setPeriod("week")}
              className={`ml-3 glass-btn glass-nav-link ${
                period === "week" ? "glass-nav-link-active" : ""
              }`}
              variant={period === "week" ? "default" : "outline"}
            >
              7
            </Button>
            <Button
              onClick={() => setPeriod("last30")}
              className={`ml-3 glass-btn glass-nav-link ${
                period === "last30" ? "glass-nav-link-active" : ""
              }`}
              variant={period === "last30" ? "default" : "outline"}
            >
              30
            </Button>
            <Button
              onClick={() => setPeriod("month")}
              className={`ml-3 glass-btn glass-nav-link ${
                period === "month" ? "glass-nav-link-active" : ""
              }`}
              variant={period === "month" ? "default" : "outline"}
            >
              الشهر الحالي
            </Button>

            <div className="text-2xl font-bold glassy-text">
              {stats.recentAccomplishments.length}
            </div>
            <p className="text-xs text-muted-foreground glassy-text">
              {t("dashboard.recentAccomplishments")}
            </p>
            <Link to={`/accomplishments?period=${period}`}>
              <Button variant="outline" className="w-full mt-3 glass-btn">
                {t("common.view")}
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Manager-only stats */}

        {/* Pending Reviews Card */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium glassy-text">
              {t("dashboard.pendingReviews")}
            </CardTitle>
            <LucideFileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold glassy-text">
              {stats.pendingReviews}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("accomplishments.notReviewed")}
            </p>
            <Link to="/accomplishments?status=notReviewed">
              <Button
                variant="outline"
                className="w-full mt-3 glass-btn glassy-text"
              >
                {t("common.view")}
              </Button>
            </Link>
          </CardContent>
        </Card>
        {/* Employees Card */}
        {isManager && (
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium glassy-text">
                {t("employees.title")}
              </CardTitle>
              <LucideUsers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold glassy-text">
                {stats.totalEmployees}
              </div>
              <p className="text-xs text-muted-foreground glassy-text">
                {t("dashboard.totalEmployees")}
              </p>
              <div className="flex space-x-2 mt-2">
                <Link to="/employees" className="flex-1 ml-3">
                  <Button variant="outline" className="w-full glass-btn">
                    {t("common.view")}
                  </Button>
                </Link>
                <Link to="/employees/add" className="flex-1">
                  <Button variant="default" className="w-full glass-btn">
                    {t("employees.add")}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Accomplishments List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold glassy-text">
          {t("dashboard.recentAccomplishments")}
        </h2>
        {stats.recentAccomplishments.length > 0 ? (
          <div className="grid gap-4">
            {stats.recentAccomplishments.map((accomplishment) => (
              <Card key={accomplishment._id} className="glass-card border-none">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium glassy-text">
                      {isManager
                        ? accomplishment.employee
                          ? accomplishment.employee.name
                          : t("employees.unknown")
                        : t("accomplishments.title")}
                    </CardTitle>
                    <div
                      className={`px-2 py-1 rounded text-xs
                  ${
                    accomplishment.status === "reviewed"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : accomplishment.status === "needs_modification"
                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                  }`}
                    >
                      {accomplishment.status === "reviewed"
                        ? t("accomplishments.reviewed")
                        : accomplishment.status === "needs_modification"
                        ? t("accomplishments.needsModification")
                        : t("accomplishments.notReviewed")}
                    </div>
                  </div>
                  <CardDescription className="text-xs glassy-text">
                    {new Date(accomplishment.createdAt).toLocaleDateString()} -{" "}
                    {new Date(accomplishment.createdAt).toLocaleTimeString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm line-clamp-2">
                    {accomplishment.description}
                  </p>
                  <Link to={`/accomplishments/${accomplishment._id}`}>
                    <Button
                      variant="link"
                      className="glass-btn p-0 h-auto mt-2"
                    >
                      {t("common.view")}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="glass-card border-none">
            <CardContent className="py-4 text-center text-muted-foreground">
              {t("accomplishments.noAccomplishments")}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center">
          <Link to="/accomplishments">
            <Button variant="outline" className="glass-btn">
              {t("common.view")} {t("accomplishments.title")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
