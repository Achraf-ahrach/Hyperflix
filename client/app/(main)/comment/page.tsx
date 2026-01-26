"use client";

import React, { useState, useRef, useContext } from 'react';
import {
  Send, Heart, MessageCircle, MoreVertical, Trash2,
  X, Loader2, ImageIcon, ChevronDown
} from 'lucide-react';
import { comment_api, INITIAL_BATCH } from './utils';
import { CommentInput } from './components/CommentInput';
import { CommentItem } from './components/CommentItem';
import { Comment } from './types/types';

interface CommentInputProps {
  onSubmit: (content: string, media?: File) => Promise<void>;
  placeholder?: string;
  autoFocus?: boolean;
  compact?: boolean;
}


// --- Main Comments Section Component ---
export const CommentsSection = ({ movieId }: { movieId: string }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [page, setPage] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  console.log((process.env.BACKEND_URL))
  // Load initial comments
  React.useEffect(() => {
    const loadComments = async () => {
      try
      {
        const data = await comment_api.getComments(movieId, INITIAL_BATCH, page+1);
        console.log('Initial load:', data);
        setComments(data.comments);
        setPage(data.page);
        setTotal(data.total);
      } catch (error) {
        console.error('Failed to load comments:', error);
      } finally {
        setIsInitialLoading(false);
      }
    };
    loadComments();
  }, [movieId]);

  const handleAddComment = async (content: string, media?: File) => {
    try {
    const newComment = await comment_api.createComment(movieId, content, media);
    setComments(prev => [newComment, ...prev]);
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleAddReply = async (commentId: number, content: string) => {
    try {
      const newReply = await comment_api.createReply(commentId, content);
      setComments(prev => prev.map(c =>
        c.id === commentId
          ? { ...c, replies: [...c.replies, newReply], replyCount: c.replyCount + 1 }
          : c
      ));
    } catch (error) {
      console.error('Failed to add reply:', error);
    }
  };

  const handleToggleLike = async (commentId: number, replyId?: number) => {
    const result : boolean =  await comment_api.toggleLike(commentId, replyId);
    if (result)
    {

      setComments(prev => prev.map(c => {
        if (!replyId && c.id === commentId) {
          return { ...c, isLiked: !c.isLiked, likes: c.isLiked ?  Number(c.likes) - 1 : Number(c.likes) + 1 };
        }
        if (replyId && c.id === commentId) {
          return {
            ...c,
            replies: c.replies.map(r => r.id === replyId
              ? { ...r, isLiked: !r.isLiked, likes: r.isLiked ? Number(r.likes) - 1 : Number(r.likes) + 1 }
              : r)
          };
        }
        return c;
      }));
    }
  };

  const handleDeleteComment = async (commentId: number, replyId?: number) => {
    const result : boolean = await comment_api.deleteComment(commentId, replyId);
    if (result) {
      if (!replyId) {
      setComments(prev => prev.filter(c => c.id !== commentId));
    }else {
      setComments(prev => prev.map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            replies: c.replies.filter(r => r.id !== replyId),
            replyCount: c.replyCount - 1
          };
        }
        return c;
      }));
  }}
};

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    try {
      const data = await comment_api.getComments(movieId, INITIAL_BATCH, page+1);
      console.log(page)
      console.log(
      'prev last:',
      comments.at(-1)?.id,
      'new first:',
      data.comments[0]?.id
    );
      setComments(prevComments => [
        ...prevComments,
        ...data.comments,
      ]);
      setPage(data.page);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to load more:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const displayedComments = comments;
  const hasMore = comments.length < total;

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-slate-200 font-sans p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
          Comments
          <span className="text-sm font-normal text-slate-500 bg-slate-900 px-3 py-1 rounded-full">
            {total}
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
              onReplyDelete={(replyId) => handleDeleteComment(comment.id, replyId)}
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
