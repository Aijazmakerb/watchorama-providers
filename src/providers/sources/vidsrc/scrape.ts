/* eslint-disable camelcase */
/* eslint-disable no-plusplus */
/* eslint-disable no-bitwise */
import { load } from 'cheerio';
import { decode } from 'html-entities';

import { MovieMedia, ShowMedia } from '@/main/media';
import { vidsrcBase } from '@/providers/sources/vidsrc/common';
import { ScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

interface FetchResponse {
  result: [
    {
      id: string;
      title: string;
    },
  ];
}

interface secondResponse {
  status: number;
  result: {
    url: string;
  };
}

export async function getVidsrcSourceDetails(ctx: ScrapeContext, sourcedId: string) {
  const data = await ctx.proxiedFetcher<secondResponse>(`/ajax/embed/source/${sourcedId}`, {
    baseUrl: vidsrcBase,
  });

  const encryptedSourceUrl = data.result.url;
  // eslint-disable-next-line no-use-before-define
  return decodeURIComponent(decryptSourceUrl(encryptedSourceUrl));
}

export async function getVidsrcSourcesId(ctx: ScrapeContext, id: string) {
  const data = await ctx.proxiedFetcher<string>(`/embed/movie/${id}`, {
    baseUrl: vidsrcBase,
  });

  const doc = load(data);
  const sourcesCode = doc('a[data-id]').attr('data-id');

  return sourcesCode;
}

export async function getVidsrcSources(ctx: ScrapeContext, sourcedId: string | undefined) {
  const data = await ctx.proxiedFetcher<FetchResponse>(`/ajax/embed/episode/${sourcedId}/sources`, {
    baseUrl: vidsrcBase,
  });

  return data;
}

function adecode(buffer: Buffer): Buffer {
  const keyBytes = Buffer.from('8z5Ag5wgagfsOuhz', 'utf-8');
  let j = 0;
  const s = Buffer.alloc(256).map((_, index) => index);

  for (let i = 0; i < 256; i++) {
    j = (j + s[i] + keyBytes[i % keyBytes.length]) & 0xff;
    [s[i], s[j]] = [s[j], s[i]];
  }

  const decoded = Buffer.alloc(buffer.length);
  let i = 0;
  let k = 0;

  for (let index = 0; index < buffer.length; index++) {
    i = (i + 1) & 0xff;
    k = (k + s[i]) & 0xff;
    [s[i], s[k]] = [s[k], s[i]];
    const t = (s[i] + s[k]) & 0xff;
    decoded[index] = buffer[index] ^ s[t];
  }

  return decoded;
}

function decodeBase64UrlSafe(s: string) {
  const standardized_input = s.replace('_', '/').replace('-', '+');

  const binaryData = Buffer.from(standardized_input, 'base64');
  return Buffer.from(binaryData);
}

function decryptSourceUrl(sourceUrl: string) {
  const encoded = decodeBase64UrlSafe(sourceUrl);
  const decoded = adecode(encoded);
  const decodedText = decoded.toString('utf-8');

  return decode(decodedText);
}
