// src/users/users.controller.ts
import { Controller, Patch, Body, Param, ParseIntPipe, Req, Post, UseInterceptors, UploadedFile, UseGuards, Get, Query, Redirect, Res, BadRequestException } from '@nestjs/common';
import express from 'express';
import { SettingsService } from '../service/settings.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { diskStorage } from 'multer';
import { randomBytes } from 'crypto';
import { PasswordSettingsDto } from '../dto/passwordSetting.dto';
import { UpdatePasswordService } from '../service/updatePassword.service';
import { AuthGuard } from '@nestjs/passport';
import { ProfileSettingsDto } from '../dto/profile-settings.dto';
import { UpdateMailService } from '../service/updateMail.service';
import { LanguageSettingsDto } from '../dto/language-settings.dto';
import { AccountSettingsDto } from '../dto/account-settings.dto';
import { PreferencesSettingsDto } from '../dto/preferences-settings.dto';

@Controller('settings')
export class UsersSettingsController {
    constructor(
        private usersService: SettingsService,
        private updatePasswordService: UpdatePasswordService,
        private updateMailService: UpdateMailService
    ) { }


    @UseGuards(AuthGuard('jwt'))
    @Patch('email')
    async updateEmailSettings(
        @Body() dto: AccountSettingsDto,
        @Req() request,
    ) {
        if (dto.email)
            return this.updateMailService.updateEmailSettings(request.user.id, dto.email);
    }


    @UseGuards(AuthGuard('jwt'))
    @Get('confirm-email-update')
    async verifyUpdateMail(
        @Query('token') token: string,
        @Res() res: express.Response
    ) {
        try {
            if (!token) throw new BadRequestException('Token is missing');

            await this.updateMailService.verifyUpdateMail(token);

            return res.redirect(302, `${process.env.FRONTEND_URL}/update-email?status=success`);
        } catch (err) {
            return res.redirect(302, `${process.env.FRONTEND_URL}/update-email?status=error`);
        }
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch('profile')
    @UseInterceptors(
        FileInterceptor('avatar', {
            storage: diskStorage({
                destination: './uploads/profile_public',
                filename: (req, file, callback) => {
                    const randomName = `${randomBytes(8).toString('hex')}${extname(file.originalname)}`;
                    callback(null, randomName);
                },
            }),
            fileFilter: (req, file, callback) => {
                if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
                    return callback(new Error('Only image files are allowed!'), false);
                }
                callback(null, true);
            },
            limits: { fileSize: 5 * 1024 * 1024 },
        }),
    )
    async uploadFile(@UploadedFile() file: Express.Multer.File, 
        @Body() dto: ProfileSettingsDto,
        @Req() request) {

            const updateData = { ...dto };
            
            if (file) {
                updateData.avatarUrl = `/profile_public/${file.filename}`;
            }
            
            console.log(updateData);
            return this.usersService.updateProfileSettings(request.user.id, updateData);
        

    }

    @UseGuards(AuthGuard('jwt'))
    @Patch('password')
    async updatePassword(
        @Body() dto: PasswordSettingsDto,
        @Req() request,
    ) {
        console.log(request.user);
        return this.updatePasswordService.updatePassword(request.user.id, dto);
    }


    @UseGuards(AuthGuard('jwt'))
    @Patch('language')
    async updateLanguage(
        @Body() dto: LanguageSettingsDto,
        @Req() request,
    ) {
        return this.usersService.updateLanguage(request.user.id, dto);
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch('preferences')
    async updatePreferences(
        @Body() dto: PreferencesSettingsDto,
        @Req() request,
    ) {
        return this.usersService.updatePreferences(request.user.id, dto);
    }
}

