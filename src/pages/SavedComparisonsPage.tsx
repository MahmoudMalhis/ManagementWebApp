import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { comparisonsAPI } from "@/api/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideArrowLeft, LucideTrash2, LucideFolderOpen } from "lucide-react";
import { toast } from "sonner";

type QuickRange = "all" | "week" | "month" | "year" | "custom";

interface SavedComparison {
  _id: string;
  name?: string;
  notes?: string;
  employeeIds: string[];
  range: QuickRange;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export default function SavedComparisonsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<SavedComparison[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await comparisonsAPI.list();
      const data: SavedComparison[] = (res?.data || []).sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setItems(data);
    } catch (e: any) {
      toast.error(e?.message || "فشل التحميل");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openComparison = (c: SavedComparison) => {
    const params = new URLSearchParams();
    params.set("ids", c.employeeIds.join(","));
    if (c.range) params.set("range", c.range);
    if (c.startDate) params.set("start", c.startDate);
    if (c.endDate) params.set("end", c.endDate);
    navigate(`/employees/compare?${params.toString()}`);
  };

  const remove = async (id: string) => {
    try {
      await comparisonsAPI.remove(id);
      setItems((prev) => prev.filter((x) => x._id !== id));
      toast.success("تم الحذف");
    } catch (e: any) {
      toast.error(e?.message || "فشل الحذف");
    }
  };

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        className="mb-2 flex items-center gap-1 glass-btn"
        onClick={() => navigate(-1)}
      >
        <LucideArrowLeft className="h-4 w-4" />
        رجوع
      </Button>

      <Card className="glass-card border-none">
        <CardHeader>
          <CardTitle className="glassy-text">المقارنات المحفوظة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div>جارِ التحميل…</div>
          ) : items.length === 0 ? (
            <div className="text-muted-foreground">
              لا توجد مقارنات محفوظة حتى الآن.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((c) => (
                <Card key={c._id} className="glass-card border">
                  <CardContent className="py-4 space-y-2">
                    <div className="font-semibold">
                      {c.name?.trim() || "بدون اسم"}
                    </div>
                    {c.notes && (
                      <div className="text-sm text-muted-foreground">
                        {c.notes}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      الموظفون: {c.employeeIds.length} • المدى: {c.range}
                      {c.range === "custom" && (
                        <>
                          {" "}
                          • {c.startDate} → {c.endDate}
                        </>
                      )}
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="glass-btn flex items-center gap-1"
                        onClick={() => openComparison(c)}
                      >
                        <LucideFolderOpen className="w-4 h-4" />
                        فتح
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="glass-btn flex items-center gap-1"
                        onClick={() => remove(c._id)}
                      >
                        <LucideTrash2 className="w-4 h-4" />
                        حذف
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
