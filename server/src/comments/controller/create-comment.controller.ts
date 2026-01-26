

// comments.controller.ts
import {
  Controller,
  Post,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CreateCommentsService } from '../service/create-comment.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('comments/:movieId')
export class CreateCommentController {
  constructor(private readonly createCommentsService: CreateCommentsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('media', {
      storage: diskStorage({
        destination: './uploads/comments_public',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `comment-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        // Accept images and videos onlyundefined
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|mp4|webm|mov)$/)) {
          return callback(
            new BadRequestException('Only image and video files are allowed!'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )



  @UseGuards(AuthGuard('jwt'))
  @Post()
  async createComment(
    @Param('movieId') movieId: string,
    @Body('content') content: string,
    @UploadedFile() media: Express.Multer.File,
    @Req() req: any,
  ) {
    
    console.log(req.user.id);

    if (!media && (!content || content.trim().length === 0)) {
      throw new BadRequestException('Content is required');
    }

    if (content.length > 2000) {
      throw new BadRequestException('Content must be 2000 characters or less');
    }

    if (media && (!content || content.trim().length === 0))
      content = '_';


    // const userId = req.user.id;
    
    return this.createCommentsService.createComment({
      movieId,
      userId: req.user.id,
      content: content.trim(),
      mediaFile: media,
    });
  }
}