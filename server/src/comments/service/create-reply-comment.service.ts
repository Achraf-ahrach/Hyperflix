




// comments.service.ts
import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.module';
import { comments, users, movies } from '../../database/schema';
import { drizzle } from 'drizzle-orm/node-postgres';

interface CreateReplyDto {
  commentId: number;
  userId: number;
  content: string;
}

export interface Reply {
  id: number;
  userId: number;
  username: string | null;
  userAvatar: string | null;
  content: string;
  likes: number;
  isLiked: boolean;
  createdAt: string;
}

@Injectable()
export class CreateReplyCommentsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: ReturnType<typeof drizzle>,
  ) {}

  async createReply(dto: CreateReplyDto): Promise<Reply> {
    const { commentId, userId, content } = dto;

    // Step 1: Verify parent comment exists and get its movieId
    const parentComment = await this.db
      .select({
        id: comments.id,
        movieId: comments.movieId,
        parentId: comments.parentId,
      })
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);

    if (parentComment.length === 0) {
      throw new NotFoundException('Comment not found');
    }

    // Step 2: Prevent nested replies (replies to replies)
    // Only allow replies to top-level comments
    if (parentComment[0].parentId !== null) {
      throw new BadRequestException('Cannot reply to a reply. Please reply to the parent comment.');
    }

    // Step 3: Get user info
    const user = await this.db
      .select({
        id: users.id,
        username: users.username,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      throw new NotFoundException('User not found');
    }

    // Step 4: Create the reply
    const [newReply] : any = await this.db
      .insert(comments)
      .values({
        movieId: parentComment[0].movieId,
        userId,
        content,
        parentId: commentId,
      })
      .returning();

    // Step 5: Return formatted response
    return {
      id: newReply.id,
      userId: user[0].id,
      username: user[0].username,
      userAvatar: user[0].avatarUrl,
      content: newReply.content,
      likes: 0,
      isLiked: false,
      createdAt: newReply.createdAt.toISOString(),
    };
  }


}