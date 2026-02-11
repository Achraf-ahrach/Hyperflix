

export interface Movie {
    //   id: number;
    source: string;
    imdb_code: string;
    title: string;
    year: number | null;
    rating: number;
    thumbnail: string | null;
    synopsis?: string;
    runtime?: number;
    mpa_rating?: string;
    genres?: string[];
    background_image?: string;
    torrents: {
        url: string;
        hash: string;
        quality: string;
        seeds: number;
        peers: number;
        size: number;
    }[];
    watched?: boolean;
    director?: string;
    writer?: string;
    actors?: string;
    production?: string;
    country?: string;
    language?: string;
    awards?: string;
}
