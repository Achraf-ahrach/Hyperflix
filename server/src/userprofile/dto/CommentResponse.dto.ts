export class CommentResponseDto {
  id: number
  movieId: string;
  movieTitle: string;
  content: string;
  createdAt: Date;
  likes: number;
  isLiked: boolean;
  replyCount: number;
  
}
