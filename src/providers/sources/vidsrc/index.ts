import { flags } from '@/main/targets';
import { makeSourcerer } from '@/providers/base';
import { getVidsrcSourceDetails, getVidsrcSources, getVidsrcSourcesId } from '@/providers/sources/vidsrc/scrape';
import { NotFoundError } from '@/utils/errors';

export const vidsrcScraper = makeSourcerer({
  id: 'vidsrc',
  name: 'VidSrc',
  rank: 355,
  flags: [flags.NO_CORS],
  async scrapeMovie(ctx) {
    const sourcesId = await getVidsrcSourcesId(ctx, ctx.media.tmdbId);
    const sources = await getVidsrcSources(ctx, sourcesId);

    const vidplay = sources.result.find((v) => v.title.toLowerCase() === 'vidplay');
    if (!vidplay) throw new NotFoundError('vidplay stream not found for vidsrc');

    return {
      embeds: [
        {
          embedId: 'vidplay',
          url: await getVidsrcSourceDetails(ctx, vidplay.id),
        },
      ],
    };
  },
});
