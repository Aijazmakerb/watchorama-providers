import { flags } from '@/main/targets';
import { makeSourcerer } from '@/providers/base';
import { NotFoundError } from '@/utils/errors';

import { Caption, getCaptionTypeFromUrl, labelToLanguageCode } from '../captions';

const vidsrcBase = `https://vidsrc-api-two.vercel.app`;

interface Subtitle {
  file: string;
  label: string;
  kind: string;
}

interface VidsrcResponse {
  source: string | number;
  subtitles: Subtitle[];
}

export const vidsrcScraper = makeSourcerer({
  id: 'vidsrc',
  name: 'Vidsrc',
  rank: 355,
  flags: [flags.NO_CORS],
  async scrapeMovie(ctx) {
    const movieId = ctx.media.tmdbId;

    const data = await ctx.proxiedFetcher<VidsrcResponse>(`/${movieId}`, {
      baseUrl: vidsrcBase,
    });

    if (typeof data.source !== 'string') throw new NotFoundError('api reached its limit');

    const captions: Caption[] = [];
    data.subtitles.forEach((track) => {
      if (track.kind !== 'captions') return;
      const type = getCaptionTypeFromUrl(track.file);
      if (!type) return;
      const language = labelToLanguageCode(track.label);
      if (!language) return;
      captions.push({
        language,
        hasCorsRestrictions: false,
        type,
        url: track.file,
      });
    });

    return {
      embeds: [],
      stream: {
        captions,
        playlist: data.source,
        type: 'hls',
        flags: [flags.NO_CORS],
      },
    };
  },
  async scrapeShow(ctx) {
    const showId = ctx.media.imdbId;
    const seasonNumber = ctx.media.season.number;
    const episodeNumber = ctx.media.episode.number;

    const data = await ctx.proxiedFetcher<VidsrcResponse>(`/${showId}/${seasonNumber}/${episodeNumber}`, {
      baseUrl: vidsrcBase,
    });

    if (typeof data.source !== 'string') throw new NotFoundError('api reached its limit');

    const captions: Caption[] = [];
    data.subtitles.forEach((track) => {
      if (track.kind !== 'captions') return;
      const type = getCaptionTypeFromUrl(track.file);
      if (!type) return;
      const language = labelToLanguageCode(track.label);
      if (!language) return;
      captions.push({
        language,
        hasCorsRestrictions: false,
        type,
        url: track.file,
      });
    });

    return {
      embeds: [],
      stream: {
        captions: [],
        playlist: '',
        type: 'hls',
        flags: [flags.NO_CORS],
      },
    };
  },
});
