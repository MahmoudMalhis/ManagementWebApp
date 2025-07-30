/* eslint-disable @typescript-eslint/no-explicit-any */
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
    if (!description.trim()) {
      toast({
        title: "خطأ",
        description: "الوصف مطلوب",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("description", description);

    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }
    }

    try {
      setSubmitting(true);

      const res = await accomplishmentsAPI.modifyAccomplishment(
        accomplishmentId,
        formData
      );

      if (res.success) {
        // هنا تم التصحيح
        toast({
          title: "تم رفع النسخة المعدلة",
          description: "بانتظار مراجعة المدير",
        });
        if (onModified) onModified(res);
      } else {
        throw new Error(res.message || "فشل التعديل");
      }
    } catch (err: any) {
      console.error("Modification error:", err);
      toast({
        title: "خطأ",
        description: err.message || "فشل في تعديل الإنجاز",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2 mt-6 border border-gry-300 p-4 rounded"
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
