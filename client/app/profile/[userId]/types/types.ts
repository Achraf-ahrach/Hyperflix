export interface Movie {
  id: string;
  title: string;
  year: number;
  rating: number;
  posterUrl: string;
}

export interface User {
  id: number;
  username: string;

  avatarUrl: string | null;
  watchedCount: number;
  commentsCount: number;
}



export interface Comment {
  id: number;
  movieId: number;
  movieTitle: string;
  moviePosterUrl: string;
  content: string;
  rating: number;
  createdAt: string;
}




export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export type TabType = 'watched' | 'watchLater' | 'comments';