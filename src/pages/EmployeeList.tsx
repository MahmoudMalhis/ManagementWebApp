import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authAPI } from "@/api/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  LucidePlus,
  LucideLoader,
  LucideUsers,
  LucideUserCircle,
  LucideBarChart,
} from "lucide-react";

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

const EmployeeList = () => {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await authAPI.getEmployees();
        setEmployees(
          (response.data || []).map((emp) => ({
            ...emp,
            id: emp._id || emp.id, // تأكد من وجود id موحد
          }))
        );
      } catch (err) {
        setError(err.message || "Failed to load employees");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const handleCheckboxChange = (employeeId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("employees.title")}
        </h1>

        <div className="flex gap-2">
          {selectedEmployees.length > 0 && (
            <Link to={`/employees/compare?ids=${selectedEmployees.join(",")}`}>
              <Button variant="outline" className="flex items-center gap-1">
                <LucideBarChart className="h-4 w-4" />
                {t("employees.compare")} ({selectedEmployees.length})
              </Button>
            </Link>
          )}

          <Link to="/employees/add">
            <Button className="flex items-center gap-1">
              <LucidePlus className="h-4 w-4" />
              {t("employees.add")}
            </Button>
          </Link>
        </div>
      </div>

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
        <div>
          {employees.length > 0 ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <span className="sr-only">Select</span>
                    </TableHead>
                    <TableHead>{t("employees.name")}</TableHead>
                    <TableHead className="hidden md:table-cell">
                      {t("employees.email")}
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      {t("employees.role")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("common.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedEmployees.includes(employee.id)}
                          onCheckedChange={() =>
                            handleCheckboxChange(employee.id)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium flex items-center gap-2">
                        <LucideUserCircle className="h-5 w-5 text-muted-foreground" />
                        {employee.name}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {employee.email}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {employee.role === "employee" ? "موظف" : "مدير"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/accomplishments?employee=${employee.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            {t("common.view")}
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground flex flex-col items-center gap-4">
                <LucideUsers className="h-10 w-10 opacity-30" />
                <div>
                  <p>{t("employees.noEmployees")}</p>
                  <Link to="/employees/add" className="mt-4 inline-block">
                    <Button>{t("employees.add")}</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {employees.length > 0 && selectedEmployees.length > 0 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                {t("employees.employeesSelected", {
                  count: selectedEmployees.length,
                })}
              </p>
              <Link
                to={`/employees/compare?ids=${selectedEmployees.join(",")}`}
                className="mt-2 inline-block"
              >
                <Button variant="outline">
                  {t("employees.compareSelected")}
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
