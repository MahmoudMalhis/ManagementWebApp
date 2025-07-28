import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { accomplishmentsAPI } from "@/api/api";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  LucideArrowLeft,
  LucideLoader,
  LucideFileCheck,
  LucideFileClock,
  LucideFileText,
  LucideSend,
  LucideCheck,
} from "lucide-react";

interface Comment {
  _id: string;
  text: string;
  createdAt: string;
  commentedBy: {
    _id: string;
    name: string;
    role: string;
  };
}

interface File {
  _id: string;
  fileName: string;
  filePath: string;
  fileType: string;
}

interface Accomplishment {
  _id: string;
  description: string;
  status: "pending" | "reviewed" | "needs_modification";
  isReviewed: boolean;
  createdAt: string;
  files: File[];
  comments: Comment[];
  employee: {
    _id: string;
    name: string;
    email: string;
  };
}

const AccomplishmentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isManager } = useAuth();
  const { toast } = useToast();
  const { sendAccomplishmentReviewed, sendNewComment } = useSocket();

  const [accomplishment, setAccomplishment] = useState<Accomplishment | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    const fetchAccomplishment = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await accomplishmentsAPI.getAccomplishment(id!);
        setAccomplishment(response.data);
      } catch (err) {
        console.error("Error fetching accomplishment:", err);
        setError(err.message || "Failed to load accomplishment details");
      } finally {
        setLoading(false);
      }
    };

    fetchAccomplishment();
  }, [id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!comment.trim()) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description:
          t("accomplishments.comment") + " " + t("common.error").toLowerCase(),
      });
      return;
    }

    try {
      setSubmitting(true);

      const response = await accomplishmentsAPI.addComment(id!, comment);
      setAccomplishment(response.data);
      setComment("");

      // Send notification via socket
      sendNewComment(id!, accomplishment!.employee._id);

      toast({
        title: t("common.success"),
        description:
          t("accomplishments.addComment") +
          " " +
          t("common.success").toLowerCase(),
      });
    } catch (err) {
      console.error("Error adding comment:", err);
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: err.message || t("common.error"),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewAccomplishment = async (status: string) => {
    try {
      setReviewing(true);

      await accomplishmentsAPI.reviewAccomplishment(id!, status);

      // إعادة جلب بيانات الإنجاز بعد التحديث
      const accomplishmentResponse = await accomplishmentsAPI.getAccomplishment(
        id!
      );
      setAccomplishment(accomplishmentResponse.data);

      // إرسال إشعار أو أي منطق إضافي هنا
      sendAccomplishmentReviewed(id!, accomplishment!.employee._id);

      toast({
        title: t("common.success"),
        description:
          t("accomplishments.review") + " " + t("common.success").toLowerCase(),
      });
    } catch (err) {
      console.error("Error reviewing accomplishment:", err);
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: err.message || t("common.error"),
      });
    } finally {
      setReviewing(false);
    }
  };

  // Format date function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <LucideLoader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !accomplishment) {
    return (
      <Card className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900">
        <CardContent className="flex items-center justify-between py-6">
          <span className="text-red-600 dark:text-red-400">
            {error || t("common.error")}
          </span>
          <Button
            variant="outline"
            onClick={() => navigate("/accomplishments")}
          >
            {t("common.back")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
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
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">
                {isManager && (
                  <div className="mb-1 font-medium">
                    {accomplishment.employee.name}
                  </div>
                )}
                <span className="text-muted-foreground text-sm">
                  {formatDate(accomplishment.createdAt)}
                </span>
              </CardTitle>
            </div>
            <Badge
              variant={
                accomplishment.status === "reviewed" ? "default" : "outline"
              }
              className={
                accomplishment.status === "reviewed"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : accomplishment.status === "needs_modification"
                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
              }
            >
              {accomplishment.status === "reviewed" ? (
                <span className="flex items-center gap-1">
                  <LucideFileCheck className="h-3 w-3" />
                  {t("accomplishments.reviewed")}
                </span>
              ) : accomplishment.status === "needs_modification" ? (
                <span className="flex items-center gap-1">
                  <LucideFileClock className="h-3 w-3" />
                  {t("accomplishments.needsModification")}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <LucideFileClock className="h-3 w-3" />
                  {t("accomplishments.notReviewed")}
                </span>
              )}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Description */}
          <div className="p-4 bg-muted/30 rounded-md">
            <p className="whitespace-pre-wrap">{accomplishment.description}</p>
          </div>

          {/* Files */}
          {accomplishment.files && accomplishment.files.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-sm">
                {t("accomplishments.files")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {accomplishment.files.map((file) => (
                  <a
                    key={file._id}
                    href={`http://localhost:5000/${file.filePath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-2 border rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <LucideFileText className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm truncate">{file.fileName}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Review button - for managers only */}
          {isManager && accomplishment.status !== "reviewed" && (
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => handleReviewAccomplishment("reviewed")}
                disabled={reviewing}
                className="flex items-center gap-2"
              >
                {reviewing ? (
                  <LucideLoader className="h-4 w-4 animate-spin" />
                ) : (
                  <LucideCheck className="h-4 w-4" />
                )}
                {t("accomplishments.review")}
              </Button>
              <Button
                onClick={() => handleReviewAccomplishment("needs_modification")}
                variant="outline"
                disabled={reviewing}
                className="flex items-center gap-2"
              >
                {reviewing ? (
                  <LucideLoader className="h-4 w-4 animate-spin" />
                ) : (
                  <LucideCheck className="h-4 w-4" />
                )}
                {
                  t(
                    "accomplishments.needsModification"
                  ) /* أضف الترجمة في ملف الترجمة */
                }
              </Button>
            </div>
          )}

          <Separator />

          {/* Comments */}
          <div className="space-y-4">
            <h3 className="font-medium">{t("accomplishments.comments")}</h3>

            {/* Comments list */}
            <div className="space-y-4">
              {accomplishment.comments && accomplishment.comments.length > 0 ? (
                accomplishment.comments.map((comment) => (
                  <div key={comment._id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {comment.commentedBy.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">
                          {comment.commentedBy.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(comment.createdAt)}
                        </div>
                      </div>
                      <p className="text-sm">{comment.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("accomplishments.noComments")}
                </p>
              )}
            </div>

            {/* Add comment form - for managers only */}
            {isManager && (
              <form onSubmit={handleAddComment} className="space-y-2">
                <Textarea
                  placeholder={t("accomplishments.addComment")}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2"
                  >
                    {submitting ? (
                      <LucideLoader className="h-4 w-4 animate-spin" />
                    ) : (
                      <LucideSend className="h-4 w-4" />
                    )}
                    {t("accomplishments.addComment")}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccomplishmentDetails;
