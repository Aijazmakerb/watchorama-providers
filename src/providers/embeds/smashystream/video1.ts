import { flags } from '@/main/targets';
import { makeEmbed } from '@/providers/base';
import { Caption, getCaptionTypeFromUrl, labelToLanguageCode } from '@/providers/captions';

type FPlayerResponse = {
  sourceUrls: string[];
  subtitleUrls: string;
};

export const smashyStreamFScraper = makeEmbed({
  id: 'smashystream-f',
  name: 'SmashyStream (F)',
  rank: 400,
  async scrape(ctx) {
    const response = await fetch(`https://simple-proxy.786aijazusmaan.workers.dev/?destination=${ctx.url}`, {
      headers: {
        Referer: ctx.url,
      },
    });

    const res: FPlayerResponse = await response.json();

    const captions: Caption[] =
      res.subtitleUrls
        .match(/\[([^\]]+)\](https?:\/\/\S+?)(?=,\[|$)/g)
        ?.map<Caption | null>((entry: string) => {
          const match = entry.match(/\[([^\]]+)\](https?:\/\/\S+?)(?=,\[|$)/);
          if (match) {
            const [, language, url] = match;
            if (language && url) {
              const languageCode = labelToLanguageCode(language);
              const captionType = getCaptionTypeFromUrl(url);
              if (!languageCode || !captionType) return null;
              return {
                url: url.replace(',', ''),
                language: languageCode,
                type: captionType,
                hasCorsRestrictions: false,
              };
            }
          }
          return null;
        })
        .filter((x): x is Caption => x !== null) ?? [];

    return {
      stream: {
        playlist: res.sourceUrls[0],
        type: 'hls',
        flags: [flags.NO_CORS],
        captions,
      },
    };
  },
});
