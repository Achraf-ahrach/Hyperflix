import { BadRequestException, Controller, Delete, Get, NotFoundException, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) { }

  @Get('library')
  async getTrending(@Query('page') page: string, @Query('limit') limit?: string) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit || '10');
    const allMovies = await this.moviesService.getTrendingMovies(pageNum, limitNum);
    return allMovies;
  }

  @Get('search')
  async searchMovies(@Query('q') query: string) {
    if (!query || query.trim() === '') {
      throw new BadRequestException('Query parameter "q" is required');
    }

    const results = await this.moviesService.searchMovies(query.trim());
    return {
      query,
      count: results.length,
      results
    };
  }

  @Get(':id')
  async getMovie(@Param('id') id: string) {
    const movie = await this.moviesService.getMovie(id);

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    return movie;
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/watch-later')
  async addMovieToWatchLater(@Param('id') movieId: string, @Req() req: any) {
    const userId = req.user.id;
    return this.moviesService.addMovieToWatchLater(userId, movieId);
  }


  @UseGuards(AuthGuard('jwt'))
  @Post(':id/watched')
  async addMovieToWatched(@Param('id') movieId: string, @Req() req: any) {
    const userId = req.user.id;
    return this.moviesService.addMovieToWatched(userId, movieId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id/watch-later')
  async removeMovieFromWatchLater(@Param('id') movieId: string, @Req() req: any) {
    const userId = req.user.id;
    return this.moviesService.removeMovieFromWatchLater(userId, movieId);
  }
}