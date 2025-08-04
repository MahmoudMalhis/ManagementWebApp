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
  accomplishmentStatus,
  idx,
  total,
}) => {
  const allowReply = accomplishmentStatus !== "reviewed" && idx === 0;

  return (
    <div className="mt-2">
      {comments.map((comment) => (
        <div
          key={comment._id}
          className="mb-2 p-3 rounded-xl glass-card border-none"
        >
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7 glassy-avatar">
              <AvatarFallback>
                {comment.commentedBy.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-xs glassy-text">
              {comment.commentedBy.name}
            </span>
            <span className="ml-2 text-xs text-muted-foreground glassy-text">
              {new Date(comment.createdAt).toLocaleString()}
            </span>
          </div>
          <p className="text-sm mt-1 glassy-text">{comment.text}</p>
          {/* الردود */}
          {replies
            .filter((reply) => reply.replyTo === comment._id)
            .reverse()
            .map((reply) => (
              <div
                key={reply._id}
                className={`ml-10 mt-2 p-2 rounded-xl glass-card border-none ${
                  reply.commentedBy.role === "manager"
                    ? "glass-badge border-blue-200"
                    : "glass-badge border-green-200"
                }`}
                style={{
                  background:
                    reply.commentedBy.role === "manager"
                      ? "rgba(212,233,255,0.25)"
                      : "rgba(210,255,222,0.22)",
                  borderLeft:
                    reply.commentedBy.role === "manager"
                      ? "4px solid #3884db"
                      : "4px solid #14ae5c",
                }}
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6 glassy-avatar">
                    <AvatarFallback>
                      {reply.commentedBy.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-xs glassy-text">
                    {reply.commentedBy.name}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground glassy-text">
                    {new Date(reply.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs mt-1 glassy-text">{reply.text}</p>
              </div>
            ))}
          {/* زر الرد */}
          {allowReply && canReply(comment) && (
            <button
              className="mt-3 mr-3 glass-btn px-2 py-1"
              style={{ fontSize: "13px" }}
              onClick={() =>
                setReplyTo(replyTo === comment._id ? null : comment._id)
              }
            >
              <svg
                fill="#2563eb"
                viewBox="0 0 1920 1920"
                xmlns="http://www.w3.org/2000/svg"
                stroke="#2563eb"
                width={15}
              >
                <path
                  d="M835.942 632.563H244.966l478.08-478.08-90.496-90.496L-.026 696.563 632.55 1329.14l90.496-90.496-478.08-478.08h590.976c504.448 0 914.816 410.368 914.816 914.816v109.184h128V1675.38c0-574.976-467.84-1042.816-1042.816-1042.816"
                  fillRule="evenodd"
                ></path>
              </svg>
              <span className="ml-1">{t("accomplishments.reply")}</span>
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
                className="w-full p-2 glass-input resize-y min-h-[40px]"
                placeholder={t("accomplishments.writeReply")}
                rows={2}
                style={{ direction: "rtl" }}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setReplyText("");
                    setReplyTo(null);
                  }}
                  className="glass-btn px-2 py-1"
                  style={{ fontSize: "13px" }}
                >
                  <svg viewBox="0 0 512 512" fill="#ff1100" width={15}>
                    <polygon points="328.96 30.2933333 298.666667 1.42108547e-14 164.48 134.4 30.2933333 1.42108547e-14 1.42108547e-14 30.2933333 134.4 164.48 1.42108547e-14 298.666667 30.2933333 328.96 164.48 194.56 298.666667 328.96 328.96 298.666667 194.56 164.48" />
                  </svg>
                </button>
                <button
                  type="submit"
                  disabled={submitting || !replyText.trim()}
                  className="glass-btn px-2 py-1"
                  style={{ fontSize: "13px" }}
                >
                  <svg
                    viewBox="-2.4 -2.4 28.80 28.80"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    stroke="#"
                    width={20}
                  >
                    <path
                      d="M10.3009 13.6949L20.102 3.89742M10.5795 14.1355L12.8019 18.5804C13.339 19.6545 13.6075 20.1916 13.9458 20.3356C14.2394 20.4606 14.575 20.4379 14.8492 20.2747C15.1651 20.0866 15.3591 19.5183 15.7472 18.3818L19.9463 6.08434C20.2845 5.09409 20.4535 4.59896 20.3378 4.27142C20.2371 3.98648 20.013 3.76234 19.7281 3.66167C19.4005 3.54595 18.9054 3.71502 17.9151 4.05315L5.61763 8.2523C4.48114 8.64037 3.91289 8.83441 3.72478 9.15032C3.56153 9.42447 3.53891 9.76007 3.66389 10.0536C3.80791 10.3919 4.34498 10.6605 5.41912 11.1975L9.86397 13.42C10.041 13.5085 10.1295 13.5527 10.2061 13.6118C10.2742 13.6643 10.3352 13.7253 10.3876 13.7933C10.4468 13.87 10.491 13.9585 10.5795 14.1355Z"
                      stroke="#2563eb"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                </button>
              </div>
            </form>
          )}
        </div>
      ))}
    </div>
  );
};

export default AccomplishmentCommentsSection;
