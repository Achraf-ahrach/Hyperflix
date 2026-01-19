
import { Module } from '@nestjs/common';
import { CommentsController } from './controller/comments.controller';
import { CommentsService } from './service/comments.service';
import { CreateCommentController } from './controller/create-comment.controller';
import { CreateReplyCommentController } from './controller/create-reply-comment.controller';
import { CreateCommentsService } from './service/create-comment.service';
import { CreateReplyCommentsService } from './service/create-reply-comment.service';

@Module({
  controllers: [CommentsController, CreateCommentController, CreateReplyCommentController],
  providers: [CommentsService, CreateCommentsService, CreateReplyCommentsService],
  exports: [CommentsService, CreateCommentsService, CreateReplyCommentsService],
})
export class CommentsModule {}
