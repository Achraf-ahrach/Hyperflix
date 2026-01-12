import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  Post,
  HttpCode,
  HttpStatus,
  Req,
  Delete,
} from '@nestjs/common';
import { CommentDto } from '../dto/comment.dto';
import { CommentsService } from '../service/comments.service';


@Controller('comments')
export class CommentsController {

  constructor(
    private commentService: CommentsService
  ) { }


  @Get(':movieId')
  async getMovieComments(
    @Param('movieId') movieId: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    @Query('offset', new ParseIntPipe({ optional: true })) offset = 1,
  ) {
    return this.commentService.getCommentsByMovie({ movieId, limit, page: offset });
  }

  @Post(':commentId/like')
  @HttpCode(HttpStatus.OK)
  async toggleLike(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.commentService.toggleLike(commentId, userId);
  }

  // Delete a comment
  @Delete(':commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    await this.commentService.deleteComment(commentId, userId);
  }

}
