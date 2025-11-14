export async function searchGif(query: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&limit=8&contentfilter=high&media_filter=gif`
    );
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const randomIndex = Math.floor(Math.random() * Math.min(3, data.results.length));
      const gif = data.results[randomIndex];
      return gif.media_formats.gif.url;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to fetch GIF:', error);
    return null;
  }
}

export const GIF_EMOTIONS = {
  celebration: ['celebration', 'party', 'happy dance', 'excited'],
  support: ['hug', 'support', 'comfort', 'here for you'],
  laughing: ['laughing', 'lol', 'funny', 'hilarious'],
  love: ['love', 'heart', 'caring', 'affection'],
  thinking: ['thinking', 'hmm', 'pondering'],
  encouraging: ['you got this', 'motivation', 'encouragement'],
  solidarity: ['solidarity', 'together', 'team'],
  playful: ['playful', 'silly', 'fun'],
};

export function getGifQuery(emotion: keyof typeof GIF_EMOTIONS): string {
  const queries = GIF_EMOTIONS[emotion];
  return queries[Math.floor(Math.random() * queries.length)];
}
