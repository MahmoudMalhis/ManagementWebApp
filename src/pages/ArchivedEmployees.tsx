/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { authAPI } from "@/api/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LucideUsers, LucideLoader, LucideRotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Employee {
  _id: string;
  name: string;
  role: string;
  status: string;
  createdAt: string;
}

const ArchivedEmployees = () => {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authAPI.getEmployees({ status: "archived" });
      setEmployees(res.data || []);
    } catch (err: any) {
      setError(err.message || "فشل التحميل");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRestore = async (id: string, name: string) => {
    const ok = window.confirm(`استعادة الموظف "${name}" وتمكين دخوله؟`);
    if (!ok) return;
    try {
      setRestoringId(id);
      await authAPI.unarchiveEmployee(id);
      toast.success("تمت الاستعادة بنجاح");
      setEmployees((prev) => prev.filter((e) => e._id !== id));
    } catch (err: any) {
      toast.error(err.message || "فشل استعادة الموظف");
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold glassy-text">أرشيف الموظفين</h1>
        <div className="flex gap-2">
          <Link to="/employees">
            <Button variant="outline" className="glass-btn">
              عودة لقائمة الموظفين
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <LucideLoader className="h-8 w-8 animate-spin" />
        </div>
      ) : error ? (
        <Card className="glass-card border border-red-200">
          <CardContent className="py-6 text-red-600">{error}</CardContent>
        </Card>
      ) : employees.length === 0 ? (
        <Card className="glass-card border-none">
          <CardContent className="py-8 text-center text-muted-foreground flex flex-col items-center gap-4">
            <LucideUsers className="h-10 w-10 opacity-30" />
            لا يوجد موظفون مؤرشفون
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-card border-none">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start glassy-text">الاسم</TableHead>
                <TableHead className="text-start glassy-text">الدور</TableHead>
                <TableHead className="text-start glassy-text">الحالة</TableHead>
                <TableHead className="text-start glassy-text">
                  إجراءات
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp._id}>
                  <TableCell>{emp.name}</TableCell>
                  <TableCell>
                    {emp.role === "employee" ? "موظف" : "مدير"}
                  </TableCell>
                  <TableCell>مؤرشف</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="glass-btn flex items-center gap-1"
                      disabled={restoringId === emp._id}
                      onClick={() => handleRestore(emp._id, emp.name)}
                      title="استعادة"
                    >
                      <LucideRotateCcw className="w-4 h-4" />
                      {restoringId === emp._id
                        ? "جاري الاستعادة..."
                        : "استعادة"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default ArchivedEmployees;
