"use client"
import { Edit, Heart } from "lucide-react";
import { Reply } from "../types/types";
import { useEffect, useState } from "react";
import { useUser } from "@/lib/contexts/UserContext";
import { API_URL } from "@/app/utils";
import { resolveApiUrl, timeAgo } from "@/lib/utils";
import { useRouter } from "next/navigation";




interface ReplyItemProps {
  reply: Reply;
  onLike: () => void;
  onDelete: () => void; // Added delete handler
  onEdit: (content: string) => Promise<void> | void;
}

export const ReplyItem = ({ reply, onLike, onDelete, onEdit }: ReplyItemProps) => {

  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(reply.content);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const { user } = useUser();
  const router = useRouter();


  useEffect(() => {
    if (!isEditing) {
      setEditContent(reply.content);
    }
  }, [reply.content, isEditing]);


  const avatarUrl = resolveApiUrl(reply.userAvatar);

  return (

    <div className="flex gap-3">

      {avatarUrl ? (
        <img
          src={avatarUrl}
          className="w-10 h-10 rounded-full bg-slate-800 cursor-pointer"
          alt={reply.username}
          onClick={() => router.push(`/profile/${reply.userId}`)}
        />
      ) : (
        <div
          className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white cursor-pointer"
          onClick={() => router.push(`/profile/${reply.userId}`)}
        >
          {reply.username.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs ">{reply.username}</span>
            <span className="text-xs text-slate-500">{timeAgo(reply.createdAt)}</span>
          </div>
          {
            user?.id === reply.userId && (
              <div className="relative group">
                <button className="p-1 text-slate-500 hover:text-foreground transition-colors"
                  onClick={() => setShowMenu(!showMenu)} >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="6" r="1" />
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="18" r="1" />
                  </svg>
                </button>

                {/* Dropdown menu */}

                {
                  showMenu && (
                    <div className="absolute right-0 top-full mt-1 w-28 bg-slate-800 border border-slate-700 rounded-md shadow-lg transition-all duration-200 z-10">
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-emerald-400 hover:bg-slate-700 rounded-t-md transition-colors flex items-center gap-1"
                      >
                        <Edit size={10} /> Edit
                      </button>
                      <button
                        onClick={() => {
                          onDelete();
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-slate-700 rounded-b-md transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )
                }
              </div>
            )
          }
        </div>

        <div className="mt-0.5">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                className="w-full bg-transparent border border-slate-700 rounded-lg p-2 text-xs focus:outline-none focus:border-red-500/50"
                rows={2}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              />
              <div className="flex justify-end gap-2 text-[10px]">
                <button
                  className="px-2 py-1 rounded border border-slate-600"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(reply.content);
                  }}
                  disabled={isSavingEdit}
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 disabled:opacity-50"
                  onClick={async () => {
                    if (!editContent.trim()) {
                      return;
                    }
                    try {
                      setIsSavingEdit(true);
                      await onEdit(editContent.trim());
                      setIsEditing(false);
                    } catch (error) {
                      console.error('Failed to edit reply:', error);
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
            <p className="text-foreground text-sm">{reply.content}</p>
          )}
        </div>
        <button
          onClick={onLike}
          className={`mt-2 flex items-center gap-1 text-[10px] transition-colors ${reply.isLiked ? 'text-red-500 font-bold' : 'text-slate-600 hover:text-red-400'
            }`}
        >
          <Heart size={10} fill={reply.isLiked ? "currentColor" : "none"} />
          {reply.likes}
        </button>
      </div>
    </div>
  )
};