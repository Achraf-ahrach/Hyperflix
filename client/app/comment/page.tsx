"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Heart,
  MessageCircle,
  MoreVertical,
  Trash2,
  Check,
  X,
  Loader2,
  Image as ImageIcon,
  ChevronDown,
  Shield,
} from "lucide-react";

// --- Interfaces ---
interface User {
  id: string;
  username: string;
  avatar: string;
  isVerified?: boolean;
}

interface CommentMedia {
  id: string;
  type: "image";
  url: string;
  alt?: string;
}

interface Reply {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  content: string;
  likes: number;
  isLiked: boolean;
  media?: CommentMedia[];
  createdAt: string;
}

interface Comment {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  content: string;
  likes: number;
  isLiked: boolean;
  replies: Reply[];
  replyCount: number;
  media?: CommentMedia[];
  createdAt: string;
  isPinned?: boolean;
}

// --- Constants & Dummy Data ---
const INITIAL_BATCH = 3;
const LOAD_MORE_BATCH = 3;

const currentUser: User = {
  id: "user-1",
  username: "JohnDoe",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
  isVerified: true,
};

// --- Helper: Spoiler Component ---
const SpoilerText = ({ text }: { text: string }) => {
  const [revealed, setRevealed] = useState(false);
  const parts = text.split(/(\|\|.*?\|\|)/g);

  return (
    <p className="text-slate-300 whitespace-pre-wrap leading-relaxed text-sm">
      {parts.map((part, i) => {
        if (part.startsWith("||") && part.endsWith("||")) {
          const content = part.slice(2, -2);
          return (
            <span
              key={i}
              onClick={() => setRevealed(!revealed)}
              className={`cursor-pointer rounded px-1 transition-all mx-0.5 ${
                revealed
                  ? "bg-slate-700 text-slate-200"
                  : "bg-slate-800 text-transparent select-none blur-sm"
              }`}
            >
              {content}
            </span>
          );
        }
        return part;
      })}
    </p>
  );
};

