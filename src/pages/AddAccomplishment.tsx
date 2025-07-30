import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { accomplishmentsAPI } from "@/api/api";
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
import {
  LucideUpload,
  LucideLoader,
  LucideArrowLeft,
  LucideX,
} from "lucide-react";

const AddAccomplishment = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { sendNewAccomplishment } = useSocket();

  // منع المدير من الدخول
  useEffect(() => {
    if (user?.role === "manager") {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("common.notAuthorized"),
      });
      navigate("/accomplishments");
    }
  }, [user, navigate, toast, t]);

  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // إضافة ملفات جديدة مع الحفاظ على القديمة
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  // حذف ملف من القائمة
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

      files.forEach((file) => {
        formData.append("files", file);
      });

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
        className="mb-4 flex items-center gap-1"
        onClick={() => navigate("/accomplishments")}
      >
        <LucideArrowLeft className="h-4 w-4" />
        {t("common.back")}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{t("accomplishments.add")}</CardTitle>
          <CardDescription>{t("accomplishments.description")}</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">
                {t("accomplishments.description")}
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("accomplishments.description")}
                className="min-h-[100px]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="files">{t("accomplishments.files")}</Label>
              <Input
                id="files"
                type="file"
                multiple
                onChange={handleFileChange}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />

              {/* عرض المعاينات */}
              <div className="mt-3 md:grid-cols-4 gap-3">
                {files.map((file, index) => {
                  const isImage = file.type.startsWith("image");
                  return (
                    <div
                      key={index}
                      className="relative border rounded p-2 flex justify-between items-center mb-3"
                    >
                      {isImage ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-24 h-24 object-cover rounded"
                        />
                      ) : (
                        <span className="text-xs text-center break-all">
                          {file.name}
                        </span>
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
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
              onClick={() => navigate("/accomplishments")}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2"
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
