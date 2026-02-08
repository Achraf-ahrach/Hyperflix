import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom, map } from 'rxjs';
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import * as cacheManager_1 from 'cache-manager';
import { DRIZZLE } from 'src/database/database.module';
import { drizzle } from 'drizzle-orm/node-postgres';
import { and, eq } from 'drizzle-orm';
import { movies, watchedMovies, watchLaterMovies } from 'src/database/schema';
import { MovieFilterDto } from './dto/movie-filter.dto';

// ===== TYPES =====
export interface NormalizedMovie {
  source: 'YTS' | 'APIBay' | 'TMDb' | 'OMDb';
  imdb_code: string;
  // tmdb_id?: number;
  title: string;
  year: number;
  rating: number;
  thumbnail: string | null;
  synopsis: string;
  runtime: number;
  mpa_rating: string;
  genres: string | string[];
  background_image: string | null;
  backdrop_image?: string | null;
  torrents?: Torrent[];
  watched?: boolean; // User-specific watched status
}



export interface Torrent {
  url: string;
  hash: string;
  quality: string;
  seeds: number;
  peers: number;
  size: number;
}

interface TMDbMetadata {
  posterUrl: string | null;
  backdropUrl: string | null;
  movieTitle: string;
  movieYear: number;
  voteAverage: number;
  plot: string;
  runtime: number;
  rated: string;
  genres: string[];
  tmdbId: number;
  imdbId: string;
}

interface TMDbFindResponse {
  movie_results: any[];
}

interface TMDbMovieDetails {
  id: number;
  imdb_id: string;
  title: string;
  release_date: string;
  vote_average: number;
  overview: string;
  runtime: number;
  poster_path: string | null;
  backdrop_path: string | null;
  genres: Array<{ id: number; name: string }>;
  release_dates?: {
    results: Array<{
      iso_3166_1: string;
      release_dates: Array<{ certification: string }>;
    }>;
  };
}

interface OMDbMetadata {
  posterUrl: string | null;
  movieTitle: string;
  movieYear: number;
  imdbRating: number;
  plot: string;
  runtime: number;
  rated: string;
  genres: string[];
  imdbId: string;
}

interface OMDbResponse {
  Title: string;
  Year: string;
  Rated: string;
  Runtime: string;
  Genre: string;
  Plot: string;
  Poster: string;
  imdbID: string;
  imdbRating: string;
  Response: string;
  Error?: string;
}

// ===== CONSTANTS =====
const CACHE_KEYS = {
  ALL_MOVIES: 'all_movies',
  TMDB_MOVIE: (id: string) => `tmdb_movie_${id}`,
  OMDB_MOVIE: (id: string) => `omdb_movie_${id}`,
  SEARCH_MOVIES: (query: string) => `search_movies_${query.toLowerCase().trim()}`,
  MOVIE: (id: string) => `movie_${id}`,
} as const;


const YTS_DOMAIN = 'https://yts.lt';

const API_URLS = {
  YTS_SEARCH: YTS_DOMAIN + '/api/v2/list_movies.json',
  YTS_TRENDING: YTS_DOMAIN + '/api/v2/list_movies.json?sort_by=download_count&limit=50',
  APIBAY_SEARCH: 'https://apibay.org/q.php',
  APIBAY_TRENDING: 'https://apibay.org/precompiled/data_top100_207.json',
  OMDB_BASE: 'https://www.omdbapi.com',
  TMDB_BASE: 'https://api.themoviedb.org/3',
  TMDB_IMAGE_BASE: 'https://image.tmdb.org/t/p',
} as const;

const TMDB_IMAGE_SIZES = {
  POSTER_LARGE: 'w780',      // High-res poster
  POSTER_ORIGINAL: 'original', // Original quality
  BACKDROP_LARGE: 'w1280',   // High-res backdrop
  BACKDROP_ORIGINAL: 'original',
} as const;

const LIMITS = {
  APIBAY_SEARCH_RESULTS: 20,
  CACHE_TTL: 604800, // 7 days in seconds
} as const;

