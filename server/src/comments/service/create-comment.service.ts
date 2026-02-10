// comments.service.ts
import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { comments, users, commentMedia, movies } from '../../database/schema';
import { DRIZZLE } from 'src/database/database.module';
import { drizzle } from 'drizzle-orm/node-postgres';
import { MoviesService, NormalizedMovie } from 'src/movies/movies.service';

interface CreateCommentDto {
  movieId: string;
  userId: number;
  content: string;
  parentId?: number;
  mediaFile?: Express.Multer.File;
}

@Injectable()
export class CreateCommentsService {

      constructor(
        @Inject(DRIZZLE) private readonly db: ReturnType<typeof drizzle>,
        private readonly moviesService: MoviesService,
      ) {}
  async createComment(dto: CreateCommentDto) {
    const { movieId, userId, content, parentId, mediaFile } = dto;

    // Verify movie exists
    const movie = await this.db
      .select({ id: movies.id })
      .from(movies)
      .where(eq(movies.id, movieId))
      .limit(1);

    if (movie.length === 0) {
      const new_movie : NormalizedMovie | null = await this.moviesService.getMovie(movieId);
      if (!new_movie) {
        throw new NotFoundException('Movie not found');
      }
      else {
        await this.db.insert(movies).values({
          id: new_movie.imdb_code,
          title: new_movie.title,
          productionYear: new_movie.year,
          // imdbRating: new_movie.rating,
          coverImageUrl: new_movie.thumbnail,
        });
      }

    }

    // Get user info
    const user = await this.db
      .select({
        id: users.id,
        username: users.username,
        avatar: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      throw new NotFoundException('User not found');
    }

    // If parentId is provided, verify parent comment exists
    if (parentId) {
      const parentComment = await this.db
        .select({ id: comments.id })
        .from(comments)
        .where(eq(comments.id, parentId))
        .limit(1);

      if (parentComment.length === 0) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    // Create comment
    const [newComment] : any = await this.db
      .insert(comments)
      .values({
        movieId,
        userId,
        content,
        parentId: parentId || null,
      })
      .returning();

    // Handle media upload if present
    let mediaData : any = [];
    if (mediaFile) {
      const mediaType = mediaFile.mimetype.startsWith('video/') ? 'video' : 'image';
      const mediaUrl = `/comments_public/${mediaFile.filename}`;

      const [media] = await this.db
        .insert(commentMedia)
        .values({
          commentId: newComment.id,
          type: mediaType,
          url: mediaUrl,
        })
        .returning();

      mediaData = [
        {
          id: media.id,
          type: media.type,
          url: media.url,
        },
      ];
    }

    // Return formatted response
    
    return {
      id: newComment.id,
      userId: user[0].id,
      username: user[0].username,
      userAvatar: user[0].avatar,
      content: newComment.content,
      likes: 0,
      isLiked: false,
      replies: [],
      replyCount: 0,
      media: mediaData,
      createdAt: newComment.createdAt.toISOString(),
    };
  }
}