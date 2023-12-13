import { flags } from '@/main/targets';
import { makeEmbed } from '@/providers/base';
import { StreamRes, encodeId, getFutoken } from '@/providers/sources/vidsrc/common';

export const vidplayScraper = makeEmbed({
  id: 'vidplay',
  name: 'Vidplay',
  rank: 355,
  async scrape(ctx) {
    const key = await encodeId(ctx.url.split('/e/')[1].split('?')[0]);
    const data = await getFutoken(key, ctx.url);

    const response = await ctx.proxiedFetcher<StreamRes>(
      `https://vidplay.site/mediainfo/${data}?${ctx.url.split('?')[1]}&autostart=true`,
      {
        headers: {
          Referer: ctx.url,
        },
      },
    );

    const result = response.result;

    if (!result && typeof result !== 'object') {
      throw new Error('video source not found');
    }

    return {
      stream: {
        type: 'hls',
        playlist: result.sources[0].file,
        flags: [flags.NO_CORS],
        captions: [],
      },
    };
  },
});
