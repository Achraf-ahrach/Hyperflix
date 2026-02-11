import { Edit, Heart, MessageCircle, MoreVertical, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { SpoilerText } from "./SpoilerText";
import { CommentInput } from "./CommentInput";
import { ReplyItem } from "./ReplyItem";
import { Comment } from "../types/types"
import { API_URL } from "@/app/utils";
import { useUser } from "@/lib/contexts/UserContext";
import { useRouter } from "next/navigation";
import { resolveApiUrl, timeAgo } from "@/lib/utils";
import { toast } from "sonner";

// --- Comment Item Component ---
interface CommentItemProps {
  comment: Comment;
  onLike: () => void;
  onReply: (content: string) => Promise<void>;
  onDelete: () => void;
  onEdit: (content: string) => Promise<void> | void;
  onReplyLike: (replyId: number) => void;
  onReplyDelete: (replyId: number) => void;
  onReplyEdit: (replyId: number, content: string) => Promise<void> | void;
}

export const CommentItem = ({ comment, onLike, onReply, onDelete, onEdit, onReplyLike, onReplyDelete, onReplyEdit }: CommentItemProps) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isEditing) {
      setEditContent(comment.content);
    }
  }, [comment.content, isEditing]);


  if (!user) return null;
  const handleReplySubmit = async (content: string) => {
    await onReply(content);
    setShowReplyInput(false);
  };


  const avatarUrl = resolveApiUrl(comment.userAvatar);
  return (

    <div className="
          
          border border-slate-700
          p-6 rounded-2xl
          transition-colors
          hover:border-slate-600
        ">

      <div className="flex gap-4">
        {/* <img src={resolveApiUrl(comment.userAvatar)} className="w-10 h-10 rounded-full bg-slate-800" alt={comment.username} onClick={()=>{router.push(`/profile/${comment.userId}`)}} /> */}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            className="w-10 h-10 rounded-full bg-slate-800 cursor-pointer"
            alt={comment.username}
            onClick={() => router.push(`/profile/${comment.userId}`)}
          />
        ) : (
          <div
            className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white cursor-pointer"
            onClick={() => router.push(`/profile/${comment.userId}`)}
          >
            {comment.username.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 cursor-pointer " onClick={() => { router.push(`/profile/${comment.userId}`) }}>
              <span className="font-bold text-sm">{comment.username}</span>
              <span className="text-[10px] text-slate-600">{timeAgo(comment.createdAt)}</span>
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
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-emerald-400 hover:bg-slate-700 flex items-center gap-2"
                    >
                      <Edit size={12} /> Edit
                    </button>
                  </div>
                )
                }
              </div>
            )}
          </div>

          <div className="mt-2">
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  className="w-full bg-transparent border border-slate-700 rounded-lg p-3 text-sm focus:outline-none focus:border-red-500/50"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end gap-2 text-xs">
                  <button
                    className="px-3 py-1 rounded-lg border border-slate-600"
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(comment.content);
                    }}
                    disabled={isSavingEdit}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-1 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50"
                    onClick={async () => {
                      if (!editContent.trim()) {
                        return;
                      }
                      try {
                        setIsSavingEdit(true);
                        await onEdit(editContent.trim());
                        setIsEditing(false);
                      } catch (error : any) {
                        // console.error('Failed to edit comment:', error);
                        toast.error(error.message || 'Failed to edit comment');
                      } finally {
                        setIsSavingEdit(false);
                      }
                    }}
                    disabled={isSavingEdit || !editContent.trim()}
                  >
                    {isSavingEdit ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <SpoilerText text={comment.content} />
            )}
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
                    // console.log('Liking reply with ID:', reply.id);
                    onReplyLike(reply.id);
                  }}
                  onDelete={() => onReplyDelete(reply.id)}
                  onEdit={(newContent) => onReplyEdit(reply.id, newContent)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
