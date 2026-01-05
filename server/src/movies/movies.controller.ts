import { Controller, Get, Param, Query } from '@nestjs/common';
import { MoviesService } from './movies.service';

@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) { }

  @Get('library')
  // Limit is optional and defaults to 10
  async getTrending(@Query('page') page: string, @Query('limit') limit?: string) {
    const allMovies = await this.moviesService.getTrendingMovies(parseInt(page), parseInt(limit || '10'));
    return allMovies;
  }

  @Get(':id')
  async getMovie(@Param('id') id: string) {
    return this.moviesService.getMovie(id);
  }
}
