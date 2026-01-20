
// src/users/users.controller.ts
import { Controller, Patch, Body, Req, Query, UseGuards, Get, Param } from '@nestjs/common';
import type { Request } from 'express';
import { UserProfileService } from '../service/userProfile.service';
import { AuthGuard } from '@nestjs/passport';


@Controller('profile')
export class UsersProfileController {
    constructor(
        private userProfileService: UserProfileService
    ) { }

 // @UseGuards(AuthGuard('jwt'))
    @Get(':userId')
    async getProfileData(
        @Param('userId') userId: number,
        @Req() request: Request,
    )
    {
        return this.userProfileService.getProfilePublicInfo(userId);
    }
    // @UseGuards(AuthGuard('jwt'))
    @Get(':userId/movies')
    async getProfileWatchedMovies(
        @Param('userId') userId: number,
        @Query('page') page = 1,
        @Query('limit') limit = 20,
        @Req() request: Request,
    )
    {
        if (limit > 20) limit = 20;
        return this.userProfileService.getUserWatchedMovies
        (
            userId,
            page,
            limit
        )
    }


    @Get(':userId/movies/watch-later')
    async getProfileWatchLaterMovies(
        @Param('userId') userId: number,
        @Query('page') page = 1,
        @Query('limit') limit = 20,
    )
    {
        if (limit > 20) limit = 20;
        return this.userProfileService.getUserWatchLaterMovies
        (
            userId,
            page,
            limit
        )
    }

    // @UseGuards(AuthGuard('jwt'))
    @Get(':userId/comments')
    async updateSettings(
        @Param('userId') userId: number,
        @Query('page') page = 1,
        @Query('limit') limit = 20,
    )
    {
        if (limit > 20) limit = 20;
        return this.userProfileService.getUserComments(
            userId,
            page,
            limit
        )
    }



}

