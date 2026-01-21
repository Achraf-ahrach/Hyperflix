import { IsOptional, IsString, IsNumber, Min, Max, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class MovieFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 20;

//   @IsOptional()
//   @IsString()
//   @IsIn(['480p', '720p', '1080p', '1080p.x265', '2160p', '3D', 'all'])
//   quality?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(9)
  minimum_rating?: number;

  @IsOptional()
  @IsString()
  query_term?: string;

  @IsOptional()
  @IsString()
  genre?: string;

  @IsOptional()
  @IsString()
  @IsIn(['title', 'year', 'rating', 'peers', 'seeds', 'download_count', 'like_count', 'date_added'])
  sort_by?: string = 'date_added';

  @IsOptional()
  @IsString()
  @IsIn(['desc', 'asc'])
  order_by?: string = 'desc';
}

// Genre list from IMDb
export const MOVIE_GENRES = [
  'Action',
  'Adventure',
  'Animation',
  'Biography',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Family',
  'Fantasy',
  'Film-Noir',
  'History',
  'Horror',
  'Music',
  'Musical',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Sport',
  'Thriller',
  'War',
  'Western',
] as const;

export type MovieGenre = typeof MOVIE_GENRES[number];
