const GIPHY_API_KEY = 'l3MLtCTvVv9rxfVd3T6XaEmxuZjF2quS';
const TMDB_API_KEY = 'bb6444cf69a7114d8720ef5859d2722c';
const TMDB_READ_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiYjY0NDRjZjY5YTcxMTRkODcyMGVmNTg1OWQyNzIyYyIsIm5iZiI6MTc2MjE5NjUyNy43MzIsInN1YiI6IjY5MDhmYzJmYWYwODI0MTQxM2RkOGI3MCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Ub4ZHtBJJbxuddcejWETYfNjPJw66HtcuXkQ0_8hWR8';

export type GiphyGif = {
  id: string;
  url: string;
  title: string;
  images: {
    original: {
      url: string;
      width: string;
      height: string;
    };
    downsized: {
      url: string;
      width: string;
      height: string;
    };
    fixed_height: {
      url: string;
      width: string;
      height: string;
    };
  };
};

export type TMDBMovie = {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
};

export type TMDBGenre = {
  id: number;
  name: string;
};

export async function searchGiphy(
  query: string,
  options: {
    limit?: number;
    offset?: number;
    rating?: 'g' | 'pg' | 'pg-13' | 'r';
    lang?: string;
  } = {}
): Promise<GiphyGif[]> {
  try {
    const {
      limit = 25,
      offset = 0,
      rating = 'g',
      lang = 'en',
    } = options;

    const params = new URLSearchParams({
      api_key: GIPHY_API_KEY,
      q: query,
      limit: limit.toString(),
      offset: offset.toString(),
      rating,
      lang,
      bundle: 'messaging_non_clips',
    });

    const response = await fetch(
      `https://api.giphy.com/v1/gifs/search?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`GIPHY API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.data || !Array.isArray(data.data)) {
      return [];
    }

    return data.data.map((gif: any) => ({
      id: gif.id,
      url: gif.url,
      title: gif.title,
      images: {
        original: {
          url: gif.images.original.url,
          width: gif.images.original.width,
          height: gif.images.original.height,
        },
        downsized: {
          url: gif.images.downsized.url,
          width: gif.images.downsized.width,
          height: gif.images.downsized.height,
        },
        fixed_height: {
          url: gif.images.fixed_height.url,
          width: gif.images.fixed_height.width,
          height: gif.images.fixed_height.height,
        },
      },
    }));
  } catch (error) {
    console.error('Failed to search GIPHY:', error);
    return [];
  }
}

export async function getTrendingGiphy(
  options: {
    limit?: number;
    offset?: number;
    rating?: 'g' | 'pg' | 'pg-13' | 'r';
  } = {}
): Promise<GiphyGif[]> {
  try {
    const {
      limit = 25,
      offset = 0,
      rating = 'g',
    } = options;

    const params = new URLSearchParams({
      api_key: GIPHY_API_KEY,
      limit: limit.toString(),
      offset: offset.toString(),
      rating,
      bundle: 'messaging_non_clips',
    });

    const response = await fetch(
      `https://api.giphy.com/v1/gifs/trending?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`GIPHY API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.data || !Array.isArray(data.data)) {
      return [];
    }

    return data.data.map((gif: any) => ({
      id: gif.id,
      url: gif.url,
      title: gif.title,
      images: {
        original: {
          url: gif.images.original.url,
          width: gif.images.original.width,
          height: gif.images.original.height,
        },
        downsized: {
          url: gif.images.downsized.url,
          width: gif.images.downsized.width,
          height: gif.images.downsized.height,
        },
        fixed_height: {
          url: gif.images.fixed_height.url,
          width: gif.images.fixed_height.width,
          height: gif.images.fixed_height.height,
        },
      },
    }));
  } catch (error) {
    console.error('Failed to get trending GIPHY:', error);
    return [];
  }
}

export async function getRandomGif(tag?: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      api_key: GIPHY_API_KEY,
      rating: 'g',
    });

    if (tag) {
      params.append('tag', tag);
    }

    const response = await fetch(
      `https://api.giphy.com/v1/gifs/random?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`GIPHY API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.data && data.data.images && data.data.images.fixed_height) {
      return data.data.images.fixed_height.url;
    }

    return null;
  } catch (error) {
    console.error('Failed to get random GIF:', error);
    return null;
  }
}

