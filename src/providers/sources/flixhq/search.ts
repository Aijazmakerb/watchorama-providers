import { load } from 'cheerio';

import { IMovieResult, MovieMedia, ShowMedia } from '@/main/media';
import { flixHqBase } from '@/providers/sources/flixhq/common';
import { compareMedia, getSimilarityBetweenStrings } from '@/utils/compare';
import { ScrapeContext } from '@/utils/context';

export async function getFlixhqId(ctx: ScrapeContext, media: MovieMedia | ShowMedia): Promise<string | null> {
  const title = media.title.replace(/[^a-zA-Z0-9 -]/g, '').toLowerCase();
  const searchResults = await ctx.proxiedFetcher<string>(`/search/${title.replace(/[\W_]+/g, '-')}`, {
    baseUrl: flixHqBase,
  });

  let results: IMovieResult[] = [];

  const doc = load(searchResults);

  doc('.film_list-wrap > div.flw-item').each((i, el) => {
    const query = doc(el);

    const releaseDate = query.find('div.film-detail > div.fd-infor > span:nth-child(1)').text();
    results.push({
      id: query.find('div.film-poster > a').attr('href')?.slice(1) || '',
      title: query.find('div.film-detail > h2 > a').attr('title') || '',
      year: Number.isNaN(parseInt(releaseDate, 10)) ? undefined : parseInt(releaseDate, 10),
      seasons: releaseDate.includes('SS') ? parseInt(releaseDate.split('SS')[1], 10) : undefined,
      type: query.find('div.film-detail > div.fd-infor > span.float-right').text() === 'Movie' ? 'movie' : 'show',
    });
  });

  if (results.length === 0) return null;

  results.sort((a, b) => {
    const targetTitle = title;

    const firstTitle: string = typeof a.title === 'string' ? a.title : '';
    const secondTitle: string = typeof b.title === 'string' ? b.title : '';

    const firstRating = getSimilarityBetweenStrings(targetTitle, firstTitle.toLowerCase());
    const secondRating = getSimilarityBetweenStrings(targetTitle, secondTitle.toLowerCase());

    return secondRating - firstRating;
  });

  results = results.filter((result) =>
    media.type === 'movie' ? result.type === 'movie' : media.type === 'show' ? result.type === 'show' : true,
  );

  if (media && (media as ShowMedia).season && media.type === 'show') {
    results = results.filter((result) => {
      const totalSeasons = (result.seasons as number) || 0;
      const extraDataSeasons = (media.totalSeasons as number) || 0;
      return (
        totalSeasons === extraDataSeasons ||
        totalSeasons === extraDataSeasons + 1 ||
        totalSeasons === extraDataSeasons - 1
      );
    });
  }

  if (results[0].type === 'movie' && compareMedia(media, results[0].title, results[0].year)) return results[0].id;
  if (results[0].type === 'show') return results[0].id;
  return null;
}
