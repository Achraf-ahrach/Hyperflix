// comments.service.ts
import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, desc, isNull, inArray, sql, and } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.module';
import { comments, users, commentLikes, commentMedia } from '../../database/schema';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';

interface PaginationParams {
  page: number;
  limit: number;
  movieId: string;
  currentUserId?: number;
}

interface MediaItem {
  id: number;
  type: string;
  url: string;
}

export interface CommentWithUser {
  id: number;
  userId: number;
  username: string | null;
  userAvatar: string | null;
  content: string;
  likes: number;
  isLiked: boolean;
  replies?: CommentWithUser[];
  replyCount: number;
  media: MediaItem[];
  createdAt: string;
}

@Injectable()
export class CommentsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: ReturnType<typeof drizzle>,
  ) {}

  async getCommentsByMovie(params: PaginationParams) {
    const { page, limit, movieId, currentUserId } = params;
    const offset = (page - 1) * limit;

    // Step 1: Get top-level comments
    const topLevelComments = await this.db
      .select({
        id: comments.id,
        userId: comments.userId,
        username: users.username,
        userAvatar: users.avatarUrl,
        content: comments.content,
        createdAt: comments.createdAt,
        likes: sql<number>`COALESCE(COUNT(DISTINCT ${commentLikes.id}), 0)`.as('likes'),
        isLiked: currentUserId
          ? sql<boolean>`EXISTS(
              SELECT 1 FROM comment_likes 
              WHERE comment_id = ${comments.id} 
              AND user_id = ${currentUserId}
            )`.as('isLiked')
          : sql<boolean>`false`.as('isLiked'),
        replyCount: sql<number>`(
          SELECT COUNT(*) 
          FROM comments AS replies 
          WHERE replies.parent_id = ${comments.id}
        )`.as('replyCount'),
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .leftJoin(commentLikes, eq(comments.id, commentLikes.commentId))
      .where(
        sql`${comments.movieId} = ${movieId} AND ${comments.parentId} IS NULL`
      )
      .groupBy(comments.id, users.id)
      .orderBy(desc(comments.createdAt), desc(comments.id)) //
      .limit(limit)
      .offset(offset);

    if (topLevelComments.length === 0) {
      return {
        comments: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    const commentIds = topLevelComments.map((c) => c.id);

    // Step 2: Get replies
    const replies = await this.db
      .select({
        id: comments.id,
        parentId: comments.parentId,
        userId: comments.userId,
        username: users.username,
        userAvatar: users.avatarUrl,
        content: comments.content,
        createdAt: comments.createdAt,
        likes: sql<number>`COALESCE(COUNT(DISTINCT ${commentLikes.id}), 0)`.as('likes'),
        isLiked: currentUserId
          ? sql<boolean>`EXISTS(
              SELECT 1 FROM comment_likes 
              WHERE comment_id = ${comments.id} 
              AND user_id = ${currentUserId}
            )`.as('isLiked')
          : sql<boolean>`false`.as('isLiked'),
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .leftJoin(commentLikes, eq(comments.id, commentLikes.commentId))
      .where(inArray(comments.parentId, commentIds))
      .groupBy(comments.id, users.id, comments.parentId)
      .orderBy(desc(comments.createdAt));

    // Step 3: Get all media for top-level comments and replies
    const allCommentIds = [
      ...commentIds,
      ...replies.map((r) => r.id),
    ];

    const mediaItems = await this.db
      .select({
        commentId: commentMedia.commentId,
        id: commentMedia.id,
        type: commentMedia.type,
        url: commentMedia.url,
      })
      .from(commentMedia)
      .where(inArray(commentMedia.commentId, allCommentIds));

    // Step 4: Group media by comment ID
    const mediaMap = new Map<number, MediaItem[]>();
    mediaItems.forEach((media) => {
      if (!mediaMap.has(media.commentId)) {
        mediaMap.set(media.commentId, []);
      }
      mediaMap.get(media.commentId)!.push({
        id: media.id,
        type: media.type,
        url: media.url,
      });
    });

    // Step 5: Map comments with media
    const commentsMap = new Map<number, CommentWithUser>();

    topLevelComments.forEach((comment) => {
      commentsMap.set(comment.id, {
        ...comment,
        createdAt: comment.createdAt.toISOString(),
        replies: [],
        isLiked: Boolean(comment.isLiked),
        media: mediaMap.get(comment.id) || [],
      });
    });

    replies.forEach((reply) => {
      const parentComment = commentsMap.get(reply.parentId!);
      if (parentComment) {
        parentComment.replies!.push({
          id: reply.id,
          userId: reply.userId,
          username: reply.username,
          userAvatar: reply.userAvatar,
          content: reply.content,
          likes: reply.likes,
          isLiked: Boolean(reply.isLiked),
          createdAt: reply.createdAt.toISOString(),
          replyCount: 0,
          media: mediaMap.get(reply.id) || [],
        });
      }
    });

    // Step 6: Get total count
    const totalResult = await this.db
      .select({ count: sql<number>`COUNT(*)`.as('count') })
      .from(comments)
      .where(
        sql`${comments.movieId} = ${movieId} AND ${comments.parentId} IS NULL`
      );

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      comments: Array.from(commentsMap.values()),
      total,
      page,
      limit,
      totalPages,
    };
  }


  async toggleLike(commentId: number, userId: number) {
    // Verify comment exists
    const comment = await this.db
      .select({ id: comments.id })
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);

    if (comment.length === 0) {
      throw new NotFoundException('Comment not found');
    }

    // Check if user already liked this comment
    const existingLike = await this.db
      .select({ id: commentLikes.id })
      .from(commentLikes)
      .where(
        and(
          eq(commentLikes.commentId, commentId),
          eq(commentLikes.userId, userId)
        )
      )
      .limit(1);

    //Toggle like
    if (existingLike.length > 0) {
      // Unlike: Remove the like
      await this.db
        .delete(commentLikes)
        .where(
          and(
            eq(commentLikes.commentId, commentId),
            eq(commentLikes.userId, userId)
          )
        );

      return {
        success: true,
        isLiked: false,
        message: 'Comment unliked',
      };
    } else {
      // Like: Add the like
      await this.db
        .insert(commentLikes)
        .values({
          commentId,
          userId,
        });

      return {
        success: true,
        isLiked: true,
        message: 'Comment liked',
      };
    }
  }

  async deleteComment(commentId: number, userId: number) {
    // Get comment and verify it exists
    const comment = await this.db
      .select({
        id: comments.id,
        userId: comments.userId,
        parentId: comments.parentId,
      })
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);

    if (comment.length === 0) {
      throw new NotFoundException('Comment not found');
    }

    // Verify user owns this comment
    if (comment[0].userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

      await this.db
        .delete(comments)
        .where(eq(comments.id, commentId));

      return {
        success: true,
        message: 'Comment deleted',
      };
    
  }
}