const CommentsSection = ({ movieId }: { movieId: string }) => {
  // Data Logic
  const [allComments, setAllComments] = useState<Comment[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);

  // UI States
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Input States
  const [newComment, setNewComment] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [commentMedia, setCommentMedia] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---

  const handleAddComment = async () => {
    if (!newComment.trim() && !commentMedia) return;
    setIsSubmitting(true);

    // Simulate API Call
    await new Promise((r) => setTimeout(r, 800));

    const addedComment: Comment = {
      id: `c-${Date.now()}`,
      userId: currentUser.id,
      username: currentUser.username,
      userAvatar: currentUser.avatar,
      content: newComment,
      likes: 0,
      isLiked: false,
      replies: [],
      replyCount: 0,
      media: commentMedia
        ? [
            {
              id: `m-${Date.now()}`,
              type: "image",
              url: URL.createObjectURL(commentMedia),
            },
          ]
        : [],
      createdAt: new Date().toISOString(),
    };

    setAllComments((prev) => [addedComment, ...prev]);
    setVisibleCount((prev) => prev + 1); // Keep the new comment visible
    setNewComment("");
    setCommentMedia(null);
    setIsSubmitting(false);
  };

  const handleAddReply = async (parentId: string) => {
    if (!replyContent.trim()) return;
    setIsSubmitting(true);

    await new Promise((r) => setTimeout(r, 600));

    const newReply: Reply = {
      id: `r-${Date.now()}`,
      userId: currentUser.id,
      username: currentUser.username,
      userAvatar: currentUser.avatar,
      content: replyContent,
      likes: 0,
      isLiked: false,
      createdAt: new Date().toISOString(),
    };

    setAllComments((prev) =>
      prev.map((c) =>
        c.id === parentId
          ? {
              ...c,
              replies: [...c.replies, newReply],
              replyCount: c.replyCount + 1,
            }
          : c
      )
    );

    setReplyContent("");
    setReplyingToId(null);
    setIsSubmitting(false);
  };

  const toggleLike = (commentId: string, replyId?: string) => {
    setAllComments((prev) =>
      prev.map((c) => {
        if (!replyId && c.id === commentId) {
          return {
            ...c,
            isLiked: !c.isLiked,
            likes: c.isLiked ? c.likes - 1 : c.likes + 1,
          };
        }
        if (replyId && c.id === commentId) {
          return {
            ...c,
            replies: c.replies.map((r) =>
              r.id === replyId
                ? {
                    ...r,
                    isLiked: !r.isLiked,
                    likes: r.isLiked ? r.likes - 1 : r.likes + 1,
                  }
                : r
            ),
          };
        }
        return c;
      })
    );
  };

  const deleteComment = (id: string) => {
    setAllComments((prev) => prev.filter((c) => c.id !== id));
  };

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    await new Promise((r) => setTimeout(r, 700));
    setVisibleCount((prev) => prev + LOAD_MORE_BATCH);
    setIsLoadingMore(false);
  };

  const displayedComments = allComments.slice(0, visibleCount);
  const hasMore = allComments.length > visibleCount;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
          Community Chat{" "}
          <span className="text-sm font-normal text-slate-500 bg-slate-900 px-3 py-1 rounded-full">
            {allComments.length}
          </span>
        </h2>

        {/* Main Input */}
        <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl mb-10 backdrop-blur-sm">
          <div className="flex gap-4">
            <img
              src={currentUser.avatar}
              className="w-10 h-10 rounded-full border border-red-500/50"
            />
            <div className="flex-1">
              <textarea
                className="w-full bg-transparent border-none outline-none resize-none text-sm placeholder:text-slate-600"
                placeholder="Write a comment... use ||spoiler|| for twists!"
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              {commentMedia && (
                <div className="relative mt-2 inline-block">
                  <img
                    src={URL.createObjectURL(commentMedia)}
                    className="h-24 w-24 object-cover rounded-lg border border-slate-700"
                  />
                  <button
                    onClick={() => setCommentMedia(null)}
                    className="absolute -top-2 -right-2 bg-red-600 p-1 rounded-full hover:bg-red-500"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              <div className="flex justify-between items-center mt-4 border-t border-slate-800/50 pt-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <ImageIcon size={20} />
                  <input
                    type="file"
                    ref={fileInputRef}
                    hidden
                    accept="image/*"
                    onChange={(e) =>
                      setCommentMedia(e.target.files?.[0] || null)
                    }
                  />
                </button>
                <button
                  onClick={handleAddComment}
                  disabled={
                    isSubmitting || (!newComment.trim() && !commentMedia)
                  }
                  className="bg-red-600 hover:bg-red-500 disabled:opacity-50 px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-6">
          {displayedComments.map((comment) => (
            <div
              key={comment.id}
              className="bg-slate-900/30 border border-slate-800/40 p-6 rounded-2xl group transition-all hover:border-slate-700/60"
            >
              <div className="flex gap-4">
                <img
                  src={comment.userAvatar}
                  className="w-10 h-10 rounded-full bg-slate-800"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">
                        {comment.username}
                      </span>
                      {comment.userId === currentUser.id && (
                        <span className="text-[10px] bg-red-600/20 text-red-400 px-2 py-0.5 rounded-full uppercase tracking-tighter font-bold border border-red-600/30">
                          You
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActiveMenu(
                            activeMenu === comment.id ? null : comment.id
                          )
                        }
                        className="text-slate-600 hover:text-white transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {activeMenu === comment.id && (
                        <div className="absolute right-0 mt-2 w-32 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 overflow-hidden">
                          <button
                            onClick={() => deleteComment(comment.id)}
                            className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-slate-700 flex items-center gap-2"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-2">
                    <SpoilerText text={comment.content} />
                  </div>

                  {comment.media?.[0] && (
                    <img
                      src={comment.media[0].url}
                      className="mt-4 rounded-xl max-h-72 w-auto border border-slate-800"
                    />
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-5 mt-5">
                    <button
                      onClick={() => toggleLike(comment.id)}
                      className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                        comment.isLiked
                          ? "text-red-500"
                          : "text-slate-500 hover:text-red-400"
                      }`}
                    >
                      <Heart
                        size={14}
                        fill={comment.isLiked ? "currentColor" : "none"}
                      />
                      {comment.likes}
                    </button>
                    <button
                      onClick={() =>
                        setReplyingToId(
                          replyingToId === comment.id ? null : comment.id
                        )
                      }
                      className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-white transition-colors"
                    >
                      <MessageCircle size={14} />
                      Reply
                    </button>
                  </div>

                  {/* Reply Input Area */}
                  {replyingToId === comment.id && (
                    <div className="mt-4 flex gap-2">
                      <input
                        autoFocus
                        className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500/50 transition-colors"
                        placeholder="Write a reply..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleAddReply(comment.id)
                        }
                      />
                      <button
                        onClick={() => handleAddReply(comment.id)}
                        disabled={!replyContent.trim()}
                        className="bg-red-600 p-2 rounded-lg disabled:opacity-50"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  )}

                  {/* Nested Replies */}
                  {comment.replies.length > 0 && (
                    <div className="mt-6 space-y-4 border-l-2 border-slate-800/60 pl-4">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-3">
                          <img
                            src={reply.userAvatar}
                            className="w-7 h-7 rounded-full bg-slate-800"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-300">
                                {reply.username}
                              </span>
                              <span className="text-[10px] text-slate-600">
                                • Just now
                              </span>
                            </div>
                            <p className="text-slate-400 text-sm mt-0.5">
                              {reply.content}
                            </p>
                            <button
                              onClick={() => toggleLike(comment.id, reply.id)}
                              className={`mt-2 flex items-center gap-1 text-[10px] ${
                                reply.isLiked
                                  ? "text-red-500 font-bold"
                                  : "text-slate-600 hover:text-red-400"
                              }`}
                            >
                              <Heart
                                size={10}
                                fill={reply.isLiked ? "currentColor" : "none"}
                              />
                              {reply.likes}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="mt-12 flex justify-center">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-8 py-3 rounded-full text-sm font-semibold text-slate-400 hover:text-white hover:border-slate-600 transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoadingMore ? (
                <Loader2 size={16} className="animate-spin text-red-500" />
              ) : (
                <>
                  Load More Comments
                  <ChevronDown size={16} />
                </>
              )}
            </button>
          </div>
        )}

        {/* Footer info */}
        {!hasMore && allComments.length > 0 && (
          <div className="mt-16 text-center border-t border-slate-900 pt-8">
            <p className="text-slate-700 text-xs uppercase tracking-[0.2em]">
              End of Discussion
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentsSection;
