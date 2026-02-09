

// src/users/users.repository.ts
import { Inject, Injectable } from '@nestjs/common';
import { commentLikes, commentMedia, mailTokens, users } from '../../database/schema';
import { DRIZZLE } from '../../database/database.module';
import { drizzle } from 'drizzle-orm/node-postgres'

import { eq, desc, sql, inArray } from 'drizzle-orm';
import { comments, movies } from '../../database/schema';
import { CommentResponseDto } from '../dto/CommentResponse.dto';
import { MovieResponseDto } from '../dto/MovieResponse.dto';
import { watchedMovies } from 'src/database/schema/movies-watched';

interface MediaItem {
    id: number;
    type: string;
    url: string;
}

export interface CommentWithUser {
    id: number;
    userId: number;
    username: string | null;
    content: string;
    likes: number;
    media: MediaItem[];
    createdAt: Date;
}

@Injectable()
export class UserCommentsRepository {
    constructor(
        @Inject(DRIZZLE) private readonly db: ReturnType<typeof drizzle>,
    ) { }


    async findById(id: number) {
        const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
        return result[0] ?? null;
    }

    async getUserCommentsByPage(
        userId: number,
        page: number,
        limit: number
    ) {
        const offset = (page - 1) * limit;
        const cleanLimit = Math.max(1, Number(limit));
        console.log(`Fetching comments for userId: ${userId}, page: ${page}, limit: ${cleanLimit} offset: ${offset}`);

        const topLevelComments = await this.db
            .select({
                id: comments.id,
                userId: comments.userId,
                username: users.username,
                content: comments.content,
                createdAt: comments.createdAt,
                likes: sql<number>`COALESCE(COUNT(DISTINCT ${commentLikes.id}), 0)`.as('likes'),

                movieId: movies.id,
                movieTitle: movies.title,
            })
            .from(comments)
            .innerJoin(users, eq(comments.userId, users.id))
            .leftJoin(commentLikes, eq(comments.id, commentLikes.commentId))
            .innerJoin(movies, eq(comments.movieId, movies.id))
            .where(
                sql`${comments.parentId} IS NULL AND ${users.id} = ${userId}`
            )
            .groupBy(comments.id, users.id, movies.id) //
            .orderBy(desc(comments.createdAt), desc(comments.id)) //
            .limit(cleanLimit)
            .offset(offset);
        // console.log(`fadsfsa comments for userId: ${userId}, page: ${page}, limit: ${cleanLimit} offset: ${offset}`);

        const commentIds = topLevelComments.map((c) => c.id);
        const allCommentIds = [
            ...commentIds,
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

        const commentsArray: CommentWithUser[] = topLevelComments.map((comment) => ({
            ...comment,
            createdAt: comment.createdAt,
            media: mediaMap.get(comment.id) || [],
        }));

        const [{ count }] = await this.db
            .select({ count: sql<number>`count(*)` })
            .from(comments)
            .where(sql`${comments.userId} = ${userId} AND ${comments.parentId} IS NULL`);
        console.log(`Total comments count for userId: ${userId} is ${commentsArray.length}`);
        return {
            data: commentsArray,
            meta: {
                total: Number(count),
                page,
                limit: cleanLimit,
                lastPage: Math.ceil(count / cleanLimit),
            },
        };
    }


    async getUserTotalComments(
        userId: number,
    ) {
        const [{ count }] = await this.db
            .select({ count: sql<number>`count(*)` })
            .from(comments)
            .where(sql`${comments.userId} = ${userId} AND ${comments.parentId} IS NULL`);
        return count;
    }

    async getGlobalAverage(): Promise<number> {
        // 1. Define the subquery with an explicit .as() on the SQL field
        const sq = this.db
            .select({
                // The .as('value') here is what Drizzle was complaining about
                value: sql<number>`count(*)`.as('value')
            })
            .from(comments)
            .groupBy(comments.userId)
            .as('sq');

        // 2. Reference it in the outer query
        const [result] = await this.db
            .select({
                average: sql<number>`CAST(AVG(${sq.value}) AS FLOAT)`
            })
            .from(sq);

        return result?.average || 0;
    }
}
