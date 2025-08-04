import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authAPI, accomplishmentsAPI } from "@/api/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { LucideArrowLeft, LucideLoader, LucideFileText } from "lucide-react";

interface Employee {
  _id: string;
  name: string;
}

interface File {
  _id: string;
  fileName: string;
  filePath: string;
  fileType: string;
}

interface Comment {
  _id: string;
  text: string;
  createdAt: string;
  commentedBy: {
    _id: string;
    name: string;
    role: string;
  };
}

interface Accomplishment {
  _id: string;
  description: string;
  status: string;
  createdAt: string;
  files: File[];
  comments: Comment[];
}

interface EmployeeData {
  employee: Employee;
  accomplishments: Accomplishment[];
  loading: boolean;
}

const CompareEmployees = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Get employee IDs from URL params
  const params = new URLSearchParams(location.search);
  const idsParam = params.get("ids");
  const [selectedIds, setSelectedIds] = useState<string[]>(
    idsParam ? idsParam.split(",") : []
  );

  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [employeesData, setEmployeesData] = useState<EmployeeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await authAPI.getEmployees();
        setAllEmployees(response.data || []);
      } catch (err) {
        console.error("Error fetching employees:", err);
        setError("Failed to load employees list");
      }
    };

    fetchEmployees();
  }, []);

  // Fetch accomplishments for selected employees
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (selectedIds.length === 0) {
        setEmployeesData([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const newEmployeesData: EmployeeData[] = selectedIds.map((_id) => ({
          employee: {
            _id,
            name: "",
          },
          accomplishments: [],
          loading: true,
        }));

        setEmployeesData(newEmployeesData);

        const promises = selectedIds.map(async (id, index) => {
          try {
            const employeeDetails = allEmployees.find((emp) => emp._id === id);

            if (!employeeDetails) {
              throw new Error(`Employee with ID ${id} not found`);
            }

            const accomplishmentsResponse =
              await accomplishmentsAPI.getAccomplishments({
                employee: id,
              });

            return {
              index,
              employee: employeeDetails,
              accomplishments: accomplishmentsResponse.data || [],
            };
          } catch (err) {
            console.error(`Error fetching data for employee ${id}:`, err);
            return {
              index,
              employee: { _id: id, name: "Unknown" },
              accomplishments: [],
              error: err.message,
            };
          }
        });

        const results = await Promise.all(promises);

        const updatedEmployeesData = [...newEmployeesData];
        results.forEach((result) => {
          updatedEmployeesData[result.index] = {
            employee: result.employee,
            accomplishments: result.accomplishments,
            loading: false,
          };
        });

        setEmployeesData(updatedEmployeesData);
      } catch (err) {
        console.error("Error in comparison:", err);
        setError(err.message || "Failed to compare employees");
      } finally {
        setLoading(false);
      }
    };

    if (allEmployees.length > 0 && selectedIds.length > 0) {
      fetchEmployeeData();
    }
  }, [selectedIds, allEmployees]);

  // Handle adding an employee to comparison
  const handleAddEmployee = (id: string) => {
    if (!selectedIds.includes(id)) {
      const newSelectedIds = [...selectedIds, id];
      setSelectedIds(newSelectedIds);

      const searchParams = new URLSearchParams();
      searchParams.set("ids", newSelectedIds.join(","));
      navigate(`/employees/compare?${searchParams.toString()}`);
    }
  };

  // Handle removing an employee from comparison
  const handleRemoveEmployee = (id: string) => {
    const newSelectedIds = selectedIds.filter(
      (employeeId) => employeeId !== id
    );
    setSelectedIds(newSelectedIds);

    if (newSelectedIds.length > 0) {
      const searchParams = new URLSearchParams();
      searchParams.set("ids", newSelectedIds.join(","));
      navigate(`/employees/compare?${searchParams.toString()}`);
    } else {
      navigate("/employees");
    }
  };

  // Format date function
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div>
      <Button
        variant="ghost"
        className="mb-4 flex items-center gap-1 glass-btn"
        onClick={() => navigate("/employees")}
      >
        <LucideArrowLeft className="h-4 w-4" />
        {t("common.back")}
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight glassy-text">
          {t("employees.compare")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("employees.select")}</p>
      </div>

      {/* Add employee selector */}
      {allEmployees.length > 0 && selectedIds.length < 4 && (
        <Card className="mb-6 glass-card border-none">
          <CardContent className="py-6">
            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor="add-employee" className="glassy-text">
                  {t("employees.select")}
                </Label>
                <Select
                  onValueChange={(value) => {
                    handleAddEmployee(value);
                    // Reset the select after selection
                    const selectElement = document.getElementById(
                      "add-employee"
                    ) as HTMLSelectElement;
                    if (selectElement) {
                      selectElement.value = "";
                    }
                  }}
                >
                  <SelectTrigger id="add-employee" className="glass-input">
                    <SelectValue placeholder={t("employees.select")} />
                  </SelectTrigger>
                  <SelectContent className="glass-dropdown">
                    {allEmployees
                      .filter((employee) => !selectedIds.includes(employee._id))
                      .map((employee) => (
                        <SelectItem key={employee._id} value={employee._id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                className="glass-btn"
                onClick={() => navigate("/employees")}
              >
                {t("common.cancel")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center p-8">
          <LucideLoader className="h-8 w-8 animate-spin" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <Card className="glass-card border border-red-200">
          <CardContent className="flex items-center gap-2 py-6">
            <span className="text-red-600 dark:text-red-400">{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Comparison view */}
      {!loading && !error && employeesData.length > 0 && (
        <div className="space-y-8">
          {/* Employee headers */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {employeesData.map((data) => (
              <Card
                key={data.employee._id}
                className="relative glass-card border-none"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 glass-btn"
                  onClick={() => handleRemoveEmployee(data.employee._id)}
                >
                  ×
                </Button>
                <CardHeader>
                  <CardTitle className="text-xl glassy-text">
                    {data.employee.name}
                  </CardTitle>
                  {/* يمكنك وضع أي إحصائيات أخرى هنا */}
                </CardHeader>
                <CardContent>
                  {data.loading ? (
                    <div className="flex justify-center p-4">
                      <LucideLoader className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    <div className="text-sm">
                      <div className="flex justify-between mb-2">
                        <span>{t("accomplishments.title")}:</span>
                        <span className="font-medium">
                          {data.accomplishments.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("accomplishments.reviewed")}:</span>
                        <span className="font-medium">
                          {
                            data.accomplishments.filter(
                              (acc) => acc.status === "reviewed"
                            ).length
                          }
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator />

          {/* Accomplishments comparison by date */}
          <div className="space-y-8">
            {employeesData.length > 0 &&
              !employeesData.some((data) => data.loading) && (
                <>
                  {/* Get all unique dates from all employees */}
                  {(() => {
                    const allDates = new Set<string>();
                    employeesData.forEach((data) => {
                      data.accomplishments.forEach((acc) => {
                        allDates.add(formatDate(acc.createdAt));
                      });
                    });
                    return Array.from(allDates)
                      .sort(
                        (a, b) => new Date(b).getTime() - new Date(a).getTime()
                      )
                      .map((date) => (
                        <div key={date} className="mb-8">
                          {/* Date header */}
                          <div className="bg-white/40 dark:bg-slate-900/30 p-3 rounded-md mb-4 shadow glassy-text font-semibold">
                            <h3>{date}</h3>
                          </div>
                          {/* Grid layout for employees */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {employeesData.map((empData, index) => {
                              const empAccomplishmentsForDate =
                                empData.accomplishments.filter(
                                  (acc) => formatDate(acc.createdAt) === date
                                );
                              return (
                                <div key={index} className="space-y-4">
                                  {empAccomplishmentsForDate.length > 0 ? (
                                    empAccomplishmentsForDate.map((acc) => {
                                      const status =
                                        typeof acc.status === "string"
                                          ? acc.status
                                          : acc.status === true
                                          ? "reviewed"
                                          : "pending";
                                      return (
                                        <Card
                                          key={acc._id}
                                          className="glass-card border-none"
                                        >
                                          <CardContent className="py-4">
                                            <div className="space-y-2">
                                              <div className="flex justify-between items-center">
                                                <span className="text-xs text-muted-foreground">
                                                  {new Date(
                                                    acc.createdAt
                                                  ).toLocaleTimeString()}
                                                </span>
                                                <span
                                                  className={`px-2 py-1 rounded-full text-xs ${
                                                    status === "reviewed"
                                                      ? "bg-green-100 text-green-800"
                                                      : status ===
                                                        "needs_modification"
                                                      ? "bg-red-100 text-red-800"
                                                      : "bg-amber-100 text-amber-800"
                                                  }`}
                                                >
                                                  {status === "reviewed"
                                                    ? t(
                                                        "accomplishments.reviewed"
                                                      )
                                                    : status ===
                                                      "needs_modification"
                                                    ? t(
                                                        "accomplishments.needsModification"
                                                      )
                                                    : t(
                                                        "accomplishments.notReviewed"
                                                      )}
                                                </span>
                                              </div>
                                              <p className="text-sm">
                                                {acc.description.length > 100
                                                  ? `${acc.description.substring(
                                                      0,
                                                      100
                                                    )}...`
                                                  : acc.description}
                                              </p>
                                              {acc.files.length > 0 && (
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                  <LucideFileText className="h-3 w-3" />
                                                  {acc.files.length}{" "}
                                                  {t(
                                                    "accomplishments.files"
                                                  ).toLowerCase()}
                                                </div>
                                              )}
                                            </div>
                                          </CardContent>
                                        </Card>
                                      );
                                    })
                                  ) : (
                                    <div className="p-4 border border-dashed rounded-md text-center text-muted-foreground text-sm h-full flex items-center justify-center">
                                      {t("accomplishments.noAccomplishments")}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ));
                  })()}
                </>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompareEmployees;
