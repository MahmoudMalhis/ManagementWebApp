/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { accomplishmentsAPI } from "@/api/api";
import { Label } from "@/components/ui/label";
import { Input } from "./ui/input";

interface FileData {
  _id?: string; // موجود للملفات القديمة من قاعدة البيانات
  fileName: string;
  filePath?: string; // مسار الملف إذا كان قديم
  fileType?: string;
  file?: File; // موجود للملفات الجديدة من input
}

interface ModifyFormProps {
  accomplishmentId: string;
  oldDescription: string;
  oldFiles?: FileData[];
  onModified: () => void;
}

const ModifyForm: React.FC<ModifyFormProps> = ({
  accomplishmentId,
  oldDescription,
  oldFiles = [],
  onModified,
}) => {
  const { toast } = useToast();
  const [description, setDescription] = useState(oldDescription);
  const [files, setFiles] = useState<FileData[]>(oldFiles);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  // إضافة ملفات جديدة بدون حذف القديمة
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const mappedFiles = selectedFiles.map((file) => ({
        fileName: file.name,
        file,
      }));
      setFiles((prev) => [...prev, ...mappedFiles]);
      setNewFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  // حذف أي ملف (قديم أو جديد) من القائمة
  const handleRemoveFile = (index: number) => {
    const fileToRemove = files[index];
    setFiles((prev) => prev.filter((_, i) => i !== index));

    // إذا الملف كان جديد (من input)، نحذفه من newFiles أيضًا
    if (fileToRemove.file) {
      setNewFiles((prev) =>
        prev.filter((f) => f.name !== fileToRemove.fileName)
      );
    }
  };

  // إرسال البيانات للسيرفر
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("description", description);

      // إضافة الملفات الجديدة فقط (القديمة موجودة مسبقًا في DB)
      newFiles.forEach((file) => formData.append("files", file));

      await accomplishmentsAPI.modifyAccomplishment(accomplishmentId, formData);

      toast({ title: "تم التعديل بنجاح" });
      onModified();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "حدث خطأ",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 mt-6 border p-4 rounded-md"
    >
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        placeholder="أدخل الوصف الجديد"
      />

      <div className="mt-3 md:grid-cols-4 gap-3">
        {files.map((file, index) => {
          const isImage =
            file.fileType?.startsWith("image") ||
            file.file?.type.startsWith("image");

          const src = file.file // ملف جديد
            ? URL.createObjectURL(file.file)
            : file.filePath // ملف قديم
            ? `http://localhost:5000${file.filePath}`
            : "";

          return (
            <div
              key={index}
              className="relative border rounded p-2 flex justify-between items-center"
            >
              {isImage ? (
                <img
                  src={src}
                  alt={file.fileName}
                  className="w-24 h-24 object-cover rounded"
                />
              ) : (
                <span className="text-xs text-center break-all">
                  {file.fileName}
                </span>
              )}
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => handleRemoveFile(index)}
                className="mt-2"
              >
                حذف
              </Button>
            </div>
          );
        })}
      </div>

      {/* اختيار ملفات جديدة */}
      <input
        type="file"
        multiple
        onChange={handleFileChange}
        className="block w-full"
      />

      <Button type="submit" disabled={loading}>
        {loading ? "جاري التعديل..." : "حفظ التعديلات"}
      </Button>
    </form>
  );
};

export default ModifyForm;
