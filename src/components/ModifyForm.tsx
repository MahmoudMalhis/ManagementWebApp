/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { accomplishmentsAPI } from "@/api/api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { CheckCircle, AlertTriangle, LucideLoader } from "lucide-react";
// Reuse the unified FileData type from the shared FileUpload component
import FileUpload, { FileData } from "@/components/FileUpload";

interface ModifyFormProps {
  accomplishmentId: string;
  oldDescription: string;
  oldFiles?: FileData[];
  onModified: () => void;
  mode?: "modify" | "start";
}

const ModifyForm: React.FC<ModifyFormProps> = ({
  accomplishmentId,
  oldDescription,
  oldFiles = [],
  onModified,
  mode = "modify",
}) => {
  // translation hook for dynamic labels
  const { t } = useTranslation();
  const [description, setDescription] = useState(oldDescription);
  const [files, setFiles] = useState<FileData[]>(oldFiles);
  const [loading, setLoading] = useState(false);
  // Note: File selection and removal are now handled by the shared
  // FileUpload component. We no longer need separate handlers here.

  // إرسال البيانات للسيرفر
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("description", description);
      // Append only the newly uploaded files to the form data. We
      // identify new files by the presence of the `file` property on
      // each FileData item. Existing files from the DB do not have
      // `file`, so they will not be reuploaded.
      const newFilesForUpload = files.filter((f) => f.file);
      newFilesForUpload.forEach((f) => {
        if (f.file) {
          formData.append("files", f.file);
        }
      });

      console.log("Description:", description, "Files:", files);

      if (mode === "start") {
        await accomplishmentsAPI.startAccomplishment(
          accomplishmentId,
          formData
        );
      } else {
        await accomplishmentsAPI.modifyAccomplishment(
          accomplishmentId,
          formData
        );
      }
      // success toast
      toast(t("common.editedSuccessfully"), {
        icon: <CheckCircle color="green" />,
      });
      onModified();
    } catch (error: any) {
      toast(t("common.error"), {
        icon: <AlertTriangle color="red" />,
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 mt-6 glass-card p-6 border-none"
    >
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        placeholder={t("common.enterNewDescription")}
        className="glass-input"
      />

      {/* File upload section: uses the shared FileUpload component to
          encapsulate preview, selection and removal of files */}
      <FileUpload files={files} setFiles={setFiles} />

      <Button type="submit" disabled={loading} className="glass-btn w-full">
        {loading ? (
          <>
            <LucideLoader className="h-4 w-4 animate-spin" />
            {t("common.updating")}
          </>
        ) : (
          t("common.saveChanges")
        )}
      </Button>
    </form>
  );
};

export default ModifyForm;
