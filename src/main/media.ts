export type CommonMedia = {
  title: string;
  releaseYear: number;
  imdbId?: string;
  tmdbId: string;
};

export type MediaTypes = 'show' | 'movie';

export type ShowMedia = CommonMedia & {
  type: 'show';
  totalSeasons: number;
  episode: {
    number: number;
    tmdbId: string;
  };
  season: {
    number: number;
    tmdbId: string;
  };
};

export type MovieMedia = CommonMedia & {
  type: 'movie';
};

export interface IMovieResult {
  id: string;
  title: string;
  year?: number;
  type?: MediaTypes;
  seasons: number | undefined;
}

export type ScrapeMedia = ShowMedia | MovieMedia;
