"use client"

import React, { useState, useRef, useContext } from 'react';
import {
  Send, Heart, MessageCircle, MoreVertical, Trash2,
  X, Loader2, ImageIcon, ChevronDown
} from 'lucide-react';
import { CommentItem } from './components/CommentItem';
import api from '@/lib/axios';
import { API_URL } from '../utils';

// --- Types ---
export interface User {
  id: string;
  username: string;
  avatar: string;
  isVerified?: boolean;
}
export interface CommentMedia {
  id: string;
  type: 'image';
  url: string;
  alt?: string;
}

export interface Reply {
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

export interface Comment {
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

// --- Constants ---
export const INITIAL_BATCH = 10;
export const LOAD_MORE_BATCH = 3;

export const currentUser: User = {
  id: 'user-1',
  username: 'JohnDoe',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  isVerified: true
};

// --- API Service ---
export const comment_api = {
  async getComments(movieId: string, limit: number, offset: number) {
    // Simulate API call
    // await new Promise(r => setTimeout(r, 500));

    // Mock data - in production, this would be: 
    // const response = await fetch(`/api/movies/${movieId}/comments?limit=${limit}&offset=${offset}`);
    // return response.json();



    const endpoint = `${API_URL}/comments/2?limit=${limit}&offset=${offset}`;

    const response = await fetch(endpoint, {
      method: 'GET',
      credentials: 'include',
      // body: formData
    });
    return await response.json();

  },

  async createComment(movieId: string, content: string, media?: File): Promise<Comment> {
    // await new Promise(r => setTimeout(r, 800));


    const endpoint = `${API_URL}/comments/2`;
    const formData = new FormData();
    formData.append('content', content);
    console.log(content);
    if (media) formData.append('media', media);
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData
    });
    return await response.json();

  },

  async createReply(commentId: string, content: string): Promise<Reply> {

    const endpoint = `${API_URL}/comments/${commentId}/replies`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    return response.json();

    return {
      id: `r-${Date.now()}`,
      userId: currentUser.id,
      username: currentUser.username,
      userAvatar: currentUser.avatar,
      content,
      likes: 0,
      isLiked: false,
      createdAt: new Date().toISOString()
    };
  },

  async toggleLike(commentId: string, replyId?: string): Promise<boolean> {
    try
    {
      console.log(`/comments/${commentId}/like`);
      api.post(`/comments/${commentId}/like`);
      return true;
    }
    catch
    {
      return false;
    }
  },

  async deleteComment(commentId: string): Promise<void> {
    await new Promise(r => setTimeout(r, 400));
    // await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
  }
};

