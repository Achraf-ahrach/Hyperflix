

export interface Movie {
  id: number;
  title: string;
  year: number;
  posterUrl: string;
  rating: number;
  watchedDate?: string;
}

export interface Comment {
  id: number;
  movieTitle: string;
  content: string;
  createdAt: string;
  likes: number;
}
