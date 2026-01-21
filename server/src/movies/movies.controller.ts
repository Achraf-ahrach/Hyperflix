import { BadRequestException, Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { MovieFilterDto } from './dto/movie-filter.dto';

@Controller('movies')
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

    const result = await this.moviesService.getLibraryMovies(filters);
    return result.movies;
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
}