// --- Spoiler Text Component ---
const SpoilerText = ({ text }: { text: string }) => {
  const [revealed, setRevealed] = useState(false);
  const parts = text.split(/(\|\|.*?\|\|)/g);

  return (
    <p className="text-slate-300 whitespace-pre-wrap leading-relaxed text-sm">
      {parts.map((part, i) => {
        if (part.startsWith('||') && part.endsWith('||')) {
          const content = part.slice(2, -2);
          return (
            <span
              key={i}
              onClick={() => setRevealed(!revealed)}
              className={`cursor-pointer rounded px-1 transition-all mx-0.5 ${revealed ? 'bg-slate-700 text-slate-200' : 'bg-slate-800 text-transparent select-none blur-sm'
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

// --- Comment Input Component ---
interface CommentInputProps {
  onSubmit: (content: string, media?: File) => Promise<void>;
  placeholder?: string;
  autoFocus?: boolean;
  compact?: boolean;
}

const CommentInput = ({ onSubmit, placeholder = "Write a comment...", autoFocus, compact }: CommentInputProps) => {
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!content.trim() && !media) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content, media || undefined);
      setContent('');
      setMedia(null);
    } catch (error) {
      console.error('Failed to submit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (compact) {
    return (
      <div className="flex gap-2">
        <input
          autoFocus={autoFocus}
          className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500/50 transition-colors"
          placeholder={placeholder}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
        />
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          className="bg-red-600 p-2 rounded-lg disabled:opacity-50 hover:bg-red-500 transition-colors"
        >
          {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl backdrop-blur-sm">
      <div className="flex gap-4">
        <img src={currentUser.avatar} className="w-10 h-10 rounded-full border border-red-500/50" alt={currentUser.username} />
        <div className="flex-1">
          <textarea
            className="w-full bg-transparent border-none outline-none resize-none text-sm placeholder:text-slate-600"
            placeholder={placeholder}
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          {media && (
            <div className="relative mt-2 inline-block">
              <img src={URL.createObjectURL(media)} className="h-24 w-24 object-cover rounded-lg border border-slate-700" alt="Upload preview" />
              <button
                onClick={() => setMedia(null)}
                className="absolute -top-2 -right-2 bg-red-600 p-1 rounded-full hover:bg-red-500"
                aria-label="Remove image"
              >
                <X size={12} />
              </button>
            </div>
          )}
          <div className="flex justify-between items-center mt-4 border-t border-slate-800/50 pt-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-slate-500 hover:text-white transition-colors"
              aria-label="Attach image"
            >
              <ImageIcon size={20} />
              <input
                type="file"
                ref={fileInputRef}
                hidden
                accept="image/*"
                onChange={(e) => setMedia(e.target.files?.[0] || null)}
              />
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || (!content.trim() && !media)}
              className="bg-red-600 hover:bg-red-500 disabled:opacity-50 px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// // --- Reply Item Component ---
// interface ReplyItemProps {
//   reply: Reply;
//   onLike: () => void;
// }

// const ReplyItem = ({ reply, onLike }: ReplyItemProps) => (
//   <div className="flex gap-3">
//     <img src={reply.userAvatar} className="w-7 h-7 rounded-full bg-slate-800" alt={reply.username} />
//     <div className="flex-1">
//       <div className="flex items-center gap-2">
//         <span className="font-bold text-xs text-slate-300">{reply.username}</span>
//         <span className="text-[10px] text-slate-600">• Just now</span>
//       </div>
//       <p className="text-slate-400 text-sm mt-0.5">{reply.content}</p>
//       <button
//         onClick={onLike}
//         className={`mt-2 flex items-center gap-1 text-[10px] transition-colors ${
//           reply.isLiked ? 'text-red-500 font-bold' : 'text-slate-600 hover:text-red-400'
//         }`}
//       >
//         <Heart size={10} fill={reply.isLiked ? "currentColor" : "none"} />
//         {reply.likes}
//       </button>
//     </div>
//   </div>
// );




























interface ReplyItemProps {
  reply: Reply;
  onLike: () => void;
  onDelete: () => void; // Added delete handler
}

export const ReplyItem = ({ reply, onLike, onDelete }: ReplyItemProps) => {


  // const [showMenu, setShowMenu] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  console.log(showMenu);
  return (

    <div className="flex gap-3">
      <img src={reply.userAvatar} className="w-7 h-7 rounded-full bg-slate-800" alt={reply.username} />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-slate-300">{reply.username}</span>
            <span className="text-[10px] text-slate-600">• Just now</span>
          </div>

          {/* Three dots menu for deletion */}
          <div className="relative group">
            <button className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
              onClick={() => setShowMenu(!showMenu)} >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="6" r="1" />
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="18" r="1" />
              </svg>
            </button>

            {/* Dropdown menu */}

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-24 bg-slate-800 border border-slate-700 rounded-md shadow-lg transition-all duration-200 z-10">
                <button
                  onClick={() => null}
                  className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-slate-700 rounded-md transition-colors"
                >
                  Delete
                </button>
              </div>
            )
            }
          </div>
        </div>

        <p className="text-slate-400 text-sm mt-0.5">{reply.content}</p>
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















// --- Main Comments Section Component ---
const CommentsSection = ({ movieId }: { movieId: string }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Load initial comments
  React.useEffect(() => {
    const loadComments = async () => {
      try
      {
        const data = await comment_api.getComments(movieId, INITIAL_BATCH, 0);
        setComments(data);
      }
      catch (error) {
        console.error('Failed to load comments:', error);
      }
      finally {
        setIsInitialLoading(false);
      }
    };
    loadComments();
  }, [movieId]);

  const handleAddComment = async (content: string, media?: File) => {
    const newComment = await comment_api.createComment(movieId, content, media);
    setComments(prev => [newComment, ...prev]);
    setVisibleCount(prev => prev + 1);
  };

  const handleAddReply = async (commentId: string, content: string) => {
    const newReply = await comment_api.createReply(commentId, content);
    setComments(prev => prev.map(c =>
      c.id === commentId
        ? { ...c, replies: [...c.replies, newReply], replyCount: c.replyCount + 1 }
        : c
    ));
  };

  const handleToggleLike = async (commentId: string, replyId?: string) => {
    await comment_api.toggleLike(commentId, replyId);
    setComments(prev => prev.map(c => {
      if (!replyId && c.id === commentId) {
        return { ...c, isLiked: !c.isLiked, likes: c.isLiked ? c.likes - 1 : c.likes + 1 };
      }
      if (replyId && c.id === commentId) {
        return {
          ...c,
          replies: c.replies.map(r => r.id === replyId
            ? { ...r, isLiked: !r.isLiked, likes: r.isLiked ? r.likes - 1 : r.likes + 1 }
            : r)
        };
      }
      return c;
    }));
  };

  const handleDeleteComment = async (commentId: string) => {
    await comment_api.deleteComment(commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    try {
      await new Promise(r => setTimeout(r, 700));
      setVisibleCount(prev => prev + LOAD_MORE_BATCH);
    } catch (error) {
      console.error('Failed to load more:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const displayedComments = comments.slice(0, visibleCount);
  const hasMore = comments.length > visibleCount;

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
          Community Chat
          <span className="text-sm font-normal text-slate-500 bg-slate-900 px-3 py-1 rounded-full">
            {comments.length}
          </span>
        </h2>

        <div className="mb-10">
          <CommentInput onSubmit={handleAddComment} placeholder="Write a comment... use ||spoiler|| for twists!" />
        </div>

        <div className="space-y-6">
          {displayedComments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onLike={() => handleToggleLike(comment.id)}
              onReply={(content) => handleAddReply(comment.id, content)}
              onDelete={() => handleDeleteComment(comment.id)}
              onReplyLike={(replyId) => handleToggleLike(comment.id, replyId)}
            />
          ))}
        </div>

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

        {!hasMore && comments.length > 0 && (
          <div className="mt-16 text-center border-t border-slate-900 pt-8">
            <p className="text-slate-700 text-xs uppercase tracking-[0.2em]">End of Discussion</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentsSection;












