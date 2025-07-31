import AccomplishmentFilesSection from "./AccomplishmentFilesSection";
import AccomplishmentCommentsSection from "./AccomplishmentCommentsSection";
import { useAuth } from "@/contexts/AuthContext"; // استورد hook

const AccomplishmentVersionBlock = ({
  version,
  sectionComments,
  sectionReplies,
  idx,
  total,
  canReply,
  t,
  replyTo,
  setReplyTo,
  replyText,
  setReplyText,
  submitting,
  handleReplySubmit,
  canAddComment,
  commentText,
  setCommentText,
  handleAddComment,
  accomplishmentStatus,
  ...props
}) => {
  const { isManager } = useAuth();

  const allowComment =
    isManager &&
    canAddComment &&
    accomplishmentStatus !== "reviewed" &&
    idx === total - 1;

  return (
    <div className="border rounded-md mb-8 p-4 bg-gray-50">
      <div className="mb-2 flex justify-between items-center">
        <span className="font-semibold text-base">
          {idx === total - 1
            ? "آخر تعديل (الحالي)"
            : `نسخة رقم ${total - idx - 1}`}
        </span>
        <span className="text-xs text-muted-foreground">
          {new Date(version.modifiedAt).toLocaleString()}
        </span>
      </div>
      <div className="mb-3 p-3 rounded bg-white">
        <p className="whitespace-pre-wrap">{version.description}</p>
      </div>
      {/* ملفات الإصدار */}
      <AccomplishmentFilesSection files={version.files} />
      {/* تعليقات الإصدار */}
      <AccomplishmentCommentsSection
        comments={sectionComments}
        replies={sectionReplies}
        canReply={canReply}
        t={t}
        replyTo={replyTo}
        setReplyTo={setReplyTo}
        replyText={replyText}
        setReplyText={setReplyText}
        submitting={submitting}
        handleReplySubmit={handleReplySubmit}
        accomplishmentStatus={accomplishmentStatus}
        idx={idx}
        total={total}
      />

      {/* **الفورم يظهر فقط للمدير** */}
      {allowComment && isManager && canAddComment && (
        <form onSubmit={handleAddComment} className="mt-4 flex gap-2">
          <textarea
            value={commentText[idx] || ""}
            onChange={(e) =>
              setCommentText((prev) => ({ ...prev, [idx]: e.target.value }))
            }
            rows={2}
            className="w-full p-2 border rounded"
            placeholder={t("accomplishments.addComment")}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded"
            disabled={submitting}
          >
            {submitting ? t("common.loading") : t("accomplishments.addComment")}
          </button>
        </form>
      )}
    </div>
  );
};

export default AccomplishmentVersionBlock;
