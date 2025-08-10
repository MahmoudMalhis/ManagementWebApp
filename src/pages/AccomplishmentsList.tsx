/* eslint-disable @typescript-eslint/no-explicit-any */
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
  taskTitle: {
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
        const response = await authAPI.getEmployees({ status: "active" });
        setEmployees(response.data || []);
      } catch (err) {
        console.error("Error fetching employees:", err);
      }
    };

    const params = new URLSearchParams(location.search);
    const employeeId = params.get("employee") || "";

    if (employeeId && selectedEmployee !== employeeId) {
      setSelectedEmployee(employeeId);
    } else if (!employeeId && selectedEmployee) {
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

        const filters: Record<string, string> = {};
        if (selectedEmployee && selectedEmployee !== "all")
          filters.employee = selectedEmployee;
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;

        const response = await accomplishmentsAPI.getAccomplishments(filters);
        setAccomplishments(response.data || []);
      } catch (err) {
        console.error("Error fetching accomplishments:", err);
        setError(err.message || t("accomplishments.loadFailed"));
      } finally {
        setLoading(false);
      }
    };

    fetchAccomplishments();
  }, [selectedEmployee, startDate, endDate, t]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const filters: Record<string, string> = {};
      if (selectedEmployee) filters.employee = selectedEmployee;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const response = await accomplishmentsAPI.exportAccomplishments(filters);

      const link = document.createElement("a");
      const BASE_URL: string =
        (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";
      link.href = `${BASE_URL}${response.filePath}`;
      link.download = response.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error exporting accomplishments:", err);
      setError(err.message || t("accomplishments.exportFailed"));
    } finally {
      setExporting(false);
    }
  };

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
    <div className="space-y-6 min-h-screen p-6 bg-gradient-to-br from-[#d1e9ff] via-[#f2f8fc] to-[#b6d2f8]">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight glassy-text">
          {t("accomplishments.title")}
        </h1>
        <div className="flex gap-2">
          {isManager && (
            <Button
              className="glass-btn flex items-center gap-1"
              disabled={exporting}
              onClick={handleExport}
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
            className="glass-btn flex items-center gap-1"
            onClick={() => setShowFilters(!showFilters)}
          >
            <LucideFilter className="h-4 w-4" />
            {t("accomplishments.filter")}
          </Button>
          {!isManager && (
            <Link to="/accomplishments/add">
              <Button className="glass-btn flex items-center gap-1">
                <LucidePlus className="h-4 w-4" />
                {t("accomplishments.add")}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="glass-card glass-card-hover border-none">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base glassy-text">
                {t("accomplishments.filter")}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="glass-btn h-8 w-8 p-0"
                onClick={() => setShowFilters(false)}
              >
                <LucideX className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {isManager && (
                <div className="space-y-1">
                  <Label htmlFor="employee">
                    {t("accomplishments.filterByEmployee")}
                  </Label>
                  <Select
                    value={selectedEmployee}
                    onValueChange={handleEmployeeChange}
                  >
                    <SelectTrigger className="glass-input">
                      <SelectValue placeholder={t("employees.select")} />
                    </SelectTrigger>
                    <SelectContent className="glass-dropdown">
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
              <div className="space-y-1">
                <Label htmlFor="startDate">
                  {t("accomplishments.startDate")}
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  className="glass-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>{" "}
              <div className="space-y-1">
                <Label htmlFor="endDate">{t("accomplishments.endDate")}</Label>
                <Input
                  id="endDate"
                  type="date"
                  className="glass-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="ghost"
              className="glass-btn"
              onClick={clearFilters}
            >
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
        <Card className="glass-card border border-red-200">
          <CardContent className="flex items-center gap-2 py-6">
            <span className="text-red-600 dark:text-red-400">{error}</span>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-wrap justify-center gap-3 mx-auto">
          {accomplishmentsToDisplay.length > 0 ? (
            accomplishmentsToDisplay.map((accomplishment) => (
              <Card
                key={accomplishment._id}
                className="glass-card glass-card-hover border-none md:w-[32%] w-[48%]"
              >
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-lg glassy-text flex justify-between">
                    <span className="text-muted-foreground text-base">
                      {new Date(accomplishment.createdAt).toLocaleDateString()}
                    </span>
                    <span className="capitalize font-bold">
                      {accomplishment.taskTitle?.name}
                    </span>
                    {isManager && (
                      <span className="capitalize font-bold">
                        {accomplishment.employee?.name}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <Link to={`/accomplishments/${accomplishment._id}`}>
                  <CardDescription className="p-3 border-y border-[#aac8f0] h-20 bg-[#d5e2f9] overflow-hidden">
                    {accomplishment.description.length > 100
                      ? `${accomplishment.description.substring(0, 100)}...`
                      : accomplishment.description}
                  </CardDescription>
                  <div
                    className={`font-[calibri] font-bold px-2 py-1 self-start rounded-b-xl mx-auto
                        ${
                          accomplishment.status === "reviewed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : accomplishment.status === "needs_modification"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }
                        `}
                  >
                    <CardContent className="p-1">
                      <div className="flex justify-between md:flex-row flex-col items-center">
                        {accomplishment.files && (
                          <div
                            className={`flex items-center text-md ${
                              accomplishment.files.length > 0
                                ? "text-muted-foreground"
                                : "text-gray-300"
                            }`}
                          >
                            <LucideFileText className="h-3 w-3 mr-1" />
                            {accomplishment.files.length}
                            {t("accomplishments.files").toLowerCase()}
                          </div>
                        )}
                        {accomplishment.comments && (
                          <div
                            className={`flex items-center text-md  ${
                              accomplishment.comments.length > 0
                                ? "text-muted-foreground"
                                : "text-gray-300"
                            }`}
                          >
                            {accomplishment.comments.length}
                            {t("accomplishments.comments").toLowerCase()}
                          </div>
                        )}
                        <div className="flex flex-col justify-center items-center gap-3">
                          <div
                            className={`px-2 self-start rounded-xl
                        ${
                          accomplishment.status === "reviewed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : accomplishment.status === "needs_modification"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }
                        `}
                          >
                            {accomplishment.status === "reviewed" ? (
                              <span className="flex items-center gap-1">
                                {t("accomplishments.reviewed")}
                              </span>
                            ) : accomplishment.status ===
                              "needs_modification" ? (
                              <span className="flex items-center gap-1">
                                {t("accomplishments.needsModification")}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                {t("accomplishments.notReviewed")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Link>
                {/* <CardFooter className="pt-0">
                      
                        <Button>{t("common.view")}</Button>
                      </Link>
                    </CardFooter> */}
              </Card>
            ))
          ) : (
            <Card className="glass-card border-none">
              <CardContent className="py-8 text-center text-muted-foreground">
                {t("accomplishments.noAccomplishments")}
                <div className="mt-4">
                  <Link to="/accomplishments/add">
                    <Button className="glass-btn">
                      {t("accomplishments.add")}
                    </Button>
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
