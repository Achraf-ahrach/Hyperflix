// src/users/users.controller.ts
import { Controller, Patch, Body, Param, ParseIntPipe, Req, Post, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { SettingsService } from '../service/settings.service';
import { AccountSettingsDto } from '../dto/account-settings.dto';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { diskStorage } from 'multer';
import { randomBytes } from 'crypto';
import { PasswordSettingsDto } from '../dto/passwordSetting.dto';
import { UpdatePasswordService } from '../service/updatePassword.service';
import { AuthGuard } from '@nestjs/passport';
import { ProfileSettingsDto } from '../dto/profile-settings.dto';
import { UpdateMailService } from '../service/updateMail.service';


@Controller('settings')
export class UsersSettingsController {
    constructor(
        private usersService: SettingsService,
        private updatePasswordService: UpdatePasswordService,
        private updateMailService: UpdateMailService
    ) { }
    

    @UseGuards(AuthGuard('jwt'))
    @Patch('profile')
    async updateProfileSettings(
        @Body() dto: ProfileSettingsDto,
        @Req() request,
    )
    {
        return this.usersService.updateProfileSettings(request.user.id, dto);
    }


    @UseGuards(AuthGuard('jwt'))
    @Patch('profile')
    async updateEmailSettings(
        @Body() dto: AccountSettingsDto,
        @Req() request,
    )
    {
        if (dto.email)
            return this.updateMailService.updateEmailSettings(request.user.id, dto);
    }


    @UseGuards(AuthGuard('jwt'))
    @Patch('image')
    @UseInterceptors(
        FileInterceptor('image', {
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
    async uploadFile(@UploadedFile() image: Express.Multer.File, @Req() request) {
        await this.usersService.updateProfileAvatar(request.user.id, `/profile_public/${image.filename}`);
        console.log(image);
        return {
            url: `/profile_public/${image.filename}`,
        };
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
}

