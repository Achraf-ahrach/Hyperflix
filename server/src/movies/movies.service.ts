import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom, map } from 'rxjs';

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

@Injectable()
export class MoviesService {
  // Common mirrors: yts.mx, yts.lt, yts.ag if YTS domains change
  // https://yts.lt/api/v2/list_movies.json
  // private readonly ytsDomain = 'yts.lt';
  // private readonly ytsApiUrl = `https://${this.ytsDomain}/api/v2/list_movies.json`;

  private readonly logger = new Logger(MoviesService.name);

  constructor(private readonly httpService: HttpService, private readonly configService: ConfigService) { }
  // 1. YTS Source (High Quality Movie Torrents)
  async getYtsTrending() {
    try {
      const url = 'https://yts.lt/api/v2/list_movies.json?sort_by=download_count&limit=10';
      const data = await lastValueFrom(
        this.httpService.get(url).pipe(map((res) => res.data))
      );
      return data.data.movies
      // ..map((movie: any) => ({
      //   source: 'YTS',
      //   title: movie.title,
      //   seeds: 0, // YTS API doesn't always show live seeders
      //   magnet: null, // YTS returns hash, need to build magnet manually or use torrent_url
      //   hash: movie.torrents[0]?.hash,
      //   cover: movie.medium_cover_image
      // }));
    } catch (e) {
      this.logger.error(e);
      this.logger.error('YTS failed, switching to APIBay...');
      // return this.getApiBayTrending(); // Fallback to APIBay
    }
  }


  async getApiBayTrending() {
    const url = 'https://apibay.org/precompiled/data_top100_207.json';
    const omdbApiKey = this.configService.get('OMDB_API_KEY');
    // process.env.OMDB_API_KEY; // e.g., 'a1b2c3d4'

    try {
      // 1. Fetch the raw torrent list
      const rawData = await lastValueFrom(
        this.httpService.get(url).pipe(map((res) => res.data))
      );

      // 2. Process and Enrich only the first 10-20 items to save API calls
      //    (OMDb free tier has a limit of 1000 calls per day)
      const limit = 20;
      const topMovies = rawData.slice(0, limit);

      // 3. Map over the movies and fetch metadata in parallel
      const enrichedMovies = await Promise.all(
        topMovies.map(async (movie: any) => {
          let posterUrl = null;
          let movieTitle = movie.name;
          let movieYear = null;

          // Only fetch if we have a valid IMDB ID
          if (movie.imdb && movie.imdb.startsWith('tt')) {
            try {
              const metadataUrl = `http://www.omdbapi.com/?apikey=${omdbApiKey}&i=${movie.imdb}`;
              const metadata = await lastValueFrom(
                this.httpService.get(metadataUrl).pipe(map((res) => res.data))
              );

              if (metadata.Response === 'True') {
                posterUrl = metadata.Poster !== 'N/A' ? metadata.Poster : null;
                movieTitle = metadata.Title; // Use the "clean" title from OMDb
                movieYear = metadata.Year;
              }
            } catch (e) {
              this.logger.error(`Failed to fetch metadata for ${movie.imdb}`);
              this.logger.error(e);
            }
          }

          // Return the clean, enriched object
          return {
            source: 'APIBay',
            imdb_code: movie.imdb, // Important for the frontend router
            title: movieTitle,     // Clean title (e.g. "Zootopia 2")
            year: movieYear,       // Required by subject
            rating: 0,             // You can extract this from metadata.imdbRating
            thumbnail: posterUrl,  // <--- HERE IS YOUR THUMBNAIL
            torrents: [            // Structure for the video player later
              {
                url: `magnet:?xt=urn:btih:${movie.info_hash}&dn=${encodeURIComponent(movie.name)}`,
                hash: movie.info_hash,
                quality: '1080p', // Heuristic based on raw name or APIBay category
                seeds: parseInt(movie.seeders),
                peers: parseInt(movie.leechers),
                size: parseInt(movie.size),
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
}
