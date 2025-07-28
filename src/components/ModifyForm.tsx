import { useState } from "react";
import { accomplishmentsAPI } from "@/api/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

interface ModifyFormProps {
  accomplishmentId: string;
  oldDescription: string;
  onModified: (data: any) => void;
  onSuccess?: () => void;
}

const ModifyForm = ({
  accomplishmentId,
  oldDescription,
  onModified,
}: ModifyFormProps) => {
  const [description, setDescription] = useState(oldDescription || "");
  const [files, setFiles] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const formData = new FormData();
    formData.append("description", description);
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => formData.append("files", file));
    }

    try {
      setSubmitting(true);
      const res = await accomplishmentsAPI.modifyAccomplishment(
        accomplishmentId,
        formData
      );
      if (onModified) onModified(res.data);
      toast({
        title: "تم رفع النسخة المعدلة",
        description: "بانتظار مراجعة المدير",
      });
    } catch (err: any) {
      toast({
        title: "خطأ",
        description: err.message || "فشل التعديل",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2 mt-6 border border-amber-300 p-4 rounded"
    >
      <div className="font-semibold text-amber-800 mb-1">إرسال نسخة معدلة</div>
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        placeholder="الوصف الجديد للإنجاز..."
      />
      <input
        type="file"
        multiple
        onChange={(e) => setFiles(e.target.files)}
        className="block border rounded p-2 w-full"
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? "جاري الإرسال..." : "إرسال النسخة المعدلة"}
        </Button>
      </div>
    </form>
  );
};

export default ModifyForm;
