/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { comparisonsAPI } from "@/api/api";
import { LucideFolderOpen, LucideTrash2, LucideHistory } from "lucide-react";
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

export default function SavedComparisonsBar({
  onOpenComparison,
  limit = 5,
}: {
  onOpenComparison: (c: SavedComparison) => void;
  limit?: number;
}) {
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
      setItems(limit ? data.slice(0, limit) : data);
    } catch (e: any) {
      // خليه صامت لو فشل
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string) => {
    try {
      await comparisonsAPI.remove(id);
      setItems((prev) => prev.filter((x) => x._id !== id));
      toast.success("تم الحذف");
    } catch (e: any) {
      toast.error(e?.message || "فشل الحذف");
    }
  };

  if (loading || items.length === 0) return null;

  return (
    <Card className="glass-card border-none p-3 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 glassy-text">
          <LucideHistory className="w-4 h-4" />
          <span>مقارنات محفوظة</span>
        </div>
        <Button
          variant="outline"
          className="glass-btn"
          onClick={() => navigate("/comparisons")}
        >
          عرض الكل
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {items.map((c) => (
          <div
            key={c._id}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/40 dark:bg-white/10 border glass-card"
          >
            <button
              className="text-sm underline"
              onClick={() => onOpenComparison(c)}
              title={c.notes || ""}
            >
              {c.name?.trim() || "بدون اسم"} • {c.employeeIds.length} موظف
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onOpenComparison(c)}
              title="فتح"
            >
              <LucideFolderOpen className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-600"
              onClick={() => remove(c._id)}
              title="حذف"
            >
              <LucideTrash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
