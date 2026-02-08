import { Heart, MessageCircle, MoreVertical, Trash2 } from "lucide-react";
import { useState } from "react";
import { SpoilerText } from "./SpoilerText";
import { CommentInput } from "./CommentInput";
import { ReplyItem } from "./ReplyItem";
import { Comment } from "../types/types"
import { API_URL } from "@/app/utils";
import { useUser } from "@/lib/contexts/UserContext";

// --- Comment Item Component ---
interface CommentItemProps {
  comment: Comment;
  onLike: () => void;
  onReply: (content: string) => Promise<void>;
  onDelete: () => void;
  onReplyLike: (replyId: number) => void;
  onReplyDelete: (replyId: number) => void;
}

export const CommentItem = ({ comment, onLike, onReply, onDelete, onReplyLike, onReplyDelete }: CommentItemProps) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { user } = useUser();


  if (!user) return null;
  const handleReplySubmit = async (content: string) => {
    await onReply(content);
    setShowReplyInput(false);
  };

  let imageUrl: string = ''
  if (!comment.userAvatar) {
    imageUrl = '';
  } else if (!comment.userAvatar.startsWith('http')) {
    imageUrl = `${API_URL}${comment.userAvatar}`;
  } else {
    imageUrl = comment.userAvatar;
  }
  console.log('Comment userAvatar:', comment.userId, ' :::', user.id);

  return (

    <div className="
          
          border border-slate-700
          p-6 rounded-2xl
          transition-colors
          hover:border-slate-600
        ">

      <div className="flex gap-4">
        <img src={imageUrl} className="w-10 h-10 rounded-full bg-slate-800" alt={comment.username} />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">{comment.username}</span>
            </div>
            {comment.userId === user.id && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="text-slate-600 hover:text-foreground transition-colors"
                  aria-label="Comment options"
                >
                  <MoreVertical size={16} />
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-32  border border-slate-700 rounded-lg shadow-xl z-10 overflow-hidden">
                    <button
                      onClick={() => {
                        onDelete();
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-slate-700 flex items-center gap-2"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                )
                }
              </div>
            )}
          </div>

          <div className="mt-2">
            <SpoilerText text={comment.content} />
          </div>

          {comment.media?.[0] && (
            <img
              src={`${API_URL}${comment.media[0].url}`}
              className="mt-4 rounded-xl max-h-72 w-auto border border-slate-800"
              alt={comment.media[0].alt || "Comment attachment"}
            />
          )}

          <div className="flex items-center gap-5 mt-5">
            <button
              onClick={onLike}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${comment.isLiked ? 'text-red-500' : 'text-slate-500 hover:text-red-400'
                }`}
            >
              <Heart size={14} fill={comment.isLiked ? "currentColor" : "none"} />
              {comment.likes}
            </button>
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-foreground transition-colors"
            >
              <MessageCircle size={14} />
              Reply
            </button>
          </div>

          {showReplyInput && (
            <div className="mt-4">
              <CommentInput
                onSubmit={handleReplySubmit}
                placeholder="Write a reply..."
                autoFocus
                compact
              />
            </div>
          )}

          {comment.replies.length > 0 && (
            <div className="mt-6 space-y-4 border-l-2 border-slate-800/60 pl-4">
              {comment.replies.map(reply => (
                <ReplyItem
                  key={reply.id}
                  reply={reply}
                  onLike={() => {
                    console.log('Liking reply with ID:', reply.id);
                    onReplyLike(reply.id);
                  }}
                  onDelete={() => onReplyDelete(reply.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
