

// src/users/users.repository.ts
import { Inject, Injectable } from '@nestjs/common';
import { mailTokens, users } from '../../database/schema';
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
            .orderBy(desc(comments.createdAt), desc(comments.id) )
            .limit(cleanLimit)
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
                limit: cleanLimit,
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
