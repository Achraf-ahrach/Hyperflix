import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom, map } from 'rxjs';
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import * as cacheManager_1 from 'cache-manager';

/**
 * Do some caching ?
 * The responses are cached in for 2 hours. The feeds are cached for 24 hours.

 */

/**
 * Can i fetch data from client -- no CORS ?
 * Data Normalization using DTO maybe => return  
 */


/**
 * The only required piece for a magnet link is the info_hash
 * magnet:?xt=urn:btih:<INFO_HASH>&dn=<NAME>
 * <NAME> is optional
 */

/**
 
{

"Title":"Zootopia 2",
"Year":"2025",
"Rated":"PG",
"Released":"26 Nov 2025",
"Runtime":"108 min",
"Genre":"Animation, Action, Adventure",
"Director":"Jared Bush, Byron Howard",
"Writer":"Jared Bush",
"Actors":"Ginnifer Goodwin, Jason Bateman, Ke Huy Quan",
"Plot":"Brave rabbit cop Judy Hopps and her friend, the fox Nick Wilde, team up again to crack a new case, the most perilous and intricate of their careers.",
"Language":"English",
"Country":"United States",
"Awards":"1 win & 2 nominations total",
"Poster":"https://m.media-amazon.com/images/M/MV5BYjg1Mjc3MjQtMTZjNy00YWVlLWFhMWEtMWI3ZTgxYjJmNmRlXkEyXkFqcGc@._V1_SX300.jpg","Ratings":
[
{"Source":"Internet Movie Database","Value":"7.8/10"},
{"Source":"Rotten Tomatoes","Value":"92%"},
{"Source":"Metacritic","Value":"73/100"}
],
"Metascore":"73",
"imdbRating":"7.8",
"imdbVotes":"8,485",
"imdbID":"tt26443597",
"Type":"movie",
"DVD":"N/A",
"BoxOffice":"$97,700,000",
"Production":"N/A",
"Website":"N/A",
"Response":"True"}

 */

/*
Production Setup (Redis)
In-memory caching is not suitable for clustered apps (data isn't shared between instances) or large datasets. You should switch to Redis.
*/

@Injectable()
export class MoviesService {
  // Common mirrors: yts.mx, yts.lt, yts.ag if YTS domains change
  // https://yts.lt/api/v2/list_movies.json
  // private readonly ytsDomain = 'yts.lt';
  // private readonly ytsApiUrl = `https://${this.ytsDomain}/api/v2/list_movies.json`;

  private readonly logger = new Logger(MoviesService.name);

  constructor(private readonly httpService: HttpService, private readonly configService: ConfigService, @Inject(CACHE_MANAGER) private readonly cacheManager: cacheManager_1.Cache) { }


  async searchMoviesYTS(query: string) {
    const url = `https://yts.lt/api/v2/list_movies.json?query_term=${query}`;
    const response = await lastValueFrom(this.httpService.get(url).pipe(map((res) => res.data)));
    return response.data.movies;
  }

  async searchMoviesApiBay(query: string) {
    // https://apibay.org/q.php?q={query}&cat={category_code}
    const url = `https://apibay.org/q.php?q=${query}&cat=207`;
    const response = await lastValueFrom(this.httpService.get(url).pipe(map((res) => res.data)));
    return response.data;
  }


  async getTrendingMovies(page: number, limit: number) {
    const start = (page - 1) * limit;
    const heavyData = await this.getAndCacheHeavyData();
    return heavyData.slice(start, start + limit);
  }

  async getAndCacheHeavyData() {
    const heavyData: any = await this.cacheManager.get('all_movies');
    if (heavyData) {
      return heavyData
    }
    const ytsData = await this.getYtsTrending();
    const apiBayData = await this.getApiBayTrending();
    const allMovies = [...ytsData, ...apiBayData];
    await this.cacheManager.set('all_movies', allMovies);
    return allMovies;
  }

  // 1. YTS Source (High Quality Movie Torrents)
  async getYtsTrending() {
    const url = 'https://yts.lt/api/v2/list_movies.json?sort_by=download_count&limit=50';

    try {
      const topMovies = await lastValueFrom(
        this.httpService.get(url).pipe(map((res) => res.data))
      );

      // Skip omdbapi requests as YTS already has the data

      return topMovies.data.movies.map((movie: any) => ({
        source: 'YTS',
        imdb_code: movie.imdb_code,
        title: movie.title,
        year: movie.year,
        rating: movie.rating || 0,
        thumbnail: movie.large_cover_image,
        synopsis: movie.synopsis,
        runtime: movie.runtime,
        mpa_rating: movie.mpa_rating,
        genres: movie.genres,
        background_image: movie.background_image,
        torrents: movie.torrents,
      }));
    } catch (e) {
      this.logger.error(e);
      this.logger.error('YTS failed, switching to APIBay...');
    }
  }

  async getMovie(id: string) {
    const heavyData: any[] = await this.getAndCacheHeavyData();
    const movie = heavyData.find(m => m.imdb_code === id);
    if (movie) return movie;

    // If not found in cache, try fetching directly from YTS (if it's a YTS movie)
    // Or just validte with OMDb? 
    // For now, let's keep it simple and just rely on the cache or maybe fetch details if needed.
    // Ideally we would fetch single movie details here.
    return null;
  }

