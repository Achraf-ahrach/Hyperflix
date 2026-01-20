
export interface MovieThumbnailDTO {
    id: number;
    source: 'YTS' | 'PirateBay';
    title: string;
    year: number;
    rated: string;
    cover_image: string;
    runtime: string;
    genre: string;
    released: string;
    imdbRating: string;
    isWatched: boolean;
}

export interface MovieDetailDTO {
    id: number;
    source: 'YTS' | 'PirateBay';
    title: string;
    year: number;
    rated: string; // PG, R, PG-13, etc.
    cover_image: string;
    runtime: string;
    genre: string;
    released: string; // Released date
    director: string;
    writer: string;
    actors: string;
    plot: string;
    language: string;
    country: string;
    awards: string;
    poster: string;
    rating: [
        {
            source: string;
            value: string;
        }
    ]
    metascore: string;
    imdbRating: string;
    imdbVotes: string;
    imdbCode: string; 
    type: string;
    dvd: string;
    boxOffice: string;
    production: string;
    website: string;
    response: string;
    isWatched: boolean;
}