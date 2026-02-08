

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
  id: number;
  userId: number;
  username: string;
  userAvatar: string;
  content: string;
  likes: number;
  isLiked: boolean;
  media?: CommentMedia[];
  createdAt: string;
}

export interface Comment {
  id: number;
  userId: number;
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