// src/users/users.controller.ts
import { Controller, Patch, Body, Param, ParseIntPipe, Req, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { SettingsService } from '../service/settings.service';
import { AccountSettingsDto } from '../dto/account-settings.dto';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { diskStorage } from 'multer';
import { randomBytes } from 'crypto';


@Controller('settings')
export class UsersSettingsController {
    constructor(private usersService: SettingsService) { }

    @Patch('account')
    async updateSettings(
        @Body() dto: AccountSettingsDto,
        @Req() request: Request,
    ) {
        console.log(request);
        return this.usersService.updateUserSettings(dto);
    }


    @Post('image')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads',
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
    uploadFile(@UploadedFile() file: Express.Multer.File) {
        return {
            url: `/uploads/${file.filename}`,
        };
    }
}