export async function searchMovies(
  query: string,
  options: {
    language?: string;
    page?: number;
    include_adult?: boolean;
    year?: number;
  } = {}
): Promise<TMDBMovie[]> {
  try {
    const {
      language = 'en-US',
      page = 1,
      include_adult = false,
      year,
    } = options;

    const params = new URLSearchParams({
      query,
      language,
      page: page.toString(),
      include_adult: include_adult.toString(),
    });

    if (year) {
      params.append('year', year.toString());
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
          accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results;
  } catch (error) {
    console.error('Failed to search movies:', error);
    return [];
  }
}

export async function getTrendingMovies(
  timeWindow: 'day' | 'week' = 'week',
  language: string = 'en-US'
): Promise<TMDBMovie[]> {
  try {
    const params = new URLSearchParams({
      language,
    });

    const response = await fetch(
      `https://api.themoviedb.org/3/trending/movie/${timeWindow}?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
          accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results;
  } catch (error) {
    console.error('Failed to get trending movies:', error);
    return [];
  }
}

export async function getMovieDetails(
  movieId: number,
  language: string = 'en-US'
): Promise<TMDBMovie | null> {
  try {
    const params = new URLSearchParams({
      language,
    });

    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
          accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get movie details:', error);
    return null;
  }
}

export async function getMovieGenres(
  language: string = 'en-US'
): Promise<TMDBGenre[]> {
  try {
    const params = new URLSearchParams({
      language,
    });

    const response = await fetch(
      `https://api.themoviedb.org/3/genre/movie/list?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
          accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.genres || !Array.isArray(data.genres)) {
      return [];
    }

    return data.genres;
  } catch (error) {
    console.error('Failed to get movie genres:', error);
    return [];
  }
}

export async function discoverMovies(
  options: {
    language?: string;
    page?: number;
    sort_by?: string;
    with_genres?: string;
    year?: number;
    vote_average_gte?: number;
  } = {}
): Promise<TMDBMovie[]> {
  try {
    const {
      language = 'en-US',
      page = 1,
      sort_by = 'popularity.desc',
      with_genres,
      year,
      vote_average_gte,
    } = options;

    const params = new URLSearchParams({
      language,
      page: page.toString(),
      sort_by,
    });

    if (with_genres) {
      params.append('with_genres', with_genres);
    }

    if (year) {
      params.append('primary_release_year', year.toString());
    }

    if (vote_average_gte) {
      params.append('vote_average.gte', vote_average_gte.toString());
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/discover/movie?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
          accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results;
  } catch (error) {
    console.error('Failed to discover movies:', error);
    return [];
  }
}

export function getTMDBImageUrl(
  path: string | null,
  size: 'w200' | 'w300' | 'w400' | 'w500' | 'original' = 'w500'
): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export const GIF_EMOTIONS = {
  celebration: ['celebration', 'party', 'happy dance', 'excited', 'yay'],
  support: ['hug', 'support', 'comfort', 'here for you', 'caring'],
  laughing: ['laughing', 'lol', 'funny', 'hilarious', 'haha'],
  love: ['love', 'heart', 'caring', 'affection', 'wholesome'],
  thinking: ['thinking', 'hmm', 'pondering', 'confused'],
  encouraging: ['you got this', 'motivation', 'encouragement', 'believe'],
  solidarity: ['solidarity', 'together', 'team', 'friendship'],
  playful: ['playful', 'silly', 'fun', 'cute'],
  surprised: ['shocked', 'surprised', 'wow', 'omg'],
  proud: ['proud', 'well done', 'amazing', 'success'],
};

export async function getContextualGif(emotion: keyof typeof GIF_EMOTIONS): Promise<string | null> {
  const queries = GIF_EMOTIONS[emotion];
  const randomQuery = queries[Math.floor(Math.random() * queries.length)];
  
  const gifs = await searchGiphy(randomQuery, { limit: 10, rating: 'g' });
  
  if (gifs.length === 0) {
    return null;
  }
  
  const randomGif = gifs[Math.floor(Math.random() * Math.min(5, gifs.length))];
  return randomGif.images.fixed_height.url;
}
