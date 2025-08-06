import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/api/api";

export default function AdminTaskTitles() {
  const [titles, setTitles] = useState<{ _id: string; name: string }[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const { isManager } = useAuth();

  useEffect(() => {
    fetchTitles();
  }, []);

  const fetchTitles = async () => {
    setLoading(true);
    try {
      const res = await api.get("/task-titles");
      setTitles(res.data.data);
    } catch (e) {
      alert("تعذر تحميل الأنواع");
    } finally {
      setLoading(false);
    }
  };

  const addTitle = async () => {
    if (!newTitle.trim()) return;
    try {
      await api.post("/task-titles", { name: newTitle.trim() });
      setNewTitle("");
      fetchTitles();
    } catch (e) {
      alert("العنوان مكرر أو هناك خطأ");
    }
  };

  const saveEdit = async () => {
    if (!editing || !editing.name.trim()) return;
    try {
      await api.put(`/task-titles/${editing.id}`, {
        name: editing.name.trim(),
      });
      setEditing(null);
      fetchTitles();
    } catch (e) {
      alert("العنوان مكرر أو هناك خطأ");
    }
  };

  const removeTitle = async (id: string) => {
    if (!window.confirm("تأكيد حذف العنوان؟")) return;
    try {
      await api.delete(`/task-titles/${id}`);
      fetchTitles();
    } catch {
      alert("خطأ بالحذف");
    }
  };

  if (!isManager) return <div>ليس لديك صلاحية الوصول لهذه الصفحة</div>;

  return (
    <div className="max-w-xl mx-auto mt-10">
      <Card>
        <CardHeader>
          <CardTitle>إدارة أنواع عناوين المهمات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="أدخل عنوان جديد"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") addTitle();
              }}
            />
            <Button onClick={addTitle} disabled={!newTitle.trim() || loading}>
              إضافة
            </Button>
          </div>
          <ul className="space-y-3">
            {titles.map((title) => (
              <li key={title._id} className="flex items-center gap-2">
                {editing && editing.id === title._id ? (
                  <>
                    <Input
                      value={editing.name}
                      onChange={(e) =>
                        setEditing((old) =>
                          old ? { ...old, name: e.target.value } : old
                        )
                      }
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                      }}
                    />
                    <Button onClick={saveEdit} size="sm">
                      حفظ
                    </Button>
                    <Button
                      onClick={() => setEditing(null)}
                      variant="outline"
                      size="sm"
                    >
                      إلغاء
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1">{title.name}</span>
                    <Button
                      onClick={() =>
                        setEditing({ id: title._id, name: title.name })
                      }
                      variant="outline"
                      size="sm"
                    >
                      تعديل
                    </Button>
                    <Button
                      onClick={() => removeTitle(title._id)}
                      variant="destructive"
                      size="sm"
                    >
                      حذف
                    </Button>
                  </>
                )}
              </li>
            ))}
            {titles.length === 0 && (
              <li className="text-gray-400 text-center">لا يوجد عناوين</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