  async getApiBayTrending() {
    const url = 'https://apibay.org/precompiled/data_top100_207.json';
    const omdbApiKey = this.configService.get('OMDB_API_KEY');

    try {
      const topMovies = await lastValueFrom(
        this.httpService.get(url).pipe(map((res) => res.data))
      );


      const enrichedMovies = await Promise.all(
        topMovies.map(async (res: any) => {
          let movie = {
            posterUrl: null,
            movieTitle: res.name,
            movieYear: null,
            imdbRating: 0,
            plot: '',
            runtime: 0,
            rated: '',
            genres: '',
          }
          if (res.imdb && res.imdb.startsWith('tt')) {
            try {
              const metadataUrl = `http://www.omdbapi.com/?apikey=${omdbApiKey}&i=${res.imdb}`;
              const metadata = await lastValueFrom(
                this.httpService.get(metadataUrl).pipe(map((res) => res.data))
              );

              if (metadata.Response === 'True') {
                movie.posterUrl = metadata.Poster !== 'N/A' ? metadata.Poster : null;
                movie.movieTitle = metadata.Title; // Use the "clean" title from OMDb
                movie.movieYear = metadata.Year;
                movie.imdbRating = Number.parseFloat(metadata.imdbRating);
                movie.plot = metadata.Plot;
                movie.runtime = parseInt(metadata.Runtime) || 0;
                movie.rated = metadata.Rated;
                movie.genres = metadata.Genre;
              }
            } catch (e) {
              this.logger.error(`Failed to fetch metadata for ${res.imdb}`);
              this.logger.error(e);
            }
          }

          // Return the clean, enriched object
          return {
            source: 'APIBay',
            imdb_code: res.imdb, // Important for the frontend router
            title: movie.movieTitle,     // Clean title (e.g. "Zootopia 2")
            year: movie.movieYear,       // Required by subject
            rating: movie.imdbRating,
            thumbnail: movie.posterUrl,  // THUMBNAIL
            synopsis: movie.plot,
            runtime: movie.runtime,
            mpa_rating: movie.rated,
            genres: movie.genres ? movie.genres.split(', ') : [],
            background_image: movie.posterUrl, // Fallback as APIBay doesn't provide backgrounds
            torrents: [            // Structure for the video player later
              {
                url: `magnet:?xt=urn:btih:${res.info_hash}&dn=${encodeURIComponent(res.name)}`,
                hash: res.info_hash,
                quality: '1080p', // Heuristic based on raw name or APIBay category
                seeds: parseInt(res.seeders),
                peers: parseInt(res.leechers),
                size: parseInt(res.size),
              }
            ]
          };
        })
      );

      return enrichedMovies;

    } catch (error) {
      this.logger.error('APIBay fetch failed');
      return [];
    }
  }

  // 2. APIBay Source (The Pirate Bay - Top 100 Movies)
  // async getApiBayTrending() {
  //   // Category 200 = Video, 201 = Movies, 207 = HD Movies
  //   // This endpoint returns the Top 100 movies sorted by popularity (seeds)
  //   const url = 'https://apibay.org/precompiled/data_top100_207.json';

  //   try {
  //     const data = await lastValueFrom(
  //       this.httpService.get(url).pipe(map((res) => res.data))
  //     );


  //     /**
  //        {
  //         "id": 81589954,
  //         "info_hash": "D745D479E6CD56D5F7DDB2F35970EF7FE1311788",
  //         "category": 207,
  //         "name": "Zootopia 2 2025 1080p Multi READNFO HEVC x265-RMTeam",
  //         "status": "vip",
  //         "num_files": 1,
  //         "size": 1815772220,
  //         "seeders": 5449,
  //         "leechers": 7353,
  //         "username": ".BONE.",
  //         "added": 1766677100,
  //         "anon": 0,
  //         "imdb": "tt26443597"
  //       },

  //       {
  //         "id": Identifiant unique for the torrent 
  //         "info_hash": Hash of the torrent, unique fingerprint of the torrent
  //         "category": Category of the torrent
  //         "name": Name of the torrent
  //         "status": Status of the torrent
  //         "num_files": Number of files in the torrent
  //         "size": Size of the torrent
  //         "seeders": Number of seeders for the torrent
  //         "leechers": Number of leechers for the torrent
  //         "username": Username of the user who uploaded the torrent
  //         "added": Time when the torrent was added
  //         "anon": Anonimity level of the torrent
  //         "imdb": IMDB ID of the movie

  //       }

  //      */

  //     // CAN YOU SET a limit for apiBay ?
  //     return data
  //       .map((movie: any) => ({
  //         source: 'APIBay',
  //         hash: movie.info_hash,
  //         catagory: parseInt(movie.category),
  //         title: movie.name,
  //         status: movie.status,
  //         numFiles: parseInt(movie.num_files),
  //         size: parseInt(movie.size),
  //         seeders: parseInt(movie.seeders),
  //         leechers: parseInt(movie.leechers),
  //         username: movie.username,
  //         added: movie.added,
  //         anon: movie.anon,
  //         imdb: movie.imdb,
  //         // magnet: `magnet:?xt=urn:btih:${movie.info_hash}&dn=${encodeURIComponent(movie.name)}`,
  //         // cover: null
  //       }))
  //     // .slice(0, 10).map((movie: any) => ({
  //     //   source: 'APIBay',
  //     //   title: movie.name,
  //     //   seeds: parseInt(movie.seeders),
  //     //   leechers: parseInt(movie.leechers),
  //     //   // APIBay does not give a magnet link directly, you must build it:
  //     //   magnet: `magnet:?xt=urn:btih:${movie.info_hash}&dn=${encodeURIComponent(movie.name)}`,
  //     //   hash: movie.info_hash,
  //     //   cover: null // APIBay does not provide images
  //     // }));
  //   } catch (error) {
  //     this.logger.error('APIBay also failed');
  //     return [];
  //   }
  // }



  // Search by query 
  /**
   * Search by query 
   * for apibay https://apibay.org/q.php?q={query}&cat={category_code} 
   * for YTS  https://yts.lt/api/v2/list_movies.json?query_term={query}
   */

}
