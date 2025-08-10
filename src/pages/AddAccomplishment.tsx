import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api, { accomplishmentsAPI } from "@/api/api";
import { useSocket } from "@/contexts/SocketContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
// Input is no longer used because file uploads are handled by FileUpload
// import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// The FormCard wrapper centralises Card layout for forms
import FormCard from "@/components/FormCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  LucideUpload,
  LucideArrowLeft,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

// Import the reusable FileUpload component and FileData type for file
// selection and preview. This removes duplication across pages.
import FileUpload, { FileData } from "@/components/FileUpload";

// Reusable select + label component
import SelectWithLabel from "@/components/SelectWithLabel";

// Centralised form actions for cancel/submit buttons
import FormActions from "@/components/FormActions";

const AddAccomplishment = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // use the toast function directly from sonner
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
  // Store files as FileData objects so we can reuse the FileUpload
  // component. Each item may have a `file` property for new files.
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      // description is required
      setError(
        t("accomplishments.description") +
          " " +
          t("common.error").toLowerCase()
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("description", description);
      formData.append("taskTitle", selectedTitle);
      // Append all selected files. They are stored as FileData
      // objects with a `file` property referencing the actual File.
      files.forEach((fileData) => {
        if (fileData.file) {
          formData.append("files", fileData.file);
        }
      });
      if (user?.role === "manager") {
        if (!selectedEmployee) {
          setError(t("common.selectEmployeeRequired"));
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

      // Show a success toast with an icon
      toast(t("common.success"), {
        icon: <CheckCircle color="green" />,
        description:
          t("accomplishments.add") +
          " " +
          t("common.success").toLowerCase(),
      });

      navigate("/accomplishments");
    } catch (err: any) {
      console.error("Error adding accomplishment:", err);
      setError(err.message || t("common.error"));
      // Show an error toast
      toast(t("common.error"), {
        icon: <AlertTriangle color="red" />,
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

      {/* The form wraps around the FormCard so that the submit button works */}
      <form onSubmit={handleSubmit}>
        <FormCard
          title={t("accomplishments.add")}
          description={t("accomplishments.description")}
          footer={
            <FormActions
              loading={loading}
              cancelLabel={t("common.cancel")}
              submitLabel={t("accomplishments.submit")}
              loadingLabel={t("common.loading")}
              onCancel={() => navigate("/accomplishments")}
              submitIcon={<LucideUpload className="h-4 w-4" />}
            />
          }
        >
          {/* Form fields */}
          {error && (
            <Alert variant="destructive" className="glass-card">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {user?.role === "manager" && (
            <SelectWithLabel
              label={`${t("common.selectEmployee")}:`}
              value={selectedEmployee}
              onChange={setSelectedEmployee}
              options={employees.map((emp) => ({
                value: emp._id,
                label: emp.name,
              }))}
              required
            />
          )}
          <SelectWithLabel
            label={`${t("common.selectTaskTitle")}:`}
            value={selectedTitle}
            onChange={setSelectedTitle}
            options={taskTitles.map((title) => ({
              value: title._id,
              label: title.name,
            }))}
            required
          />
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
            {/* File upload section: reuse shared FileUpload component */}
            <FileUpload files={files} setFiles={setFiles} />
          </div>
        </FormCard>
      </form>
    </div>
  );
};

export default AddAccomplishment;
