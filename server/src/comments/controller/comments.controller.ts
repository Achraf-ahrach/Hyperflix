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
  UseGuards,
  Body,
} from '@nestjs/common';
import { CommentDto } from '../dto/comment.dto';
import { CommentsService } from '../service/comments.service';
import { AuthGuard } from '@nestjs/passport';


@Controller('comments')
export class CommentsController {

  constructor(
    private commentService: CommentsService
  ) { }


  @UseGuards(AuthGuard('jwt'))
  @Get(':movieId')
  async getMovieComments(
    @Param('movieId') movieId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    @Query('offset', new ParseIntPipe({ optional: true })) offset = 1,
    @Req() req: any,
  ) {
    console.log("||")
    console.log(req.user);
    return this.commentService.getCommentsByMovie({ movieId, limit, page: offset,currentUserId: req.user.id});
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':movieId')
   async createComment(
      @Param('movieId') movieId: string,
      @Body('content') content: string,
      @Req() req: any,
    ) {
      
      console.log(req.user.id);
      console.log("DSDS");
      return "true;"
    }

  @UseGuards(AuthGuard('jwt'))
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
