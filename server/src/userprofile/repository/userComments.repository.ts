

// src/users/users.repository.ts
import { Inject, Injectable } from '@nestjs/common';
import { mailTokens } from '../../database/schema';
import { DRIZZLE } from '../../database/database.module';
import { drizzle } from 'drizzle-orm/node-postgres'

import { eq, desc, sql } from 'drizzle-orm';
import { comments, movies } from '../../database/schema';
import { CommentResponseDto } from '../dto/CommentResponse.dto';
import { MovieResponseDto } from '../dto/MovieResponse.dto';
import { watchedMovies } from 'src/database/schema/movies-watched';



@Injectable()
export class UserCommentsRepository {
    constructor(
        @Inject(DRIZZLE) private readonly db: ReturnType<typeof drizzle>,
    ) { }

    async getUserCommentsByPage(
        userId: number,
        page: number,
        limit: number
    ) {
        const offset = (page - 1) * limit;

        const data = await this.db
            .select({
                id: comments.id,
                movieId: movies.id,
                movieTitle: movies.title,
                moviePosterUrl: movies.coverImageUrl,
                content: comments.content,
                rating: movies.imdbRating,
                createdAt: comments.createdAt,
            })
            .from(comments)
            .innerJoin(movies, eq(comments.movieId, movies.id))
            .where(
                eq(comments.userId, userId))
            .orderBy(desc(comments.createdAt))
            .limit(limit)
            .offset(offset);

        const [{ count }] = await this.db
            .select({ count: sql<number>`count(*)` })
            .from(comments)
            .where(eq(comments.userId, userId));

        return {
            data: data as CommentResponseDto[],
            meta: {
                total: Number(count),
                page,
                limit,
                lastPage: Math.ceil(count / limit),
            },
        };
    }


    async getUserTotalComments(
        userId: number,
    )
    {
        const [{ count }] = await this.db
                    .select({ count: sql<number>`count(*)` })
                    .from(comments)
                    .where(eq(comments.userId, userId));
        return count;
    }

}
