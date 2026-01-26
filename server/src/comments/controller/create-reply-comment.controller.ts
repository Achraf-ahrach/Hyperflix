// comments.controller.ts
import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { CreateReplyCommentsService } from '../service/create-reply-comment.service';
import { ReplyDto } from '../dto/CreateReply.dto';
import { AuthGuard } from '@nestjs/passport';


@Controller('comments')

export class CreateReplyCommentController {
  constructor(private readonly commentsService: CreateReplyCommentsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post(':commentId/replies')
  async createReply(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() createReplyDto: ReplyDto,
    @Req() req: any,
  ) {
    if (!createReplyDto.content || createReplyDto.content.trim().length === 0) {
      throw new BadRequestException('Content is required');
    }

    if (createReplyDto.content.length > 2000) {
      throw new BadRequestException('Content must be 2000 characters or less');
    }

    // const userId = req.user.id;

    return this.commentsService.createReply({
      commentId,
      userId: req.user.id,
      content: createReplyDto.content.trim(),
    });
  }
}