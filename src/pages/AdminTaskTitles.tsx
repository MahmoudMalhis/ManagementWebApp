import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/api/api";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CheckCircle, AlertTriangle } from "lucide-react";

export default function AdminTaskTitles() {
  const [titles, setTitles] = useState<{ _id: string; name: string }[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const { isManager } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    fetchTitles();
  }, []);

  const fetchTitles = async () => {
    setLoading(true);
    try {
      const res = await api.get("/task-titles");
      setTitles(res.data.data);
    } catch (e) {
      toast(t("taskTitles.loadFailed"), {
        icon: <AlertTriangle color="red" />,
      });
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
      // show success toast
      toast(t("common.success"), { icon: <CheckCircle color="green" /> });
    } catch (e) {
      toast(t("taskTitles.duplicateError"), {
        icon: <AlertTriangle color="red" />,
      });
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
      toast(t("common.success"), { icon: <CheckCircle color="green" /> });
    } catch (e) {
      toast(t("taskTitles.duplicateError"), {
        icon: <AlertTriangle color="red" />,
      });
    }
  };

  const removeTitle = async (id: string) => {
    if (!window.confirm(t("taskTitles.deleteConfirm"))) return;
    try {
      await api.delete(`/task-titles/${id}`);
      fetchTitles();
      toast(t("common.success"), { icon: <CheckCircle color="green" /> });
    } catch {
      toast(t("taskTitles.deleteError"), {
        icon: <AlertTriangle color="red" />,
      });
    }
  };

  if (!isManager)
    return <div>{t("taskTitles.noAccess")}</div>;

  return (
    <div className="max-w-xl mx-auto mt-10">
      <Card>
        <CardHeader>
          <CardTitle>{t("taskTitles.manage")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={t("taskTitles.newPlaceholder")}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") addTitle();
              }}
            />
            <Button onClick={addTitle} disabled={!newTitle.trim() || loading}>
              {t("taskTitles.add")}
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
                      {t("common.save")}
                    </Button>
                    <Button
                      onClick={() => setEditing(null)}
                      variant="outline"
                      size="sm"
                    >
                      {t("common.cancel")}
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
                      {t("common.edit")}
                    </Button>
                    <Button
                      onClick={() => removeTitle(title._id)}
                      variant="destructive"
                      size="sm"
                    >
                      {t("common.delete")}
                    </Button>
                  </>
                )}
              </li>
            ))}
            {titles.length === 0 && (
              <li className="text-gray-400 text-center">
                {t("taskTitles.noTitles")}
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
