





import { Injectable, NotFoundException } from '@nestjs/common';
import { UserCommentsRepository } from '../repository/userComments.repository';
import { UserWatchedMoviesRepository } from '../repository/userWatched.repository';
import { UserWatchLaterRepository } from '../repository/userWatchLater.repository';
import { UserResponseDto } from '../dto/UserResponse.dto';


export interface Movie {
    id: string;
    title: string;
    year: number;
    rating: number;
    posterUrl: string;
}

@Injectable()
export class userProfileService {
    constructor(
        private userCommentsRepository: UserCommentsRepository,
        private userWatchedMoviesRepository: UserWatchedMoviesRepository,
        private userWatchLaterRepository: UserWatchLaterRepository,
    ) { }

    async getUserComments(
        userId: number,
        page: number,
        limit: number
    ) {

        const data = await this.userCommentsRepository.getUserCommentsByPage(
            userId,
            page,
            limit
        );

        return data;
    }



    async getUserWatchedMovies(
        userId: number,
        page: number,
        limit: number
    )
    {
        return this.userWatchedMoviesRepository.getUserWatchedMoviesByPage(
            userId,
            page,
            limit
        );
    }


    async getUserWatchLaterMovies(
        userId: number,
        page: number,
        limit: number
    ) {

        const data = await this.userWatchLaterRepository.getUserWatchLaterMoviesByPage(
            userId,
            page,
            limit
        );

        return data;
    }














    async getUserMovies(
        userId: number,
        page: number,
        limit: number
    ) {

        const data = await this.userWatchedMoviesRepository.getUserWatchedMoviesByPage(
            userId,
            page,
            limit
        );


        // Generate mock movies for pagination
        const generateMockMovies = (count: number, startId: number = 1): Movie[] => {
            const titles = [
                'The Shawshank Redemption', 'The Dark Knight', 'Inception', 'Pulp Fiction',
                'Interstellar', 'The Matrix', 'Forrest Gump', 'The Godfather',
                'Fight Club', 'Goodfellas', 'The Prestige', 'Parasite',
                'Dune', 'The Batman', 'Everything Everywhere All at Once',
                'No Country for Old Men', 'Blade Runner 2049', 'Arrival',
                'Whiplash', 'La La Land', 'Joker', 'Oppenheimer',
                'The Grand Budapest Hotel', 'Mad Max: Fury Road', 'Moonlight'
            ];

            const posters = [
                'https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=300&h=450&fit=crop',
                'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=300&h=450&fit=crop',
                'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=450&fit=crop',
                'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&h=450&fit=crop',
                'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=300&h=450&fit=crop',
                'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=300&h=450&fit=crop',
            ];

            return Array.from({ length: count }, (_, i) => {
                const titleIndex = i % titles.length;
                const posterIndex = i % posters.length;
                return {
                    id: String(startId + i),
                    title: `${titles[titleIndex]} ${i > 24 ? `(${Math.floor(i / 25)})` : ''}`.trim(),
                    year: 1990 + (i % 34),
                    rating: 7.0 + Math.random() * 2.3,
                    posterUrl: posters[posterIndex],
                };
            });
        };

        const mockWatchedMovies = generateMockMovies(342);

        return mockWatchedMovies;
    }





    async getProfilePublicInfo(
        userId: number,
    ) {
        const total_comments = await this.userCommentsRepository.getUserTotalComments(userId);
        const total_watchedMovies = await this.userWatchedMoviesRepository.getUserTotalWatchedMovies(userId);
        const data: UserResponseDto =
        {
            id: userId,
            username: "__",
            displayName: "__",
            avatarUrl: "___",
            watchedCount: total_watchedMovies,
            commentsCount: total_comments
        }

        return data;
    }



}


