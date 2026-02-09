import { Injectable, NotFoundException } from '@nestjs/common';
import { UserCommentsRepository } from '../repository/userComments.repository';
import { UserWatchedMoviesRepository } from '../repository/userWatched.repository';
import { UserWatchLaterRepository } from '../repository/userWatchLater.repository';


export interface UserActivityStatsDto {
    count: number;
    platformAverage: number;
}

export interface UserResponseDto {
    id: number;
    username: string;
    avatarUrl: string | null;
    watched: UserActivityStatsDto;
    comments: UserActivityStatsDto;
    watchlist: UserActivityStatsDto;
}

@Injectable()
export class UserProfileService {
    getUserProfileData(userId: number) {
        throw new Error('Method not implemented.');
    }
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

        try {
            if (page < 1) page = 1;
            if (limit < 1) limit = 1;
            const data = await this.userCommentsRepository.getUserCommentsByPage(
                userId,
                page,
                limit
            );

            return data;
        }
        catch (error) {
            console.error('Error fetching user comments:', error);
            throw new NotFoundException('Error fetching comments');
        }
    }



    async getUserWatchedMovies(
        userId: number,
        page: number,
        limit: number
    ) {
        try {
            if (page < 1) page = 1;
            if (limit < 1) limit = 1;
            const data = await this.userWatchedMoviesRepository.getUserWatchedMoviesByPage(
                userId,
                page,
                limit
            );

            return data;
        }
        catch (error) {
            throw new NotFoundException('Error fetching watched movies');
        }
    }

    


    async getUserWatchLaterMovies(
        userId: number,
        page: number,
        limit: number
    ) {
        try {
            if (page < 1) page = 1;
            if (limit < 1) limit = 1;
            const data = await this.userWatchLaterRepository.getUserWatchLaterMoviesByPage(
                userId,
                page,
                limit
            );

            return data;
        }
        catch (error) {
            throw new NotFoundException('Error fetching watch later movies');
        }       
    }

    async getProfilePublicInfo(userId: number): Promise<UserResponseDto> {
        try {
            const [user,totalComments, totalWatched, totalWatchLater] = await Promise.all([
                this.userCommentsRepository.findById(userId),
                this.userCommentsRepository.getUserTotalComments(userId),
                this.userWatchedMoviesRepository.getUserTotalWatchedMovies(userId),
                this.userWatchedMoviesRepository.getUserTotalWatchLaterMovies(userId),
            ]);


            const avgComments = await this.userCommentsRepository.getGlobalAverage();
            const avgWatched = await this.userWatchedMoviesRepository.getGlobalAverage();


            return {
                id: userId,
                avatarUrl: user?.avatarUrl || null,
                username: user?.username || 'User',
                watched: {
                    count: totalWatched,
                    platformAverage: avgWatched
                },
                comments: {
                    count: totalComments,
                    platformAverage: avgComments
                },
                watchlist: {
                    count: totalWatchLater,
                    platformAverage: 0
                }
            }

        }
        catch (error) {

            throw new NotFoundException('Error fetching profile info');
        }
    }


}