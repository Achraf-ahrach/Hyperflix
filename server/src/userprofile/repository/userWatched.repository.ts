

// src/users/users.repository.ts
import { Inject, Injectable } from '@nestjs/common';
import { mailTokens, watchLaterMovies } from '../../database/schema';
import { DRIZZLE } from '../../database/database.module';
import { drizzle } from 'drizzle-orm/node-postgres'

import { eq, desc, sql } from 'drizzle-orm';
import { comments, movies } from '../../database/schema';
import { CommentResponseDto } from '../dto/CommentResponse.dto';
import { MovieResponseDto } from '../dto/MovieResponse.dto';
import { watchedMovies } from 'src/database/schema';



@Injectable()
export class UserWatchedMoviesRepository {
    constructor(
        @Inject(DRIZZLE) private readonly db: ReturnType<typeof drizzle>,
    ) { }

    async getUserWatchedMoviesByPage(
        userId: number,
        page: number,
        limit: number,
    ) {
        limit = Math.min(limit, 50);
        const offset = (page - 1) * limit;

        const data: MovieResponseDto[] = await this.db
            .select({
                id: movies.id,
                title: movies.title,
                year: movies.productionYear,
                rating: movies.imdbRating,
                posterUrl: movies.coverImageUrl,
            })
            .from(watchedMovies)
            .innerJoin(movies, eq(watchedMovies.movieId, movies.id))
            .where(eq(watchedMovies.userId, userId))
            .orderBy(desc(movies.productionYear))
            .limit(limit)
            .offset(offset);


        const [{ count }] = await this.db
            .select({ count: sql<number>`count(*)` })
            .from(watchedMovies)
            .where(eq(watchedMovies.userId, userId));

        return {
            data,
            meta: {
                total: Number(count),
                page,
                limit,
                lastPage: Math.ceil(Number(count) / limit),
            },
        };
    }

    async getUserTotalWatchedMovies(
        userId: number,
    )
    {
        const [{ count }] = await this.db
                    .select({ count: sql<number>`count(*)` })
                    .from(watchedMovies)
                    .where(eq(watchedMovies.userId, userId));
        return count;
    }


    async getUserTotalWatchLaterMovies(
        userId: number,
    )
    {
        const [{ count }] = await this.db
                    .select({ count: sql<number>`count(*)` })
                    .from(watchLaterMovies)
                    .where(eq(watchLaterMovies.userId, userId));
        return count;
    }

async getGlobalAverage(): Promise<number> {
    const sq = this.db
        .select({ 
            // value: sql<number>`count(*)` 
            value: sql<number>`count(*)`.as('value') 
        })
        .from(watchedMovies)
        .groupBy(watchedMovies.userId)
        .as('sq');

    const [result] = await this.db
        .select({
            average: sql<number>`CAST(AVG(${sq.value}) AS FLOAT)`
        })
        .from(sq);

    return result?.average || 0;
}

}
