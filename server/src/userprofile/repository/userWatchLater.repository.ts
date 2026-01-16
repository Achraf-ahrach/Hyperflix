

// src/users/users.repository.ts
import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from '../../database/database.module';
import { drizzle } from 'drizzle-orm/node-postgres'
import { eq, desc, sql } from 'drizzle-orm';
import {movies } from '../../database/schema';
import { MovieResponseDto } from '../dto/MovieResponse.dto';
import { watchLaterMovies } from 'src/database/schema/movies-watch-later';



@Injectable()
export class UserWatchLaterRepository {
    constructor(
        @Inject(DRIZZLE) private readonly db: ReturnType<typeof drizzle>,
    ) { }

    async getUserWatchLaterMoviesByPage(
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
            .from(watchLaterMovies)
            .innerJoin(movies, eq(watchLaterMovies.movieId, movies.id))
            .where(eq(watchLaterMovies.userId, userId))
            .orderBy(desc(movies.productionYear))
            .limit(limit)
            .offset(offset);


        const [{ count }] = await this.db
            .select({ count: sql<number>`count(*)` })
            .from(watchLaterMovies)
            .where(eq(watchLaterMovies.userId, userId));

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

}
