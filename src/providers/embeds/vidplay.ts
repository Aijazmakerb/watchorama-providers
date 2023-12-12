/* eslint-disable no-use-before-define */
/* eslint-disable no-plusplus */
/* eslint-disable camelcase */
/* eslint-disable no-bitwise */
import { flags } from '@/main/targets';
import { makeEmbed } from '@/providers/base';

interface StreamRes {
  data: {
    status: number;
    result: {
      sources: any[];
      tracks: any[];
    };
  };
}

async function encodeId(v_id: string): Promise<string> {
  const response = await fetch('https://raw.githubusercontent.com/Claudemirovsky/worstsource-keys/keys/keys.json');
  const [key1, key2] = await response.json();
  const decodedId = keyPermutation(key1, v_id);
  const encodedResult = keyPermutation(key2, decodedId);
  const encodedBase64 = btoa(encodedResult);
  return encodedBase64.replace('/', '_');
}

function keyPermutation(key: string, data: any): string {
  const state: number[] = Array.from(Array(256).keys());
  let index1 = 0;
  for (let i = 0; i < 256; i++) {
    index1 = (index1 + state[i] + key.charCodeAt(i % key.length)) % 256;
    const temp = state[i];
    state[i] = state[index1];
    state[index1] = temp;
  }
  index1 = 0;
  let index_2 = 0;
  let final_key = '';
  for (let char = 0; char < data.length; char++) {
    index1 = (index1 + 1) % 256;
    index_2 = (index_2 + state[index1]) % 256;
    const temp = state[index1];
    state[index1] = state[index_2];
    state[index_2] = temp;
    if (typeof data[char] === 'string') {
      final_key += String.fromCharCode(data[char].charCodeAt(0) ^ state[(state[index1] + state[index_2]) % 256]);
    } else if (typeof data[char] === 'number') {
      final_key += String.fromCharCode(data[char] ^ state[(state[index1] + state[index_2]) % 256]);
    }
  }
  return final_key;
}

async function getFutoken(key: string, url: string): Promise<string> {
  const response = await fetch('https://vidplay.site/futoken', { headers: { Referer: url } });
  const responseText = await response.text();
  const match = responseText.match(/var\s+k\s*=\s*'([^']+)'/);
  if (!match || match.length < 2 || match[1] == null) {
    throw new Error('Failed to extract fuKey from the response');
  }
  const fuKey = match[1];
  const fuToken = `${fuKey},${Array.from({ length: key.length }, (_, i) =>
    (fuKey.charCodeAt(i % fuKey.length) + key.charCodeAt(i)).toString(),
  ).join(',')}`;
  return fuToken;
}

export const vidplayScraper = makeEmbed({
  id: 'vidplay',
  name: 'Vidplay',
  rank: 355,
  async scrape(ctx) {
    const key = await encodeId(ctx.url.split('/e/')[1].split('?')[0]);
    const data = await getFutoken(key, ctx.url);

    const response = await ctx.proxiedFetcher<StreamRes>(
      `https://vidplay.site/mediainfo/${data}?${url.split('?')[1]}&autostart=true`,
      {
        headers: {
          Referer: ctx.url,
        },
      },
    );

    const result = response.data.result;

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
