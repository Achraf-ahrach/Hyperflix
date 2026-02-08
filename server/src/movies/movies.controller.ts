import { BadRequestException, Controller, Delete, Get, NotFoundException, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { AuthGuard } from '@nestjs/passport';
import { MovieFilterDto } from './dto/movie-filter.dto';

@Controller('movies')
@UseGuards(AuthGuard('jwt'))
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) { }

  @Get('library')
  async getLibrary(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    // @Query('quality') quality?: string,
    @Query('minimum_rating') minimum_rating?: string,
    @Query('query_term') query_term?: string,
    @Query('genre') genre?: string,
    @Query('sort_by') sort_by?: string,
    @Query('order_by') order_by?: string,
    @Req() req?: any,
  ) {
    const filters: MovieFilterDto = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      // quality: quality || undefined,
      minimum_rating: minimum_rating ? parseInt(minimum_rating) : undefined,
      query_term: query_term || undefined,
      genre: genre || undefined,
      sort_by: sort_by || 'date_added',
      order_by: order_by || 'desc',
    };

    const userId = req?.user?.id; // Extract userId if authenticated
    const result = await this.moviesService.getLibraryMovies(filters, userId);
    return result.movies;
  }

  @Get('search')
  async searchMovies(@Query('q') query: string, @Req() req?: any) {
    if (!query || query.trim() === '') {
      throw new BadRequestException('Query parameter "q" is required');
    }

    const userId = req?.user?.id; // Extract userId if authenticated
    const results = await this.moviesService.searchMovies(query.trim(), userId);
    return {
      query,
      count: results.length,
      results
    };
  }

  @Get(':id')
  async getMovie(@Param('id') id: string, @Req() req?: any) {
    const userId = req?.user?.id; // Extract userId if authenticated
    const movie = await this.moviesService.getMovie(id, userId);

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

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id/watched')
  async removeMovieFromWatched(@Param('id') movieId: string, @Req() req: any) {
    const userId = req.user.id;
    return this.moviesService.removeMovieFromWatched(userId, movieId);
  }
}