import {
  searchMovies,
  getTrendingMovies,
  discoverMovies,
  getMovieGenres,
  getTMDBImageUrl,
  type TMDBMovie,
  type TMDBGenre,
} from '../services/api';
import { matchBollywoodMoment, type BollywoodMoment } from '../constants/bollywood';

export type MovieRecommendation = {
  movie: TMDBMovie;
  reason: string;
  poster: string | null;
  bollywoodConnection?: BollywoodMoment;
};

export type UserMood =
  | 'happy'
  | 'sad'
  | 'stressed'
  | 'romantic'
  | 'adventurous'
  | 'thoughtful'
  | 'energetic';

const MOOD_TO_GENRES: Record<UserMood, number[]> = {
  happy: [35, 10751, 16],
  sad: [18, 10749],
  stressed: [35, 10751, 16, 14],
  romantic: [10749],
  adventurous: [12, 28, 878],
  thoughtful: [18, 99, 36],
  energetic: [28, 12, 53],
};

const GENRE_NAMES: Record<number, string> = {
  12: 'Adventure',
  14: 'Fantasy',
  16: 'Animation',
  18: 'Drama',
  27: 'Horror',
  28: 'Action',
  35: 'Comedy',
  36: 'History',
  37: 'Western',
  53: 'Thriller',
  80: 'Crime',
  99: 'Documentary',
  878: 'Science Fiction',
  9648: 'Mystery',
  10402: 'Music',
  10749: 'Romance',
  10751: 'Family',
  10752: 'War',
  10770: 'TV Movie',
};

export async function getMovieRecommendationsForMood(
  mood: UserMood,
  limit: number = 3
): Promise<MovieRecommendation[]> {
  try {
    const genreIds = MOOD_TO_GENRES[mood];
    const genreString = genreIds.join(',');

    const movies = await discoverMovies({
      with_genres: genreString,
      sort_by: 'vote_average.desc',
      vote_average_gte: 7.0,
      page: 1,
    });

    if (movies.length === 0) {
      return [];
    }

    const selectedMovies = movies
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);

    return selectedMovies.map((movie) => ({
      movie,
      reason: getReasonForMood(mood, movie),
      poster: getTMDBImageUrl(movie.poster_path, 'w300'),
    }));
  } catch (error) {
    console.error('Failed to get movie recommendations:', error);
    return [];
  }
}

function getReasonForMood(mood: UserMood, movie: TMDBMovie): string {
  const reasons: Record<UserMood, string[]> = {
    happy: [
      `This will keep the good vibes going! 🎉`,
      `Perfect for celebrating your mood!`,
      `Light, fun, and exactly what you need right now.`,
    ],
    sad: [
      `Sometimes we need a good emotional release. This one's cathartic. 💜`,
      `This film gets it. Let yourself feel.`,
      `A beautiful story that honors what you're feeling.`,
    ],
    stressed: [
      `This will help you escape for a bit. You need this. 🌟`,
      `Light and soothing - perfect stress relief.`,
      `Sometimes we need to laugh. This delivers.`,
    ],
    romantic: [
      `Your heart needs this right now. 💕`,
      `A love story that'll make you believe in romance.`,
      `Beautiful, tender, and exactly what you're craving.`,
    ],
    adventurous: [
      `Ready for an adventure? This delivers! 🚀`,
      `Epic journey ahead - buckle up!`,
      `This will satisfy that thirst for adventure.`,
    ],
    thoughtful: [
      `This will give you a lot to think about. 🤔`,
      `Deep, meaningful, and thought-provoking.`,
      `A film that'll stay with you long after.`,
    ],
    energetic: [
      `High energy, high stakes - let's GO! ⚡`,
      `This matches your energy perfectly!`,
      `Fast-paced and thrilling - exactly what you need.`,
    ],
  };

  const moodReasons = reasons[mood];
  return moodReasons[Math.floor(Math.random() * moodReasons.length)];
}

export async function searchBollywoodMovies(query: string): Promise<TMDBMovie[]> {
  try {
    const movies = await searchMovies(query, {
      language: 'hi-IN',
      include_adult: false,
    });
    return movies;
  } catch (error) {
    console.error('Failed to search Bollywood movies:', error);
    return [];
  }
}

export async function getTrendingBollywoodMovies(): Promise<TMDBMovie[]> {
  try {
    const movies = await getTrendingMovies('week', 'hi-IN');
    return movies;
  } catch (error) {
    console.error('Failed to get trending Bollywood movies:', error);
    return [];
  }
}

export async function getMovieRecommendationWithQuote(
  userEmotion: string,
  situation: string
): Promise<{ movie: TMDBMovie | null; quote: BollywoodMoment | null; reason: string }> {
  const bollywoodMoment = matchBollywoodMoment(userEmotion, situation);

  if (!bollywoodMoment) {
    return { movie: null, quote: null, reason: '' };
  }

  try {
    const movies = await searchMovies(bollywoodMoment.movie, {
      language: 'hi-IN',
      include_adult: false,
    });

    if (movies.length === 0) {
      return {
        movie: null,
        quote: bollywoodMoment,
        reason: `Perfect quote from ${bollywoodMoment.movie}!`,
      };
    }

    return {
      movie: movies[0],
      quote: bollywoodMoment,
      reason: `This dialogue from ${bollywoodMoment.movie} captures exactly what you're going through. Maybe time for a rewatch? 🎬`,
    };
  } catch (error) {
    console.error('Failed to get movie with quote:', error);
    return {
      movie: null,
      quote: bollywoodMoment,
      reason: `Perfect quote from ${bollywoodMoment.movie}!`,
    };
  }
}

export async function getAllGenres(): Promise<TMDBGenre[]> {
  try {
    return await getMovieGenres();
  } catch (error) {
    console.error('Failed to get genres:', error);
    return [];
  }
}

export function getGenreName(genreId: number): string {
  return GENRE_NAMES[genreId] || 'Unknown';
}

export async function getPersonalizedMoviePackage(
  userPreferences: {
    favoriteGenres?: number[];
    mood?: UserMood;
    recentlyWatched?: string[];
  }
): Promise<MovieRecommendation[]> {
  try {
    const recommendations: MovieRecommendation[] = [];

    if (userPreferences.mood) {
      const moodMovies = await getMovieRecommendationsForMood(
        userPreferences.mood,
        2
      );
      recommendations.push(...moodMovies);
    }

    if (userPreferences.favoriteGenres && userPreferences.favoriteGenres.length > 0) {
      const genreString = userPreferences.favoriteGenres.join(',');
      const genreMovies = await discoverMovies({
        with_genres: genreString,
        sort_by: 'popularity.desc',
        vote_average_gte: 7.5,
        page: 1,
      });

      const selectedGenreMovies = genreMovies.slice(0, 2).map((movie) => ({
        movie,
        reason: `Based on your favorite genres, I think you'll love this! 🎬`,
        poster: getTMDBImageUrl(movie.poster_path, 'w300'),
      }));

      recommendations.push(...selectedGenreMovies);
    }

    const trendingMovies = await getTrendingMovies('week');
    const trendingPick = trendingMovies[0];
    if (trendingPick) {
      recommendations.push({
        movie: trendingPick,
        reason: `Everyone's talking about this one. Worth checking out! 🔥`,
        poster: getTMDBImageUrl(trendingPick.poster_path, 'w300'),
      });
    }

    return recommendations.slice(0, 5);
  } catch (error) {
    console.error('Failed to get personalized movie package:', error);
    return [];
  }
}
