import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Film, Star } from 'lucide-react-native';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Colors, { getColorsForMood } from '../constants/colors';
import { ChatProvider, useChat } from '../contexts/ChatContext';
import {
  getMovieRecommendationsForMood,
  getTrendingBollywoodMovies,
  type MovieRecommendation,
  type UserMood,
} from '../utils/movieRecommendations';
import type { TMDBMovie } from '../services/api';

const MOOD_MAPPING = {
  playful: 'happy' as UserMood,
  reflective: 'thoughtful' as UserMood,
  energetic: 'energetic' as UserMood,
  cozy: 'romantic' as UserMood,
  caring: 'happy' as UserMood,
};

function MoviesScreen() {
  const { currentMood } = useChat();
  const insets = useSafeAreaInsets();
  const [recommendations, setRecommendations] = useState<MovieRecommendation[]>([]);
  const [bollywoodTrending, setBollywoodTrending] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      const userMood = MOOD_MAPPING[currentMood] || 'happy';
      const [moodRecs, trending] = await Promise.all([
        getMovieRecommendationsForMood(userMood, 5),
        getTrendingBollywoodMovies(),
      ]);

      setRecommendations(moodRecs);
      setBollywoodTrending(trending.slice(0, 5));
    } catch (error) {
      console.error('Failed to load movie recommendations:', error);
    } finally {
      setLoading(false);
    }
  }, [currentMood]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const moodColors = getColorsForMood(currentMood);

  if (loading) {
    return (
      <View style={styles.backgroundWrapper}>
        <LinearGradient
          colors={[moodColors.gradientStart, moodColors.gradientEnd]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.safeArea, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={Colors.light.text} />
            </Pressable>
            <Text style={styles.headerTitle}>Movie Recommendations</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={moodColors.accent} />
            <Text style={styles.loadingText}>Finding perfect movies for you...</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.backgroundWrapper}>
      <LinearGradient
        colors={[moodColors.gradientStart, moodColors.gradientEnd]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.light.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Movie Recommendations</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Film size={20} color={moodColors.accent} />
              <Text style={[styles.sectionTitle, { color: moodColors.accent }]}>
                Based on Your {currentMood} Mood
              </Text>
            </View>
            <Text style={styles.sectionDescription}>
              I picked these for you based on how you&apos;re feeling right now 💜
            </Text>

            {recommendations.length === 0 ? (
              <View style={styles.emptyState}>
                <Film size={48} color={Colors.light.textSecondary} />
                <Text style={styles.emptyText}>
                  Hmm, couldn&apos;t load recommendations right now. Try again in a bit!
                </Text>
              </View>
            ) : (
              <View style={styles.movieList}>
                {recommendations.map((rec, index) => (
                  <MovieCard
                    key={`rec-${index}`}
                    movie={rec.movie}
                    reason={rec.reason}
                    poster={rec.poster}
                    accentColor={moodColors.accent}
                  />
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Star size={20} color="#FFD700" fill="#FFD700" />
              <Text style={[styles.sectionTitle, { color: '#FFD700' }]}>
                Trending Bollywood
              </Text>
            </View>
            <Text style={styles.sectionDescription}>
              What&apos;s hot in Bollywood right now 🔥
            </Text>

            {bollywoodTrending.length === 0 ? (
              <View style={styles.emptyState}>
                <Film size={48} color={Colors.light.textSecondary} />
                <Text style={styles.emptyText}>
                  Couldn&apos;t load trending movies. Check your connection!
                </Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              >
                {bollywoodTrending.map((movie, index) => (
                  <BollywoodCard key={`trending-${index}`} movie={movie} />
                ))}
              </ScrollView>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

function MovieCard({
  movie,
  reason,
  poster,
  accentColor,
}: {
  movie: TMDBMovie;
  reason: string;
  poster: string | null;
  accentColor: string;
}) {
  return (
    <View style={styles.movieCard}>
      <View style={styles.movieCardContent}>
        {poster ? (
          <Image source={{ uri: poster }} style={styles.moviePoster} />
        ) : (
          <View style={[styles.moviePosterPlaceholder, { backgroundColor: accentColor + '20' }]}>
            <Film size={40} color={accentColor} />
          </View>
        )}
        <View style={styles.movieInfo}>
          <Text style={styles.movieTitle} numberOfLines={2}>
            {movie.title}
          </Text>
          <View style={styles.movieMeta}>
            <Star size={12} color="#FFD700" fill="#FFD700" />
            <Text style={styles.movieRating}>{movie.vote_average.toFixed(1)}</Text>
            <Text style={styles.movieYear}>
              {movie.release_date ? `• ${movie.release_date.split('-')[0]}` : ''}
            </Text>
          </View>
          <Text style={styles.movieOverview} numberOfLines={3}>
            {movie.overview}
          </Text>
          <View style={[styles.reasonBadge, { backgroundColor: accentColor + '15' }]}>
            <Text style={[styles.reasonText, { color: accentColor }]}>{reason}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function BollywoodCard({ movie }: { movie: TMDBMovie }) {
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
    : null;

  return (
    <View style={styles.bollywoodCard}>
      {posterUrl ? (
        <Image source={{ uri: posterUrl }} style={styles.bollywoodPoster} />
      ) : (
        <View style={styles.bollywoodPosterPlaceholder}>
          <Film size={40} color={Colors.light.textSecondary} />
        </View>
      )}
      <View style={styles.bollywoodOverlay}>
        <Text style={styles.bollywoodTitle} numberOfLines={2}>
          {movie.title}
        </Text>
        <View style={styles.bollywoodMeta}>
          <Star size={12} color="#FFD700" fill="#FFD700" />
          <Text style={styles.bollywoodRating}>{movie.vote_average.toFixed(1)}</Text>
        </View>
      </View>
    </View>
  );
}

export default function Movies() {
  return (
    <ChatProvider>
      <MoviesScreen />
    </ChatProvider>
  );
}

const styles = StyleSheet.create({
  backgroundWrapper: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 32,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    textTransform: 'capitalize' as const,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  movieList: {
    gap: 16,
  },
  movieCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  movieCardContent: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  moviePoster: {
    width: 100,
    height: 150,
    borderRadius: 12,
    backgroundColor: Colors.light.cardBg,
  },
  moviePosterPlaceholder: {
    width: 100,
    height: 150,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  movieInfo: {
    flex: 1,
    gap: 8,
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  movieMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  movieRating: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  movieYear: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  movieOverview: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  reasonBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  reasonText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  horizontalList: {
    gap: 12,
    paddingRight: 20,
  },
  bollywoodCard: {
    width: 140,
    height: 210,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.light.cardBg,
  },
  bollywoodPoster: {
    width: '100%',
    height: '100%',
  },
  bollywoodPosterPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.border,
  },
  bollywoodOverlay: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    gap: 4,
  },
  bollywoodTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  bollywoodMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bollywoodRating: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center' as const,
  },
});
