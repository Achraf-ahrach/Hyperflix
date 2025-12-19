"use client"

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Heart, MessageCircle, MoreVertical, Trash2, 
  Edit3, Check, X, Loader2, Image as ImageIcon, 
  ChevronDown, ChevronUp, Eye, EyeOff, Shield
} from 'lucide-react';

interface User {
  id: string;
  username: string;
  avatar: string;
  isVerified?: boolean;
}

interface CommentMedia {
  id: string;
  type: 'image';
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
  media?: CommentMedia[]; // Only images allowed for replies
  createdAt: string;
  isEdited?: boolean;
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
  isEdited?: boolean;
  isPinned?: boolean;
}

interface CommentsSectionProps {
  movieId: string;
  initialComments?: Comment[];
  totalComments?: number;
}

// Dummy users
const dummyUsers = [
  { id: 'user-1', username: 'JohnDoe', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John', isVerified: true },
  { id: 'user-2', username: 'MovieBuff87', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MovieBuff', isVerified: false },
  { id: 'user-3', username: 'CinemaLover', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cinema', isVerified: true },
  { id: 'user-4', username: 'FilmCriticPro', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Critic', isVerified: true },
  { id: 'user-5', username: 'ScreenQueen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Queen', isVerified: false },
  { id: 'user-6', username: 'DirectorView', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Director', isVerified: true },
];

// Dummy images for media
const dummyImages = [
  { id: 'img-1', url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop', alt: 'Movie scene 1' },
  { id: 'img-2', url: 'https://images.unsplash.com/photo-1489599809516-9827b6d1cf13?w-500&auto=format&fit=crop', alt: 'Cinema interior' },
  { id: 'img-3', url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500&auto=format&fit=crop', alt: 'Movie scene 2' },
  { id: 'img-4', url: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=500&auto=format&fit=crop', alt: 'Film reel' },
  { id: 'img-5', url: 'https://images.unsplash.com/photo-1595769812725-4c6564f7528b?w=500&auto=format&fit=crop', alt: 'Movie scene 3' },
];

// Dummy comments data
const dummyComments: Comment[] = [
  {
    id: 'comment-1',
    userId: 'user-2',
    username: 'MovieBuff87',
    userAvatar: dummyUsers[1].avatar,
    content: 'This movie was absolutely incredible! The cinematography and acting were top-notch. Definitely one of the best films I\'ve seen this year. The ||plot twist at the end|| completely blew my mind!',
    likes: 245,
    isLiked: false,
    replies: [
      {
        id: 'reply-1',
        userId: 'user-3',
        username: 'CinemaLover',
        userAvatar: dummyUsers[2].avatar,
        content: 'Totally agree! The ending left me speechless for hours.',
        likes: 42,
        isLiked: true,
        media: [
          { id: 'reply-img-1', type: 'image' as const, url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&auto=format&fit=crop', alt: 'Reaction image' }
        ],
        createdAt: '2024-12-18T14:30:00Z',
        isEdited: false
      },
      {
        id: 'reply-2',
        userId: 'user-4',
        username: 'FilmCriticPro',
        userAvatar: dummyUsers[3].avatar,
        content: 'As a critic, I have to say the director\'s vision was executed perfectly. The symbolism in the final scene was masterful.',
        likes: 87,
        isLiked: false,
        createdAt: '2024-12-18T15:45:00Z',
        isEdited: true
      }
    ],
    replyCount: 12,
    media: [
      { id: 'media-1', type: 'image' as const, url: dummyImages[0].url, alt: 'Movie scene screenshot' },
      { id: 'media-2', type: 'image' as const, url: dummyImages[2].url, alt: 'Another scene' }
    ],
    createdAt: '2024-12-18T10:30:00Z',
    isEdited: false,
    isPinned: true
  },
  {
    id: 'comment-2',
    userId: 'user-1',
    username: 'JohnDoe',
    userAvatar: dummyUsers[0].avatar,
    content: 'Great film, but I felt the pacing was a bit slow in the middle act. However, the character development was exceptional.',
    likes: 128,
    isLiked: true,
    replies: [
      {
        id: 'reply-3',
        userId: 'user-5',
        username: 'ScreenQueen',
        userAvatar: dummyUsers[4].avatar,
        content: 'I actually liked the slower pace! It gave time to really understand the characters. Here\'s a still I captured:',
        likes: 56,
        isLiked: false,
        media: [
          { id: 'reply-img-2', type: 'image' as const, url: 'https://images.unsplash.com/photo-1489599809516-9827b6d1cf13?w=300&auto=format&fit=crop', alt: 'Favorite scene' }
        ],
        createdAt: '2024-12-18T16:20:00Z',
        isEdited: false
      }
    ],
    replyCount: 5,
    media: [],
    createdAt: '2024-12-17T18:45:00Z',
    isEdited: false
  },
  {
    id: 'comment-3',
    userId: 'user-6',
    username: 'DirectorView',
    userAvatar: dummyUsers[5].avatar,
    content: 'From a director\'s perspective, the use of lighting in this film was revolutionary. The way they used shadows to convey emotion was something I\'ll study for years.',
    likes: 312,
    isLiked: false,
    replies: [],
    replyCount: 8,
    media: [
      { id: 'media-3', type: 'image' as const, url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500&auto=format&fit=crop', alt: 'Lighting example' }
    ],
    createdAt: '2024-12-16T09:15:00Z',
    isEdited: false
  },
  {
    id: 'comment-4',
    userId: 'user-4',
    username: 'FilmCriticPro',
    userAvatar: dummyUsers[3].avatar,
    content: 'The soundtrack alone deserves an award. Combined with the visual storytelling, it creates an immersive experience that\'s hard to forget. ||The final track during the climax|| was pure genius.',
    likes: 189,
    isLiked: true,
    replies: [
      {
        id: 'reply-4',
        userId: 'user-2',
        username: 'MovieBuff87',
        userAvatar: dummyUsers[1].avatar,
        content: 'Couldn\'t agree more! That score haunts me in the best way possible.',
        likes: 34,
        isLiked: true,
        createdAt: '2024-12-17T20:30:00Z',
        isEdited: false
      }
    ],
    replyCount: 3,
    media: [
      { id: 'media-4', type: 'image' as const, url: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=500&auto=format&fit=crop', alt: 'Soundtrack cover' }
    ],
    createdAt: '2024-12-15T14:20:00Z',
    isEdited: false
  },
  {
    id: 'comment-5',
    userId: 'user-5',
    username: 'ScreenQueen',
    userAvatar: dummyUsers[4].avatar,
    content: 'Just watched it for the third time. Notices new details every viewing! The costume design is absolutely stunning - every outfit tells a story.',
    likes: 96,
    isLiked: false,
    replies: [
      {
        id: 'reply-5',
        userId: 'user-1',
        username: 'JohnDoe',
        userAvatar: dummyUsers[0].avatar,
        content: 'Third time? That\'s dedication! I noticed the costume details too, especially in the ballroom scene.',
        likes: 21,
        isLiked: false,
        media: [
          { id: 'reply-img-3', type: 'image' as const, url: 'https://images.unsplash.com/photo-1595769812725-4c6564f7528b?w=300&auto=format&fit=crop', alt: 'Costume detail' }
        ],
        createdAt: '2024-12-16T11:45:00Z',
        isEdited: false
      },
      {
        id: 'reply-6',
        userId: 'user-3',
        username: 'CinemaLover',
        userAvatar: dummyUsers[2].avatar,
        content: 'The attention to detail is what makes rewatches so rewarding!',
        likes: 18,
        isLiked: false,
        createdAt: '2024-12-16T12:30:00Z',
        isEdited: false
      }
    ],
    replyCount: 6,
    media: [],
    createdAt: '2024-12-14T19:10:00Z',
    isEdited: false
  }
];

const CommentsSection: React.FC<CommentsSectionProps> = ({ 
  movieId, 
  initialComments = dummyComments, 
  totalComments = 347 
}) => {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'oldest'>('newest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [commentMedia, setCommentMedia] = useState<File[]>([]);
  const [replyMedia, setReplyMedia] = useState<File[]>([]);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [showSpoilers, setShowSpoilers] = useState<Set<string>>(new Set());
  const [uploadError, setUploadError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);

  const currentUser: User = dummyUsers[0]; // JohnDoe is current user

  const COMMENTS_PER_PAGE = 5;

  useEffect(() => {
    if (page > 1) {
      loadMoreComments();
    }
  }, [page]);

  const loadMoreComments = async () => {
    if (!hasMore || isLoading) return;
    
    setIsLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In real app, this would be an API call
      // const response = await fetch(`/api/comments?page=${page}&limit=${COMMENTS_PER_PAGE}`);
      
      // For demo, just add more dummy comments
      const moreDummyComments: Comment[] = [
        {
          id: `comment-${Date.now()}-1`,
          userId: 'user-7',
          username: 'FilmStudent22',
          userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=FilmStudent',
          content: 'Analyzed this for my film class. The use of color theory is textbook perfect!',
          likes: 67,
          isLiked: false,
          replies: [],
          replyCount: 0,
          createdAt: '2024-12-13T08:30:00Z',
        },
        {
          id: `comment-${Date.now()}-2`,
          userId: 'user-8',
          username: 'MovieNightGuru',
          userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guru',
          content: 'Perfect movie night choice! The emotional journey is incredible.',
          likes: 45,
          isLiked: false,
          replies: [],
          replyCount: 2,
          media: [{ id: 'media-5', type: 'image' as const, url: dummyImages[4].url, alt: 'Movie night setup' }],
          createdAt: '2024-12-12T21:15:00Z',
        }
      ];
      
      setComments(prev => [...prev, ...moreDummyComments]);
      setHasMore(false); // Demo: only load once
    } catch (error) {
      console.error('Failed to load more comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() && commentMedia.length === 0) {
      setUploadError('Please add text or an image');
      return;
    }

    setIsSubmitting(true);
    setUploadError('');
    
    try {
      // Validate images only
      const invalidFiles = commentMedia.filter(file => !file.type.startsWith('image/'));
      if (invalidFiles.length > 0) {
        setUploadError('Only image files are allowed');
        return;
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      const newCommentData: Comment = {
        id: `comment-${Date.now()}`,
        userId: currentUser.id,
        username: currentUser.username,
        userAvatar: currentUser.avatar,
        content: newComment,
        likes: 0,
        isLiked: false,
        replies: [],
        replyCount: 0,
        media: commentMedia.length > 0 ? [
          {
            id: `media-${Date.now()}`,
            type: 'image',
            url: URL.createObjectURL(commentMedia[0]), // In real app, this would be uploaded URL
            alt: 'User uploaded image'
          }
        ] : [],
        createdAt: new Date().toISOString(),
        isEdited: false
      };

      setComments(prev => [newCommentData, ...prev]);
      setNewComment('');
      setCommentMedia([]);
    } catch (error) {
      console.error('Failed to add comment:', error);
      setUploadError('Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddReply = async (commentId: string) => {
    if (!replyContent.trim() && replyMedia.length === 0) {
      setUploadError('Please add text or an image');
      return;
    }

    setIsSubmitting(true);
    setUploadError('');
    
    try {
      // Validate images only for replies
      const invalidFiles = replyMedia.filter(file => !file.type.startsWith('image/'));
      if (invalidFiles.length > 0) {
        setUploadError('Only image files are allowed for replies');
        return;
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      const newReply: Reply = {
        id: `reply-${Date.now()}`,
        userId: currentUser.id,
        username: currentUser.username,
        userAvatar: currentUser.avatar,
        content: replyContent,
        likes: 0,
        isLiked: false,
        media: replyMedia.length > 0 ? [
          {
            id: `reply-img-${Date.now()}`,
            type: 'image',
            url: URL.createObjectURL(replyMedia[0]), // In real app, this would be uploaded URL
            alt: 'Reply image'
          }
        ] : [],
        createdAt: new Date().toISOString(),
        isEdited: false
      };

      setComments(prev => 
        prev.map(comment => 
          comment.id === commentId 
            ? { 
                ...comment, 
                replies: [newReply, ...comment.replies],
                replyCount: comment.replyCount + 1
              }
            : comment
        )
      );

      setReplyContent('');
      setReplyMedia([]);
      setReplyingTo(null);
      setExpandedReplies(prev => new Set(prev).add(commentId));
    } catch (error) {
      console.error('Failed to add reply:', error);
      setUploadError('Failed to post reply. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleReplies = (commentId: string) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedReplies(newExpanded);
  };

  const handleLike = async (commentId: string, isReply: boolean = false, replyId?: string) => {
    try {
      if (isReply && replyId) {
        setComments(prev =>
          prev.map(comment =>
            comment.id === commentId
              ? {
                  ...comment,
                  replies: comment.replies.map(reply =>
                    reply.id === replyId
                      ? {
                          ...reply,
                          likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1,
                          isLiked: !reply.isLiked
                        }
                      : reply
                  )
                }
              : comment
          )
        );
      } else {
        setComments(prev =>
          prev.map(comment =>
            comment.id === commentId
              ? {
                  ...comment,
                  likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
                  isLiked: !comment.isLiked
                }
              : comment
          )
        );
      }
    } catch (error) {
      console.error('Failed to like:', error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isReply: boolean = false) => {
    const files = Array.from(e.target.files || []);
    
    // Validate only images
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length === 0) {
      setUploadError('Only image files (JPEG, PNG, GIF, WebP) are allowed');
      return;
    }

    if (validFiles.length > 1) {
      setUploadError('Only one image allowed per comment/reply');
      return;
    }

    setUploadError('');
    
    if (isReply) {
      setReplyMedia(validFiles.slice(0, 1));
    } else {
      setCommentMedia(validFiles.slice(0, 1));
    }
  };

  const removeMedia = (isReply: boolean = false) => {
    if (isReply) {
      setReplyMedia([]);
    } else {
      setCommentMedia([]);
    }
    setUploadError('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: diffInDays > 365 ? 'numeric' : undefined
    });
  };

  const MediaPreview = ({ files, onRemove, isReply = false }: { 
    files: File[]; 
    onRemove: () => void; 
    isReply?: boolean;
  }) => (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-400">
          {isReply ? 'Reply image' : 'Comment image'}
        </span>
        <button
          onClick={onRemove}
          className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
        >
          <X size={14} />
          Remove
        </button>
      </div>
      <div className="relative">
        <div className="w-full max-w-xs rounded-lg overflow-hidden bg-slate-800">
          <img
            src={URL.createObjectURL(files[0])}
            alt="Preview"
            className="w-full h-auto max-h-48 object-cover"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
        <Shield size={12} />
        <span>Only images allowed (max 1)</span>
      </div>
    </div>
  );

  const CommentItem = ({ 
    comment, 
    isReply = false, 
    parentId = '' 
  }: { 
    comment: Comment | Reply; 
    isReply?: boolean;
    parentId?: string;
  }) => {
    const isCurrentUser = comment.userId === currentUser.id;
    const hasSpoiler = comment.content.includes('||');
    const showSpoiler = showSpoilers.has(comment.id);

    return (
      <div className={`flex gap-4 ${!isReply ? 'pb-6' : 'pb-4'}`}>
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 overflow-hidden">
              <img 
                src={comment.userAvatar}
                alt={comment.username}
                className="w-full h-full object-cover"
              />
            </div>
            {!isReply && dummyUsers.find(u => u.id === comment.userId)?.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-full">
                <Check size={10} />
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-white text-sm">{comment.username}</span>
              {dummyUsers.find(u => u.id === comment.userId)?.isVerified && (
                <span className="text-blue-400 text-xs bg-blue-900/30 px-1.5 py-0.5 rounded">✓ Verified</span>
              )}
              {comment.isEdited && (
                <span className="text-xs text-slate-500">(edited)</span>
              )}
              <span className="text-slate-500 text-sm">· {formatDate(comment.createdAt)}</span>
              {hasSpoiler && (
                <span className="px-2 py-0.5 bg-red-900/30 text-red-400 text-xs rounded-full flex items-center gap-1">
                  <Eye size={10} />
                  Spoiler
                </span>
              )}
            </div>

            {/* Actions Menu */}
            {isCurrentUser && !isReply && (
              <div className="relative">
                <button
                  onClick={() => setActiveMenu(activeMenu === comment.id ? null : comment.id)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all"
                >
                  <MoreVertical size={16} />
                </button>
                
                {activeMenu === comment.id && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-20">
                    <button
                      onClick={() => {
                        if ('replyCount' in comment) {
                          setEditingComment(comment.id);
                          setEditContent(comment.content);
                        }
                        setActiveMenu(null);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white transition-all text-sm"
                    >
                      <Edit3 size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => setActiveMenu(null)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-slate-700 hover:text-red-300 transition-all text-sm"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content with Spoiler Support */}
          <div className="mb-3">
            {hasSpoiler && !showSpoiler ? (
              <div className="relative">
                <div className="blur-sm select-none">
                  <p className="text-slate-300">{comment.content}</p>
                </div>
                <button
                  onClick={() => setShowSpoilers(prev => new Set(prev).add(comment.id))}
                  className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-900/80 backdrop-blur-sm rounded-lg"
                >
                  <Eye size={16} />
                  <span className="text-sm font-medium">Show Spoiler</span>
                </button>
              </div>
            ) : (
              <>
                <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                {hasSpoiler && (
                  <button
                    onClick={() => {
                      const newSet = new Set(showSpoilers);
                      newSet.delete(comment.id);
                      setShowSpoilers(newSet);
                    }}
                    className="flex items-center gap-1 text-slate-500 text-xs mt-2 hover:text-slate-400"
                  >
                    <EyeOff size={12} />
                    Hide spoiler
                  </button>
                )}
              </>
            )}
          </div>

          {/* Media */}
          {comment.media && comment.media.length > 0 && (
            <div className={`mb-3 ${isReply ? 'max-w-xs' : ''}`}>
              <img
                src={comment.media[0].url}
                alt={comment.media[0].alt || 'Comment image'}
                className="rounded-lg max-h-64 w-auto object-contain bg-slate-800/50 p-1"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => handleLike(
                parentId || comment.id, 
                isReply, 
                isReply ? comment.id : undefined
              )}
              className={`flex items-center gap-2 transition-all ${
                comment.isLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'
              }`}
            >
              <Heart size={16} fill={comment.isLiked ? 'currentColor' : 'none'} />
              <span className="text-sm font-medium">{comment.likes}</span>
            </button>
            
            {!isReply && (
              <button
                onClick={() => setReplyingTo({ id: comment.id, username: comment.username })}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-all"
              >
                <MessageCircle size={16} />
                <span className="text-sm font-medium">Reply</span>
              </button>
            )}
          </div>

          {/* Reply Input */}
          {!isReply && replyingTo?.id === comment.id && (
            <div className="mt-4 pl-4 border-l-2 border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm text-slate-400">Replying to</span>
                <span className="text-sm text-red-400">@{replyingTo.username}</span>
              </div>
              
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write your reply... (Text and/or 1 image only)"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-3 text-sm"
                rows={2}
              />
              
              {uploadError && (
                <div className="text-red-400 text-sm mb-2 bg-red-900/20 p-2 rounded">
                  {uploadError}
                </div>
              )}
              
              {replyMedia.length > 0 && (
                <MediaPreview files={replyMedia} onRemove={() => removeMedia(true)} isReply />
              )}

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => replyFileInputRef.current?.click()}
                    disabled={replyMedia.length > 0}
                    className={`p-2 rounded-lg transition-all ${
                      replyMedia.length > 0 
                        ? 'text-slate-600 cursor-not-allowed' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                    title={replyMedia.length > 0 ? "Only one image allowed" : "Add image"}
                  >
                    <ImageIcon size={18} />
                  </button>
                  <input
                    ref={replyFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, true)}
                    className="hidden"
                  />
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Shield size={12} />
                    <span>Images only</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyContent('');
                      setReplyMedia([]);
                      setUploadError('');
                    }}
                    className="px-4 py-2 text-slate-400 hover:text-white rounded-lg transition-all text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleAddReply(comment.id)}
                    disabled={(!replyContent.trim() && replyMedia.length === 0) || isSubmitting}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium"
                  >
                    {isSubmitting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                    Reply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-8 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Movie Discussions</h2>
              <p className="text-slate-400">{totalComments.toLocaleString()} comments</p>
            </div>
            
            {/* Sort Options */}
            <div className="flex gap-2">
              {['newest', 'popular', 'oldest'].map((sort) => (
                <button
                  key={sort}
                  onClick={() => setSortBy(sort as typeof sortBy)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                    sortBy === sort
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {sort.charAt(0).toUpperCase() + sort.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Add Comment */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 overflow-hidden">
                  <img 
                    src={currentUser.avatar}
                    alt={currentUser.username}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white font-semibold">{currentUser.username}</span>
                  {currentUser.isVerified && (
                    <span className="text-blue-400 text-sm bg-blue-900/30 px-1.5 py-0.5 rounded">✓ Verified</span>
                  )}
                </div>
                
                <textarea
                  value={newComment}
                  onChange={(e) => {
                    setNewComment(e.target.value);
                    setUploadError('');
                  }}
                  placeholder="Share your thoughts about this movie... Use || for spoilers"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none text-sm"
                  rows={3}
                />
                
                {uploadError && (
                  <div className="text-red-400 text-sm mt-2 bg-red-900/20 p-2 rounded">
                    {uploadError}
                  </div>
                )}
                
                {/* Media Preview */}
                {commentMedia.length > 0 && (
                  <MediaPreview files={commentMedia} onRemove={() => removeMedia(false)} />
                )}

                {/* Toolbar */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={commentMedia.length > 0}
                      className={`p-2 rounded-lg transition-all ${
                        commentMedia.length > 0 
                          ? 'text-slate-600 cursor-not-allowed' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                      title={commentMedia.length > 0 ? "Only one image allowed" : "Add image"}
                    >
                      <ImageIcon size={20} />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e)}
                      className="hidden"
                    />
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Shield size={14} />
                      <span>Text and/or 1 image only</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setNewComment('');
                        setCommentMedia([]);
                        setUploadError('');
                      }}
                      className="px-4 py-2 text-slate-400 hover:text-white rounded-lg transition-all text-sm font-medium"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleAddComment}
                      disabled={(!newComment.trim() && commentMedia.length === 0) || isSubmitting}
                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-slate-700 disabled:to-slate-800 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-lg transition-all flex items-center gap-2 text-sm"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          Post Comment
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-6">
          {comments.map((comment) => (
            <div 
              key={comment.id} 
              className={`bg-slate-900/50 backdrop-blur-sm border ${
                comment.isPinned ? 'border-red-500/30' : 'border-slate-800'
              } rounded-xl p-6`}
            >
              {comment.isPinned && (
                <div className="flex items-center gap-2 text-red-400 text-sm mb-3">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  Pinned Comment
                </div>
              )}
              
              <CommentItem comment={comment} />

              {/* Replies Section */}
              {comment.replyCount > 0 && (
                <div className="mt-4 ml-14">
                  {/* Show/Hide Replies */}
                  <button
                    onClick={() => handleToggleReplies(comment.id)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-all mb-4 text-sm font-medium"
                  >
                    {expandedReplies.has(comment.id) ? (
                      <>
                        <ChevronUp size={16} />
                        Hide {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
                      </>
                    ) : (
                      <>
                        <ChevronDown size={16} />
                        Show {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
                      </>
                    )}
                  </button>

                  {/* Replies List */}
                  {expandedReplies.has(comment.id) && (
                    <div className="space-y-4 border-l-2 border-slate-700 pl-4">
                      {comment.replies.map((reply) => (
                        <CommentItem 
                          key={reply.id} 
                          comment={reply} 
                          isReply 
                          parentId={comment.id}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="text-center mt-8">
            <button
              onClick={loadMoreComments}
              disabled={isLoading}
              className="bg-slate-800/50 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-lg transition-all flex items-center gap-2 mx-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ChevronDown size={18} />
                  Load More Comments
                </>
              )}
            </button>
          </div>
        )}

        {/* No more comments */}
        {!hasMore && comments.length > 5 && (
          <div className="text-center mt-8 py-6 border-t border-slate-800">
            <p className="text-slate-500 text-sm">No more comments to load</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentsSection;