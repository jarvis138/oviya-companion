import { searchGiphy, getRandomGif, getContextualGif, GIF_EMOTIONS } from '../services/api';

export async function searchGif(query: string): Promise<string | null> {
  try {
    const gifs = await searchGiphy(query, { limit: 10, rating: 'g' });
    
    if (gifs.length === 0) {
      return await getRandomGif(query);
    }
    
    const randomIndex = Math.floor(Math.random() * Math.min(5, gifs.length));
    return gifs[randomIndex].images.fixed_height.url;
  } catch (error) {
    console.error('Failed to fetch GIF:', error);
    return null;
  }
}

export { GIF_EMOTIONS, getContextualGif };

export function getGifQuery(emotion: keyof typeof GIF_EMOTIONS): string {
  const queries = GIF_EMOTIONS[emotion];
  return queries[Math.floor(Math.random() * queries.length)];
}
