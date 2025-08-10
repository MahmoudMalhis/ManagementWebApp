/* eslint-disable @typescript-eslint/no-explicit-any */
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
  LucideTrash2,
  LucideArchive,
} from "lucide-react";
import { toast } from "sonner";

// shadcn/ui AlertDialog (لو ما عندك مركّبه، خبرني نبدّل لـ modal بسيط)
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ... نفس الاستيرادات

interface Employee {
  _id: string;
  name: string;
  role: string;
  createdAt: string;
  status?: "active" | "archived";
}

const EmployeeList = () => {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // popup state
  const [confirmFor, setConfirmFor] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await authAPI.getEmployees({ status: "active" });
        setEmployees(
          (response.data || []).map((emp: any) => ({
            ...emp,
            id: emp._id || emp.id,
          }))
        );
      } catch (err: any) {
        setError(err.message || t("employees.loadFailed"));
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, [t]);

  const handleCheckboxChange = (employeeId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  // تنفيذ الأرشفة/الحذف من الحوار
  const confirmDelete = async (mode: "archive" | "hard") => {
    if (!confirmFor) return;
    const { id } = confirmFor;
    try {
      setDeletingId(id);
      await authAPI.deleteEmployee(id, mode);

      if (mode === "hard") {
        setEmployees((prev) => prev.filter((e: any) => (e._id || e.id) !== id));
        toast.success("تم حذف الموظف وجميع بياناته نهائيًا");
      } else {
        setEmployees((prev) =>
          prev.map((e: any) =>
            (e._id || e.id) === id ? { ...e, status: "archived" } : e
          )
        );
        toast.success("تم أرشفة الموظف وتعطيل دخوله مع إبقاء جميع البيانات");
      }
      setConfirmFor(null);
    } catch (err: any) {
      toast.error(err?.message || "حدث خطأ أثناء العملية");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight glassy-text">
          {t("employees.title")}
        </h1>

        <div className="flex gap-2">
          {selectedEmployees.length > 0 && (
            <Link to={`/employees/compare?ids=${selectedEmployees.join(",")}`}>
              <Button
                variant="outline"
                className="flex items-center gap-1 glass-btn"
              >
                <LucideBarChart className="h-4 w-4" />
                {t("employees.compare")} ({selectedEmployees.length})
              </Button>
            </Link>
          )}

          <Link to="/employees/add">
            <Button className="flex items-center gap-1 glass-btn">
              <LucidePlus className="h-4 w-4" />
              {t("employees.add")}
            </Button>
          </Link>

          <Link to="/employees/archived">
            <Button
              variant="outline"
              className="flex items-center gap-1 glass-btn"
            >
              أرشيف الموظفين
            </Button>
          </Link>
        </div>
      </div>

      {/* Table / States */}
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
        <div>
          {employees.length > 0 ? (
            <Card className="glass-card border-none">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12" />
                    <TableHead className="text-start glassy-text">
                      {t("employees.name")}
                    </TableHead>
                    <TableHead className="hidden md:table-cell text-start glassy-text">
                      {t("employees.role")}
                    </TableHead>
                    <TableHead className="text-start glassy-text">
                      {t("common.actions")}
                    </TableHead>
                    <TableHead className="text-start glassy-text">
                      {t("common.delete")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee: any) => {
                    const id = employee._id || employee.id;
                    const isManager = employee.role === "manager";
                    const archived = employee.status === "archived";
                    return (
                      <TableRow
                        key={id}
                        className={archived ? "opacity-60" : ""}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedEmployees.includes(id)}
                            onCheckedChange={() => handleCheckboxChange(id)}
                            className="mr-3"
                            disabled={archived}
                          />
                        </TableCell>
                        <TableCell className="font-medium flex items-center gap-2">
                          <LucideUserCircle className="h-5 w-5 text-muted-foreground" />
                          <span>
                            {employee.name}
                            {archived && (
                              <span className="ml-2 text-xs rounded-full px-2 py-0.5 bg-amber-100 text-amber-800">
                                مؤرشف
                              </span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {isManager
                            ? t("employees.roleManager")
                            : t("employees.roleEmployee")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2">
                            <Link to={`/accomplishments?employee=${id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1 glass-btn"
                                disabled={archived}
                              >
                                {t("common.view")}
                              </Button>
                            </Link>
                            <Link to={`/accomplishments/add?employee=${id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1 glass-btn"
                                disabled={archived}
                              >
                                {t("employees.addTask")}
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="glass-btn"
                            disabled={deletingId === id || isManager}
                            onClick={() =>
                              setConfirmFor({ id, name: employee.name })
                            }
                            title={
                              isManager ? "لا يمكن حذف مدير" : "حذف / أرشفة"
                            }
                          >
                            <LucideTrash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card className="glass-card border-none">
              <CardContent className="py-8 text-center text-muted-foreground flex flex-col items-center gap-4">
                <LucideUsers className="h-10 w-10 opacity-30" />
                <div>
                  <p>{t("employees.noEmployees")}</p>
                  <Link to="/employees/add" className="mt-4 inline-block">
                    <Button className="glass-btn">{t("employees.add")}</Button>
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
                <Button variant="outline" className="glass-btn">
                  {t("employees.compareSelected")}
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Dialog التأكيد */}
      <AlertDialog
        open={!!confirmFor}
        onOpenChange={(open) => !open && setConfirmFor(null)}
      >
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle>إدارة حساب الموظف</AlertDialogTitle>
            <AlertDialogDescription>
              ماذا تريد أن تفعل بالموظف
              {confirmFor ? ` "${confirmFor.name}"` : ""}؟ اختر <b>أرشفة</b>{" "}
              لتعطيل دخوله مع إبقاء كل البيانات، أو
              <b> حذف نهائي</b> لإزالة الحساب وجميع البيانات المرتبطة به.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 sm:justify-between">
            <AlertDialogCancel className="glass-btn">إلغاء</AlertDialogCancel>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="glass-btn flex items-center gap-1"
                disabled={!!deletingId}
                onClick={() => confirmDelete("archive")}
              >
                <LucideArchive className="w-4 h-4" />
                أرشفة (تعطيل الدخول)
              </Button>
              <AlertDialogAction
                className="glass-btn bg-red-600 hover:bg-red-700 text-white flex items-center gap-1"
                disabled={!!deletingId}
                onClick={(e) => {
                  e.preventDefault();
                  confirmDelete("hard");
                }}
              >
                <LucideTrash2 className="w-4 h-4" />
                حذف نهائي
              </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EmployeeList;
