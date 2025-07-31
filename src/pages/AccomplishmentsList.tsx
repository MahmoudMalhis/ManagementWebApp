import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authAPI, accomplishmentsAPI } from "@/api/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LucidePlus,
  LucideLoader,
  LucideFileCheck,
  LucideFileClock,
  LucideFileText,
  LucideFilter,
  LucideX,
  LucideDownload,
} from "lucide-react";

interface Accomplishment {
  _id: string;
  description: string;
  status: "pending" | "reviewed" | "needs_modification";
  isReviewed: boolean;
  createdAt: string;
  files: Array<{ _id: string; fileName: string; filePath: string }>;
  comments: Array<{ _id: string; text: string; createdAt: string }>;
  employee: {
    _id: string;
    name: string;
  };
}

interface Employee {
  _id: string;
  name: string;
}

const AccomplishmentsList = () => {
  const { t } = useTranslation();
  const { isManager } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [accomplishments, setAccomplishments] = useState<Accomplishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filter states
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Fetch employees for manager filter
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!isManager) return;

      try {
        const response = await authAPI.getEmployees();
        setEmployees(response.data || []);
      } catch (err) {
        console.error("Error fetching employees:", err);
      }
    };

    const params = new URLSearchParams(location.search);
    const employeeId = params.get("employee") || "";

    // إذا كان الموظف غير محدد في الفلاتر، عيّنه من الباراميتر
    if (employeeId && selectedEmployee !== employeeId) {
      setSelectedEmployee(employeeId);
    }
    // لو حابب يرجع للكل في حال حذف الباراميتر
    else if (!employeeId && selectedEmployee) {
      setSelectedEmployee("");
    }

    fetchEmployees();
  }, [isManager, location.search, selectedEmployee]);

  // Fetch accomplishments with filters
  useEffect(() => {
    const fetchAccomplishments = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build filters
        const filters: Record<string, string> = {};
        if (selectedEmployee && selectedEmployee !== "all")
          filters.employee = selectedEmployee;
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;

        const response = await accomplishmentsAPI.getAccomplishments(filters);
        setAccomplishments(response.data || []);
      } catch (err) {
        console.error("Error fetching accomplishments:", err);
        setError(err.message || "Failed to load accomplishments");
      } finally {
        setLoading(false);
      }
    };

    fetchAccomplishments();
  }, [selectedEmployee, startDate, endDate]);

  // Handle exporting to Excel
  const handleExport = async () => {
    try {
      setExporting(true);

      // Build filters
      const filters: Record<string, string> = {};
      if (selectedEmployee) filters.employee = selectedEmployee;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const response = await accomplishmentsAPI.exportAccomplishments(filters);

      // Create a download link
      const link = document.createElement("a");
      link.href = `http://localhost:5000${response.filePath}`;
      link.download = response.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error exporting accomplishments:", err);
      setError(err.message || "Failed to export accomplishments");
    } finally {
      setExporting(false);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedEmployee("");
    setStartDate("");
    setEndDate("");
  };

  const handleEmployeeChange = (value: string) => {
    setSelectedEmployee(value);
    if (value && value !== "all") {
      navigate(`/accomplishments?employee=${value}`);
    } else {
      navigate(`/accomplishments`);
    }
  };

  const params = new URLSearchParams(location.search);
  const statusParam = params.get("status");

  let accomplishmentsToDisplay = accomplishments;

  if (statusParam === "notReviewed") {
    accomplishmentsToDisplay = accomplishments.filter(
      (acc) => acc.status !== "reviewed"
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("accomplishments.title")}
        </h1>

        <div className="flex gap-2">
          {isManager && (
            <Button
              variant="outline"
              disabled={exporting}
              onClick={handleExport}
              className="flex items-center gap-1"
            >
              {exporting ? (
                <>
                  <LucideLoader className="h-4 w-4 animate-spin" />
                  {t("accomplishments.exporting")}{" "}
                </>
              ) : (
                <>
                  <LucideDownload className="h-4 w-4" />
                  {t("accomplishments.export")}
                </>
              )}
            </Button>
          )}

          <Button
            variant={showFilters ? "secondary" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1"
          >
            <LucideFilter className="h-4 w-4" />
            {t("accomplishments.filter")}
          </Button>
          {!isManager && (
            <Link to="/accomplishments/add">
              <Button className="flex items-center gap-1">
                <LucidePlus className="h-4 w-4" />
                {t("accomplishments.add")}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="bg-muted/40">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">
                {t("accomplishments.filter")}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setShowFilters(false)}
              >
                <LucideX className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Employee filter (managers only) */}
              {isManager && (
                <div className="space-y-1">
                  <Label htmlFor="employee">
                    {t("accomplishments.filterByEmployee")}
                  </Label>
                  <Select
                    value={selectedEmployee}
                    onValueChange={handleEmployeeChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("employees.select")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t("employees.select")}
                      </SelectItem>
                      {employees.map((employee) => (
                        <SelectItem key={employee._id} value={employee._id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {/* Date filters */}
              <div className="space-y-1">
                <Label htmlFor="startDate">
                  {t("accomplishments.startDate")}
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>{" "}
              <div className="space-y-1">
                <Label htmlFor="endDate">{t("accomplishments.endDate")}</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost" onClick={clearFilters}>
              {t("accomplishments.clearFilter")}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Loading and error states */}
      {loading ? (
        <div className="flex justify-center p-8">
          <LucideLoader className="h-8 w-8 animate-spin" />
        </div>
      ) : error ? (
        <Card className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900">
          <CardContent className="flex items-center gap-2 py-6">
            <span className="text-red-600 dark:text-red-400">{error}</span>
          </CardContent>
        </Card>
      ) : (
        // Accomplishments list
        <div className="grid gap-4">
          {accomplishmentsToDisplay.length > 0 ? (
            accomplishmentsToDisplay.map((accomplishment) => (
              <Card key={accomplishment._id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {/* Only show employee name for managers */}
                        {isManager && (
                          <span className="font-medium">
                            {accomplishment.employee.name} -{" "}
                          </span>
                        )}
                        <span className="text-muted-foreground text-sm">
                          {new Date(
                            accomplishment.createdAt
                          ).toLocaleDateString()}
                        </span>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {accomplishment.description.length > 100
                          ? `${accomplishment.description.substring(0, 100)}...`
                          : accomplishment.description}
                      </CardDescription>
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-xs self-start
                        ${
                          accomplishment.status === "reviewed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : accomplishment.status === "needs_modification"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                        }`}
                    >
                      {accomplishment.status === "reviewed" ? (
                        <span className="flex items-center gap-1">
                          <LucideFileCheck className="h-3 w-3" />
                          {t("accomplishments.reviewed")}
                        </span>
                      ) : accomplishment.status === "needs_modification" ? (
                        <span className="flex items-center gap-1">
                          <LucideFileClock className="h-3 w-3" />
                          {t("accomplishments.needsModification")}{" "}
                          {/* أضف ترجمة في ملف الترجمة */}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <LucideFileClock className="h-3 w-3" />
                          {t("accomplishments.notReviewed")}
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="py-1">
                  <div className="flex flex-wrap gap-1 my-1">
                    {/* Show file attachments */}
                    {accomplishment.files &&
                      accomplishment.files.length > 0 && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <LucideFileText className="h-3 w-3 mr-1" />
                          {accomplishment.files.length}{" "}
                          {t("accomplishments.files").toLowerCase()}
                        </div>
                      )}

                    {/* Show comments count */}
                    {accomplishment.comments &&
                      accomplishment.comments.length > 0 && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          {accomplishment.comments.length}{" "}
                          {t("accomplishments.comments").toLowerCase()}
                        </div>
                      )}
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Link to={`/accomplishments/${accomplishment._id}`}>
                    <Button variant="outline" size="sm">
                      {t("common.view")}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {t("accomplishments.noAccomplishments")}
                <div className="mt-4">
                  <Link to="/accomplishments/add">
                    <Button>{t("accomplishments.add")}</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default AccomplishmentsList;