@Injectable()
export class MoviesService {
  private readonly logger = new Logger(MoviesService.name);
  private readonly omdbApiKey: string | undefined;
  private readonly tmdbApiKey: string | undefined;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: cacheManager_1.Cache,
    @Inject(DRIZZLE) private readonly db: ReturnType<typeof drizzle>,

  ) {
    const key = this.configService.get<string>('OMDB_API_KEY');
    this.omdbApiKey = key?.trim();
    this.tmdbApiKey = this.configService.get<string>('TMDB_API_KEY')?.trim();

    if (!this.omdbApiKey) {
      this.logger.error('OMDB_API_KEY not configured');
    } else {
      this.logger.log(`OMDB_API_KEY configured: '${this.omdbApiKey.substring(0, 4)}...' (length: ${this.omdbApiKey.length})`);
    }


    if (!this.tmdbApiKey) {
      this.logger.error('TMDB_API_KEY not configured');
    } else {
      this.logger.log(`TMDB_API_KEY configured: '${this.tmdbApiKey.substring(0, 4)}...' (length: ${this.tmdbApiKey.length})`);
    }
  }

  // ===== PUBLIC API =====

  async searchMovies(query: string, userId?: number): Promise<NormalizedMovie[]> {
    const cacheKey = CACHE_KEYS.SEARCH_MOVIES(query);
    const cached = await this.cacheManager.get<NormalizedMovie[]>(cacheKey);

    if (cached) {
      this.logger.debug(`Returning cached search results for: ${query}`);
      return await this.attachWatchedStatusToList(cached, userId);
    }

    const [ytsResults, apiBayResults] = await Promise.allSettled([
      this.searchYTS(query),
      this.searchAPIBay(query),
    ]);

    const results = [
      ...(ytsResults.status === 'fulfilled' ? ytsResults.value : []),
      ...(apiBayResults.status === 'fulfilled' ? apiBayResults.value : []),
    ];

    if (results.length > 0) {
      // Cache search results list
      await this.cacheManager.set(cacheKey, results, LIMITS.CACHE_TTL);

      // Cache individual movies so getMovie can find them (and their torrents)
      await Promise.all(
        results.map(movie =>
          this.cacheManager.set(CACHE_KEYS.MOVIE(movie.imdb_code), movie, LIMITS.CACHE_TTL)
        )
      );
    }

    return await this.attachWatchedStatusToList(results, userId);
  }

  async getTrendingMovies(page: number, limit: number, userId?: number): Promise<NormalizedMovie[]> {
    const start = (page - 1) * limit;
    const allMovies = await this.getAndCacheAllMovies();
    const sliced = allMovies.slice(start, start + limit);
    return await this.attachWatchedStatusToList(sliced, userId);
  }

  async getMovie(id: string, userId?: number): Promise<NormalizedMovie | null> {
    // Try cache first
    // const cachedMovies = await this.getAndCacheAllMovies();
    const cachedMovies = await this.cacheManager.get<NormalizedMovie[]>(CACHE_KEYS.ALL_MOVIES) || [];

    const cachedMovie = cachedMovies.find((m) => m?.imdb_code === id);

    if (cachedMovie) {
      return await this.attachWatchedStatus(cachedMovie, userId);
    }

    // Try individual movie cache (populated by search)
    const specificCacheKey = CACHE_KEYS.MOVIE(id);
    const specificCachedMovie = await this.cacheManager.get<NormalizedMovie>(specificCacheKey);

    if (specificCachedMovie) {
      this.logger.debug(`Returning cached movie data for ${id}`);
      return await this.attachWatchedStatus(specificCachedMovie, userId);
    }

    // Try OMDb first
    this.logger.log(`Movie ${id} not found in cache, fetching from OMDb`);
    const omdbData = await this.fetchFromOMDb(id);

    if (omdbData) {
      this.logger.log(`Successfully fetched movie ${id} from OMDb`);
      const normalized = this.normalizeOMDbMovie(omdbData);
      await this.cacheManager.set(specificCacheKey, normalized, LIMITS.CACHE_TTL);
      return await this.attachWatchedStatus(normalized, userId);
    }

    // Fallback to TMDb if OMDb fails
    this.logger.log(`OMDb failed for ${id}, trying TMDb as fallback`);
    const tmdbData = await this.fetchFromTMDb(id);

    if (tmdbData) {
      this.logger.log(`Successfully fetched movie ${id} from TMDb`);
      const normalized = this.normalizeTMDbMovie(tmdbData);
      await this.cacheManager.set(specificCacheKey, normalized, LIMITS.CACHE_TTL);
      return await this.attachWatchedStatus(normalized, userId);
    }

    this.logger.warn(`Both OMDb and TMDb failed for movie ${id}`);
    return null;
  }

  // ===== SEARCH METHODS =====

  private async searchYTS(query: string): Promise<NormalizedMovie[]> {
    const url = `${API_URLS.YTS_SEARCH}?query_term=${encodeURIComponent(query)}`;

    try {
      const response = await this.fetchData<any>(url);

      if (!response?.data?.movies) {
        return [];
      }

      const enrichedMovies = await Promise.allSettled(
        response.data.movies.map((movie: any) => this.enrichYTSMovie(movie))
      );

      return enrichedMovies
        .filter((result): result is PromiseFulfilledResult<NormalizedMovie> =>
          result.status === 'fulfilled'
        )
        .map((result) => result.value);
    } catch (error) {
      this.logger.error(`YTS search failed for query: ${query}`, error.stack);
      return [];
    }
  }

  private async enrichYTSMovie(movie: any): Promise<NormalizedMovie> {
    const normalizedYTS = this.normalizeYTSMovie(movie);

    // Attempt to enrich with OMDb data
    const omdbMetadata = await this.fetchFromOMDb(normalizedYTS.imdb_code);

    if (omdbMetadata) {
      // Merge OMDb metadata but keep YTS torrents and source identifier
      return {
        ...normalizedYTS,
        title: omdbMetadata.movieTitle,
        year: omdbMetadata.movieYear,
        rating: omdbMetadata.imdbRating,
        thumbnail: omdbMetadata.posterUrl || normalizedYTS.thumbnail,
        synopsis: omdbMetadata.plot || normalizedYTS.synopsis,
        runtime: omdbMetadata.runtime || normalizedYTS.runtime,
        mpa_rating: omdbMetadata.rated || normalizedYTS.mpa_rating,
        genres: omdbMetadata.genres.length > 0 ? omdbMetadata.genres : normalizedYTS.genres,
        background_image: omdbMetadata.posterUrl || normalizedYTS.background_image,
        // Ensure torrents are preserved
        torrents: normalizedYTS.torrents,
      };
    }

    // Fallback to TMDb if OMDb fails
    this.logger.log(`OMDb failed for ${normalizedYTS.imdb_code}, trying TMDb as fallback`);
    const tmdbMetadata = await this.fetchFromTMDb(normalizedYTS.imdb_code);

    if (tmdbMetadata) {
      return {
        ...normalizedYTS,
        title: tmdbMetadata.movieTitle,
        year: tmdbMetadata.movieYear,
        rating: tmdbMetadata.voteAverage,
        thumbnail: tmdbMetadata.posterUrl || normalizedYTS.thumbnail,
        synopsis: tmdbMetadata.plot || normalizedYTS.synopsis,
        runtime: tmdbMetadata.runtime || normalizedYTS.runtime,
        mpa_rating: tmdbMetadata.rated || normalizedYTS.mpa_rating,
        genres: tmdbMetadata.genres.length > 0 ? tmdbMetadata.genres : normalizedYTS.genres,
        background_image: tmdbMetadata.backdropUrl || tmdbMetadata.posterUrl || normalizedYTS.background_image,
        backdrop_image: tmdbMetadata.backdropUrl,
        // Ensure torrents are preserved
        torrents: normalizedYTS.torrents,
      };
    }

    // Fallback if both OMDb and TMDb fail - use original YTS data
    this.logger.warn(`Both OMDb and TMDb failed for ${normalizedYTS.imdb_code}, using YTS data`);
    return normalizedYTS;
  }

  private async searchAPIBay(query: string): Promise<NormalizedMovie[]> {
    const url = `${API_URLS.APIBAY_SEARCH}?q=${encodeURIComponent(query)}&cat=207`;

    try {
      const response = await this.fetchData<any[]>(url);

      if (!Array.isArray(response) || response.length === 0) {
        return [];
      }

      const enrichedMovies = await Promise.allSettled(
        response
          .slice(0, LIMITS.APIBAY_SEARCH_RESULTS)
          .map((movie: any) => this.enrichAPIBayMovie(movie))
      );

      return enrichedMovies
        .filter((result): result is PromiseFulfilledResult<NormalizedMovie> =>
          result.status === 'fulfilled' && result.value !== null
        )
        .map((result) => result.value);
    } catch (error) {
      this.logger.error(`APIBay search failed for query: ${query}`, error.stack);
      return [];
    }
  }

  // ===== TRENDING METHODS =====

  private async getAndCacheAllMovies(): Promise<NormalizedMovie[]> {
    const cached = await this.cacheManager.get<NormalizedMovie[]>(CACHE_KEYS.ALL_MOVIES);

    if (cached) {
      this.logger.debug('Returning cached movies');
      return cached;
    }

    this.logger.log('Cache miss - fetching trending movies');
    const [ytsData, apiBayData] = await Promise.allSettled([
      this.getYtsTrending(),
      this.getApiBayTrending(),
    ]);

    const allMovies = [
      ...(ytsData.status === 'fulfilled' ? ytsData.value : []),
      ...(apiBayData.status === 'fulfilled' ? apiBayData.value : []),
    ];

    await this.cacheManager.set(CACHE_KEYS.ALL_MOVIES, allMovies, LIMITS.CACHE_TTL);
    return allMovies;
  }

  private async getYtsTrending(): Promise<NormalizedMovie[]> {
    try {
      const response = await this.fetchData<any>(API_URLS.YTS_TRENDING);

      if (!response?.data?.movies) {
        return [];
      }

      const enrichedMovies = await Promise.allSettled(
        response.data.movies.map((movie: any) => this.enrichYTSMovie(movie))
      );

      return enrichedMovies
        .filter((result): result is PromiseFulfilledResult<NormalizedMovie> =>
          result.status === 'fulfilled'
        )
        .map((result) => result.value);
    } catch (error) {
      this.logger.error('YTS trending fetch failed', error.stack);
      return [];
    }
  }




  private async getApiBayTrending(): Promise<NormalizedMovie[]> {
    try {
      const topMovies = await this.fetchData<any[]>(API_URLS.APIBAY_TRENDING);

      console.log('APIBay trending movies fetched:', topMovies.length);

      if (!Array.isArray(topMovies)) {
        return [];
      }

      console.log('Enriching APIBay trending movies...');
      const enrichedMovies = await Promise.allSettled(
        topMovies.map((movie: any) => this.enrichAPIBayMovie(movie))
      );

      return enrichedMovies
        .filter((result): result is PromiseFulfilledResult<NormalizedMovie> =>
          result.status === 'fulfilled' && result.value !== null
        )
        .map((result) => result.value);
    } catch (error) {
      this.logger.error('APIBay trending fetch failed', error.stack);
      return [];
    }
  }

  // ===== NORMALIZATION METHODS =====

  private normalizeYTSMovie(movie: any): NormalizedMovie {
    return {
      source: 'YTS',
      imdb_code: movie.imdb_code,
      title: movie.title,
      year: movie.year,
      rating: movie.rating || 0,
      thumbnail: movie.large_cover_image,
      synopsis: movie.synopsis || '',
      runtime: movie.runtime || 0,
      mpa_rating: movie.mpa_rating || 'Not Rated',
      genres: movie.genres || [],
      background_image: movie.background_image,
      torrents: movie.torrents.map((torrent: any) => ({
        url: "magnet:?xt=urn:btih:" + torrent.hash + "&dn=" + encodeURIComponent(movie.title),
        hash: torrent.hash,
        quality: torrent.quality,
        size: torrent.size,
        peers: torrent.peers,
        seeds: torrent.seeds,
      })) || [],
    };
  }

  private normalizeOMDbMovie(metadata: OMDbMetadata): NormalizedMovie {
    return {
      source: 'OMDb',
      imdb_code: metadata.imdbId,
      title: metadata.movieTitle,
      year: metadata.movieYear,
      rating: metadata.imdbRating,
      thumbnail: metadata.posterUrl,
      synopsis: metadata.plot,
      runtime: metadata.runtime,
      mpa_rating: metadata.rated,
      genres: metadata.genres,
      background_image: metadata.posterUrl,
      torrents: [],
    };
  }

  private normalizeTMDbMovie(metadata: TMDbMetadata): NormalizedMovie {
    return {
      source: 'TMDb',
      imdb_code: metadata.imdbId,
      title: metadata.movieTitle,
      year: metadata.movieYear,
      rating: metadata.voteAverage,
      thumbnail: metadata.posterUrl,
      synopsis: metadata.plot,
      runtime: metadata.runtime,
      mpa_rating: metadata.rated,
      genres: metadata.genres,
      background_image: metadata.backdropUrl || metadata.posterUrl,
      backdrop_image: metadata.backdropUrl,
      torrents: [],
    };
  }




  // ===== TMDB API METHODS =====

  private async fetchFromTMDb(imdbCode: string): Promise<TMDbMetadata | null> {
    if (!imdbCode || !imdbCode.startsWith('tt')) {
      this.logger.warn(`${imdbCode}`)
      this.logger.warn(`Invalid IMDB code: ${imdbCode}`);
      return null;
    }

    if (!this.tmdbApiKey) {
      this.logger.error('TMDB_API_KEY not configured');
      return null;
    }

    try {
      // Check cache first
      const cacheKey = CACHE_KEYS.TMDB_MOVIE(imdbCode);
      const cached = await this.cacheManager.get<TMDbMetadata>(cacheKey);
      if (cached) {
        this.logger.debug(`Returning cached TMDb data for ${imdbCode}`);
        return cached;
      }

      // Step 1: Find the movie by IMDB ID to get TMDb ID
      const findUrl = `${API_URLS.TMDB_BASE}/find/${imdbCode}?api_key=${this.tmdbApiKey}&external_source=imdb_id`;
      console.log({ findUrl });
      const findResponse = await this.fetchData<TMDbFindResponse>(findUrl);

      if (!findResponse?.movie_results || findResponse.movie_results.length === 0) {
        this.logger.warn(`TMDb returned no results for ${imdbCode}`);
        return null;
      }

      const tmdbId = findResponse.movie_results[0].id;

      // Step 2: Get detailed movie information including certification
      const detailsUrl = `${API_URLS.TMDB_BASE}/movie/${tmdbId}?api_key=${this.tmdbApiKey}&append_to_response=release_dates`;
      const movieDetails = await this.fetchData<TMDbMovieDetails>(detailsUrl);

      if (!movieDetails) {
        this.logger.warn(`Failed to fetch details for TMDb ID ${tmdbId}`);
        return null;
      }

      // Extract US certification (MPAA rating)
      let certification = 'Not Rated';
      if (movieDetails.release_dates?.results) {
        const usRelease = movieDetails.release_dates.results.find(
          (r) => r.iso_3166_1 === 'US'
        );
        if (usRelease?.release_dates?.[0]?.certification) {
          certification = usRelease.release_dates[0].certification;
        }
      }

      const metadata: TMDbMetadata = {
        posterUrl: movieDetails.poster_path
          ? `${API_URLS.TMDB_IMAGE_BASE}/${TMDB_IMAGE_SIZES.POSTER_ORIGINAL}${movieDetails.poster_path}`
          : null,
        backdropUrl: movieDetails.backdrop_path
          ? `${API_URLS.TMDB_IMAGE_BASE}/${TMDB_IMAGE_SIZES.BACKDROP_ORIGINAL}${movieDetails.backdrop_path}`
          : null,
        movieTitle: movieDetails.title || '',
        movieYear: movieDetails.release_date
          ? parseInt(movieDetails.release_date.split('-')[0])
          : 0,
        voteAverage: movieDetails.vote_average || 0,
        plot: movieDetails.overview || '',
        runtime: movieDetails.runtime || 0,
        rated: certification,
        genres: movieDetails.genres?.map((g) => g.name) || [],
        tmdbId: movieDetails.id,
        imdbId: movieDetails.imdb_id || imdbCode,
      };

      // Cache the result
      await this.cacheManager.set(cacheKey, metadata, LIMITS.CACHE_TTL);

      return metadata;
    } catch (error) {
      this.logger.error(`Failed to fetch TMDb metadata for ${imdbCode}`, error.stack);
      return null;
    }
  }


  // ===== OMDB API METHODS =====

  private async fetchFromOMDb(imdbCode: string): Promise<OMDbMetadata | null> {
    if (!imdbCode || !imdbCode.startsWith('tt')) {
      this.logger.warn(`Invalid IMDB code: ${imdbCode}`);
      return null;
    }

    if (!this.omdbApiKey) {
      this.logger.error('OMDB_API_KEY not configured');
      return null;
    }

    try {
      // Check cache first
      const cacheKey = CACHE_KEYS.OMDB_MOVIE(imdbCode);
      const cached = await this.cacheManager.get<OMDbMetadata>(cacheKey);
      if (cached) {
        this.logger.debug(`Returning cached OMDb data for ${imdbCode}`);
        return cached;
      }

      // Fetch from OMDb API using IMDB ID
      const omdbUrl = `${API_URLS.OMDB_BASE}/?apikey=${this.omdbApiKey}&i=${imdbCode}&type=movie`;
      this.logger.log(`Fetching OMDb data for ${imdbCode} from URL: ${omdbUrl}`);
      const response = await this.fetchData<OMDbResponse>(omdbUrl);

      if (response.Response === 'False' || response.Error) {
        this.logger.warn(`OMDb returned no results for ${imdbCode}: ${response.Error}`);
        return null;
      }

      // Parse runtime (format: "120 min" -> 120)
      const runtimeMatch = response.Runtime?.match(/(\d+)/);
      const runtime = runtimeMatch ? parseInt(runtimeMatch[1]) : 0;

      // Parse year (format: "2020" -> 2020)
      const year = response.Year ? parseInt(response.Year) : 0;

      // Parse genres (format: "Action, Drama, Sci-Fi" -> ["Action", "Drama", "Sci-Fi"])
      const genres = response.Genre
        ? response.Genre.split(',').map((g) => g.trim())
        : [];

      // Parse IMDB rating
      const imdbRating = response.imdbRating && response.imdbRating !== 'N/A'
        ? parseFloat(response.imdbRating)
        : 0;

      const metadata: OMDbMetadata = {
        posterUrl: response.Poster && response.Poster !== 'N/A' ? response.Poster : null,
        movieTitle: response.Title || '',
        movieYear: year,
        imdbRating,
        plot: response.Plot && response.Plot !== 'N/A' ? response.Plot : '',
        runtime,
        rated: response.Rated && response.Rated !== 'N/A' ? response.Rated : 'Not Rated',
        genres,
        imdbId: response.imdbID || imdbCode,
      };

      // Cache the result
      await this.cacheManager.set(cacheKey, metadata, LIMITS.CACHE_TTL);

      return metadata;
    } catch (error) {
      this.logger.error(`Failed to fetch OMDb metadata for ${imdbCode}`, error.stack);
      return null;
    }
  }

  private async enrichAPIBayMovie(res: any): Promise<NormalizedMovie | null> {
    // this.logger.log(`Enriching APIBay movie: ${res} (${res.imdb})`);

    // Try OMDb first
    const omdbMetadata = await this.fetchFromOMDb(res.imdb);

    if (omdbMetadata) {
      return {
        source: 'APIBay',
        imdb_code: res.imdb,
        title: omdbMetadata.movieTitle,
        year: omdbMetadata.movieYear,
        rating: omdbMetadata.imdbRating,
        thumbnail: omdbMetadata.posterUrl,
        synopsis: omdbMetadata.plot,
        runtime: omdbMetadata.runtime,
        mpa_rating: omdbMetadata.rated,
        genres: omdbMetadata.genres,
        background_image: omdbMetadata.posterUrl,
        torrents: [
          {
            url: `magnet:?xt=urn:btih:${res.info_hash}&dn=${encodeURIComponent(res.name)}`,
            hash: res.info_hash,
            quality: '1080p',
            seeds: parseInt(res.seeders) || 0,
            peers: parseInt(res.leechers) || 0,
            size: parseInt(res.size) || 0,
          },
        ],
      };
    }

    // Fallback to TMDb if OMDb fails
    this.logger.log(`OMDb failed for ${res.imdb}, trying TMDb as fallback`);
    const tmdbMetadata = await this.fetchFromTMDb(res.imdb);

    if (tmdbMetadata) {
      return {
        source: 'APIBay',
        imdb_code: res.imdb,
        title: tmdbMetadata.movieTitle,
        year: tmdbMetadata.movieYear,
        rating: tmdbMetadata.voteAverage,
        thumbnail: tmdbMetadata.posterUrl,
        synopsis: tmdbMetadata.plot,
        runtime: tmdbMetadata.runtime,
        mpa_rating: tmdbMetadata.rated,
        genres: tmdbMetadata.genres,
        background_image: tmdbMetadata.backdropUrl || tmdbMetadata.posterUrl,
        backdrop_image: tmdbMetadata.backdropUrl,
        torrents: [
          {
            url: `magnet:?xt=urn:btih:${res.info_hash}&dn=${encodeURIComponent(res.name)}`,
            hash: res.info_hash,
            quality: '1080p',
            seeds: parseInt(res.seeders) || 0,
            peers: parseInt(res.leechers) || 0,
            size: parseInt(res.size) || 0,
          },
        ],
      };
    }

    this.logger.warn(`Both OMDb and TMDb failed for ${res.imdb}`);
    return null;
  }

  // ===== UTILITY METHODS =====

  private async fetchData<T>(url: string): Promise<T> {
    return lastValueFrom(
      this.httpService.get<T>(url).pipe(map((res) => res.data))
    );
  }

  /**
   * Attaches watched status to a movie for a specific user
   */
  private async attachWatchedStatus(movie: NormalizedMovie, userId?: number): Promise<NormalizedMovie> {
    if (!userId) {
      return movie;
    }

    try {
      const watchedRecord = await this.db
        .select()
        .from(watchedMovies)
        .where(
          and(
            eq(watchedMovies.userId, userId),
            eq(watchedMovies.movieId, movie.imdb_code)
          )
        )
        .limit(1);

      return {
        ...movie,
        watched: watchedRecord.length > 0,
      };
    } catch (error) {
      this.logger.error(`Failed to check watched status for movie ${movie.imdb_code}`, error.stack);
      return movie; // Return movie without watched status on error
    }
  }

  /**
   * Attaches watched status to a list of movies for a specific user
   */
  private async attachWatchedStatusToList(movies: NormalizedMovie[], userId?: number): Promise<NormalizedMovie[]> {
    if (!userId || movies.length === 0) {
      return movies;
    }

    try {
      const movieIds = movies.map(m => m.imdb_code);
      const watchedRecords = await this.db
        .select()
        .from(watchedMovies)
        .where(
          and(
            eq(watchedMovies.userId, userId),
          )
        );

      const watchedSet = new Set(watchedRecords.map(r => r.movieId));

      return movies.map(movie => ({
        ...movie,
        watched: watchedSet.has(movie.imdb_code),
      }));
    } catch (error) {
      this.logger.error(`Failed to check watched status for movie list`, error.stack);
      return movies; // Return movies without watched status on error
    }
  }




  async addMovieToWatchLater(userId: number, movieId: string): Promise<{ message: string }> {

    const result = await this.db.select().from(movies).where(
      eq(movies.id, movieId)).limit(1);

    if (result.length === 0) {
      const new_movie: NormalizedMovie | null = await this.getMovie(movieId);
      if (!new_movie) {
        throw new NotFoundException('Movie not found');
      }
      else {
        await this.db.insert(movies).values({
          id: new_movie.imdb_code,
          title: new_movie.title,
          productionYear: new_movie.year,
          // imdbRating: new_movie.rating,
          coverImageUrl: new_movie.thumbnail,
        });
      }
    }
    try {
      await this.db.insert(watchLaterMovies).values({
        userId,
        movieId,
      });
    }
    catch (error : any) {
      this.logger.error(`Failed to add movie ${movieId} to user ${userId}'s watch-later list: ${error.message}`);
      throw new HttpException('Failed to add movie to watch-later list', HttpStatus.FORBIDDEN);
    }

    return { message: `Movie ${movieId} added to user ${userId}'s watch-later list` };
  }

  async removeMovieFromWatchLater(userId: number, movieId: string): Promise<{ message: string }> {
    try {
      await this.db.delete(watchLaterMovies).where(
        and(
          eq(watchLaterMovies.userId, userId),
          eq(watchLaterMovies.movieId, movieId)

        )
      );

    }
    catch (error : any) {
      this.logger.error(`Failed to remove movie ${movieId} from user ${userId}'s watch-later list: ${error.message}`);
      throw new HttpException('Failed to remove movie from watch-later list', HttpStatus.FORBIDDEN);
    }

    return { message: `Movie ${movieId} removed from user ${userId}'s watch-later list` };
  }

  async addMovieToWatched(userId: number, movieId: string): Promise<{ message: string }> {
    const result = await this.db.select().from(movies).where(
      eq(movies.id, movieId)).limit(1);

    if (result.length === 0) {
      const new_movie: NormalizedMovie | null = await this.getMovie(movieId);
      if (!new_movie) {
        throw new NotFoundException('Movie not found');
      }

      await this.db.insert(movies).values({
        id: new_movie.imdb_code,
        title: new_movie.title,
        productionYear: new_movie.year,
        coverImageUrl: new_movie.thumbnail,
      });
    }
    try {
      await this.db.insert(watchedMovies).values({
        userId,
        movieId,
      });
    }
    catch (error : any) {
      this.logger.error(`Failed to add movie ${movieId} to user ${userId}'s watched list: ${error.message}`);
      throw new HttpException('Failed to add movie to watched list', HttpStatus.FORBIDDEN);
    }

    return { message: `Movie ${movieId} added to user ${userId}'s watched list` };
  }

  async removeMovieFromWatched(userId: number, movieId: string): Promise<{ message: string }> {
    try {
      await this.db.delete(watchedMovies).where(
        and(
          eq(watchedMovies.userId, userId),
          eq(watchedMovies.movieId, movieId)
        )
      );
    }
    catch (error) {
      this.logger.error(`Failed to remove movie ${movieId} from user ${userId}'s watched list: ${error.message}`);
      throw new HttpException('Failed to remove movie from watched list', HttpStatus.FORBIDDEN);
    }

    return { message: `Movie ${movieId} removed from user ${userId}'s watched list` };
  }
  async isMovieInWatchLater(userId: number, movieId: string): Promise<boolean> {
    const result = await this.db.select().from(watchLaterMovies).where(
      and(
        eq(watchLaterMovies.userId, userId),
        eq(watchLaterMovies.movieId, movieId)
      )
    ).limit(1);

    return result.length > 0;
  }





  /**
   * Get movies from YTS API with sorting and filtering
   * Uses YTS endpoint parameters for server-side filtering
   */
  async getLibraryMovies(filters: MovieFilterDto, userId?: number): Promise<{ movies: NormalizedMovie[]; movie_count: number; page_number: number }> {
    // Build cache key based on filter params
    // const filterKey = JSON.stringify(filters);
    // const cacheKey = `library_${filterKey}`;

    // const cached = await this.cacheManager.get<{ movies: NormalizedMovie[]; movie_count: number; page_number: number }>(cacheKey);
    // if (cached) {
    //   this.logger.debug(`Returning cached library results for filters: ${filterKey}`);
    //   return cached;
    // }

    // Build YTS API URL with filter parameters
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    // if (filters.quality && filters.quality !== 'all') params.append('quality', filters.quality);
    if (filters.minimum_rating) params.append('minimum_rating', filters.minimum_rating.toString());
    if (filters.query_term) params.append('query_term', filters.query_term);
    if (filters.genre) params.append('genre', filters.genre);
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.order_by) params.append('order_by', filters.order_by);

    const url = `${API_URLS.YTS_SEARCH}?${params.toString()}`;
    this.logger.log(`Fetching YTS library with filters: ${url}`);

    try {
      const response = await this.fetchData<any>(url);

      if (!response?.data?.movies) {
        return { movies: [], movie_count: 0, page_number: filters.page || 1 };
      }

      const enrichedMovies = await Promise.allSettled(
        response.data.movies.map((movie: any) => this.enrichYTSMovie(movie))
      );

      const movies = enrichedMovies
        .filter((result): result is PromiseFulfilledResult<NormalizedMovie> =>
          result.status === 'fulfilled'
        )
        .map((result) => result.value);

      const moviesWithWatchedStatus = await this.attachWatchedStatusToList(movies, userId);

      const result = {
        movies: moviesWithWatchedStatus,
        movie_count: response.data.movie_count || movies.length,
        page_number: response.data.page_number || filters.page || 1,
      };

      // // Cache for 5 minutes (shorter TTL for filtered results)
      // await this.cacheManager.set(cacheKey, result, 300);

      return result;
    } catch (error) {
      this.logger.error(`YTS library fetch failed with filters:`, error.stack);
      return { movies: [], movie_count: 0, page_number: filters.page || 1 };
    }
  }
}