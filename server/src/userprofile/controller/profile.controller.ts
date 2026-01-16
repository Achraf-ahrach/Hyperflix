
// src/users/users.controller.ts
import { Controller, Patch, Body, Req, Query, UseGuards, Get, Param } from '@nestjs/common';
import type { Request } from 'express';
import { userProfileService } from '../service/userProfile.service';
import { AuthGuard } from '@nestjs/passport';


@Controller('profile')
export class UsersProfileController {
    constructor(
        private userProfileService: userProfileService
    ) { }

    // @UseGuards(AuthGuard('jwt'))
    @Get(':userId/movies')
    async getProfileWatchedMovies(
        @Param('userId') userId: number,
        @Query('page') page = 1,
        @Query('limit') limit = 10,
        @Req() request: Request,
    )
    {
        return this.userProfileService.getUserWatchedMovies
        (
            userId,
            page,
            limit
        )
    }


    @Get(':userId/movies')
    async getProfileWatchLaterMovies(
        @Param('userId') userId: number,
        @Query('page') page = 1,
        @Query('limit') limit = 10,
        @Req() request: Request,
    )
    {
        return this.userProfileService.getUserWatchLaterMovies
        (
            userId,
            page,
            limit
        )
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch('comments')
    async updateSettings(
        @Query('page') page = 1,
        @Query('limit') limit = 10,
        @Req() request: Request,
    )
    {
        return this.userProfileService.getUserComments(
            (request.user as any).id,
            page,
            limit
        )
    }



}

