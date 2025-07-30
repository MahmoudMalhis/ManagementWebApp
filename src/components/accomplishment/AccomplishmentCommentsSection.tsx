import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const AccomplishmentCommentsSection = ({
  comments,
  replies,
  canReply,
  t,
  replyTo,
  setReplyTo,
  replyText,
  setReplyText,
  submitting,
  handleReplySubmit,
}) => (
  <div className="mt-2">
    {comments.map((comment) => (
      <div key={comment._id} className="mb-2 p-2 border-b last:border-b-0">
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback>
              {comment.commentedBy.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-xs">
            {comment.commentedBy.name}
          </span>
          <span className="ml-2 text-xs text-muted-foreground">
            {new Date(comment.createdAt).toLocaleString()}
          </span>
        </div>
        <p className="text-sm mt-1">{comment.text}</p>
        {/* الردود */}
        {replies
          .filter((reply) => reply.replyTo === comment._id)
          .map((reply) => (
            <div
              key={reply._id}
              className={`ml-10 mt-2 p-2 rounded 
        ${
          reply.commentedBy.role === "manager"
            ? "bg-blue-100 text-blue-900"
            : "bg-green-100 text-green-900"
        }
      `}
            >
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback>
                    {reply.commentedBy.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-xs">
                  {reply.commentedBy.name}
                </span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {new Date(reply.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-xs mt-1">{reply.text}</p>
            </div>
          ))}
        {/* زر الرد */}
        {canReply(comment) && (
          <button
            className="text-xs text-blue-600 hover:underline mt-1"
            onClick={() =>
              setReplyTo(replyTo === comment._id ? null : comment._id)
            }
          >
            {t("accomplishments.reply")}
          </button>
        )}
        {/* نموذج الرد */}
        {replyTo === comment._id && (
          <form
            onSubmit={(e) => handleReplySubmit(e, comment._id)}
            className="mt-2 space-y-2"
          >
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder={t("accomplishments.writeReply")}
              rows={2}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="text-xs px-2 py-1 border rounded"
                onClick={() => {
                  setReplyText("");
                  setReplyTo(null);
                }}
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                className="text-xs px-2 py-1 bg-blue-600 text-white rounded"
                disabled={submitting}
              >
                {submitting ? "..." : t("accomplishments.reply")}
              </button>
            </div>
          </form>
        )}
      </div>
    ))}
  </div>
);

export default AccomplishmentCommentsSection;
