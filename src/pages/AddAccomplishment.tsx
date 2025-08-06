import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api, { accomplishmentsAPI } from "@/api/api";
import { useSocket } from "@/contexts/SocketContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LucideUpload, LucideLoader, LucideArrowLeft } from "lucide-react";

const AddAccomplishment = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const { sendNewAccomplishment } = useSocket();
  const [taskTitles, setTaskTitles] = useState<{ _id: string; name: string }[]>(
    []
  );
  const [selectedTitle, setSelectedTitle] = useState("");
  const [employees, setEmployees] = useState<{ _id: string; name: string }[]>(
    []
  );
  const employeeFromURL = params.get("employee") || "";
  const [selectedEmployee, setSelectedEmployee] = useState(employeeFromURL);

  useEffect(() => {
    if (user?.role === "manager") {
      api
        .get("/auth/employees")
        .then((res) => setEmployees(res.data?.data || []));
    }
  }, [user]);

  useEffect(() => {
    api.get("/task-titles").then((res) => setTaskTitles(res.data.data));
  }, []);

  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      setError(
        t("accomplishments.description") + " " + t("common.error").toLowerCase()
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("description", description);
      formData.append("taskTitle", selectedTitle);
      files.forEach((file) => {
        formData.append("files", file);
      });
      if (user?.role === "manager") {
        if (!selectedEmployee) {
          setError("يجب اختيار الموظف!");
          return;
        }
        formData.append("employee", selectedEmployee);
      }

      const response = await accomplishmentsAPI.createAccomplishment(formData);

      sendNewAccomplishment({
        _id: response.data._id,
        description: response.data.description,
        employee: {
          _id: user?.id,
          name: user?.name,
        },
        createdAt: response.data.createdAt,
      });

      toast({
        title: t("common.success"),
        description:
          t("accomplishments.add") + " " + t("common.success").toLowerCase(),
      });

      navigate("/accomplishments");
    } catch (err) {
      console.error("Error adding accomplishment:", err);
      setError(err.message || t("common.error"));
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: err.message || t("common.error"),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Button
        variant="ghost"
        className="mb-4 flex items-center gap-1 glass-btn"
        onClick={() =>
          navigate(user?.role === "manager" ? "/employees" : "/accomplishments")
        }
      >
        <LucideArrowLeft className="h-4 w-4" />
        {t("common.back")}
      </Button>

      <Card className="glass-card border-none">
        <CardHeader>
          <CardTitle className="glassy-text">
            {t("accomplishments.add")}
          </CardTitle>
          <CardDescription className="glassy-text">
            {t("accomplishments.description")}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="glass-card">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {user?.role === "manager" && (
              <div className="mb-4">
                <label className="block mb-2">اختر الموظف:</label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="glass-input border p-2 rounded w-full"
                  required
                >
                  <option value="">اختر الموظف...</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="mb-4">
              <label className="block mb-2">اختر عنوان المهمة:</label>
              <select
                value={selectedTitle}
                onChange={(e) => setSelectedTitle(e.target.value)}
                className="glass-input border p-2 rounded w-full"
                required
              >
                <option value="">اختر...</option>
                {taskTitles.map((title) => (
                  <option key={title._id} value={title._id}>
                    {title.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="glassy-text">
                {t("accomplishments.description")}
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("accomplishments.description")}
                className="min-h-[100px] glass-input"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="files" className="glassy-text">
                {t("accomplishments.files")}
              </Label>
              <Input
                id="files"
                type="file"
                multiple
                onChange={handleFileChange}
                className="glass-input file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />

              {/* عرض المعاينات */}
              <div className="mt-3 grid md:grid-cols-4 gap-3">
                {files.map((file, index) => {
                  const isImage = file.type.startsWith("image");
                  return (
                    <div
                      key={index}
                      className="relative glass-card border-none p-2 flex flex-col items-center mb-3"
                    >
                      {isImage ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-20 h-20 object-cover rounded-xl shadow"
                        />
                      ) : (
                        <span className="text-xs text-center break-all glassy-text">
                          {file.name}
                        </span>
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="glass-btn mt-2"
                        onClick={() => handleRemoveFile(index)}
                      >
                        حذف
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end space-x-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="glass-btn"
              onClick={() => navigate("/accomplishments")}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 glass-btn"
            >
              {loading ? (
                <>
                  <LucideLoader className="h-4 w-4 animate-spin" />
                  {t("common.loading")}
                </>
              ) : (
                <>
                  <LucideUpload className="h-4 w-4" />
                  {t("accomplishments.submit")}
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AddAccomplishment;
