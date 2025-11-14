import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, TrendingUp, Award, Lightbulb, CheckCircle } from 'lucide-react-native';
import { router, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors, { getColorsForMood } from '../constants/colors';
import { useChat } from '../contexts/ChatContext';
import { 
  getStrengthPatterns, 
  generateStrengthInsight, 
  generateGrowthInvitation,
  type StrengthPattern 
} from '../utils/strengthTracking';

export default function StrengthsScreen() {
  const { currentMood } = useChat();
  const [patterns, setPatterns] = useState<StrengthPattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const moodColors = getColorsForMood(currentMood);

  useEffect(() => {
    loadStrengthPatterns();
  }, []);

  const loadStrengthPatterns = async () => {
    setIsLoading(true);
    try {
      const data = await getStrengthPatterns();
      setPatterns(data);
    } catch (error) {
      console.error('Failed to load strength patterns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      communication: '#4A90E2',
      emotional: '#FF6B9D',
      analytical: '#50C878',
      creative: '#9B59B6',
      leadership: '#F39C12',
      other: '#95A5A6',
    };
    return colors[category] || colors.other;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      communication: <Lightbulb size={20} color="#FFFFFF" />,
      emotional: <Award size={20} color="#FFFFFF" />,
      analytical: <TrendingUp size={20} color="#FFFFFF" />,
      creative: <Lightbulb size={20} color="#FFFFFF" />,
      leadership: <Award size={20} color="#FFFFFF" />,
      other: <CheckCircle size={20} color="#FFFFFF" />,
    };
    return icons[category] || icons.other;
  };

  const renderPattern = ({ item, index }: { item: StrengthPattern; index: number }) => {
    const categoryColor = getCategoryColor(item.category);
    const insight = generateStrengthInsight(item);
    const invitation = generateGrowthInvitation(item);

    return (
      <View style={styles.patternCard}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
          style={styles.patternCardGradient}
        >
          <View style={styles.patternHeader}>
            <View style={[styles.categoryIcon, { backgroundColor: categoryColor }]}>
              {getCategoryIcon(item.category)}
            </View>
            <View style={styles.patternHeaderText}>
              <Text style={styles.patternStrength}>{item.strength}</Text>
              <View style={styles.patternMeta}>
                <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
                  <Text style={[styles.categoryText, { color: categoryColor }]}>
                    {item.category}
                  </Text>
                </View>
                <Text style={styles.patternCount}>
                  Spotted {item.count}x in 30 days
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.insightSection}>
            <Text style={styles.sectionLabel}>💭 What I've Noticed</Text>
            <Text style={styles.insightText}>{insight}</Text>
          </View>

          <View style={styles.examplesSection}>
            <Text style={styles.sectionLabel}>✨ Evidence</Text>
            {item.examples.slice(0, 2).map((example, i) => (
              <View key={i} style={styles.exampleItem}>
                <View style={[styles.exampleDot, { backgroundColor: categoryColor }]} />
                <Text style={styles.exampleText}>{example}</Text>
              </View>
            ))}
            {item.examples.length > 2 && (
              <Text style={styles.moreExamples}>
                +{item.examples.length - 2} more examples
              </Text>
            )}
          </View>

          <View style={styles.invitationSection}>
            <LinearGradient
              colors={[categoryColor + '15', categoryColor + '08']}
              style={styles.invitationCard}
            >
              <Text style={styles.sectionLabel}>🚀 Growth Invitation</Text>
              <Text style={styles.invitationText}>{invitation}</Text>
            </LinearGradient>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={styles.backgroundWrapper}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <LinearGradient
        colors={[moodColors.gradientStart, moodColors.gradientEnd]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={Colors.light.text} />
          </Pressable>
          <TrendingUp size={24} color={moodColors.accent} />
          <Text style={styles.headerTitle}>Your Strengths</Text>
          <View style={styles.backButton} />
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={moodColors.accent} />
            <Text style={styles.loadingText}>Analyzing your patterns...</Text>
          </View>
        ) : patterns.length === 0 ? (
          <View style={styles.emptyState}>
            <TrendingUp size={64} color={moodColors.accent} />
            <Text style={styles.emptyTitle}>Keep Talking!</Text>
            <Text style={styles.emptyDescription}>
              As we chat more, I'll start noticing patterns in your strengths and talents.
              {'\n\n'}
              I need a bit more time to spot recurring patterns. Keep sharing your thoughts, experiences, and stories! 💜
            </Text>
          </View>
        ) : (
          <FlatList
            data={patterns}
            renderItem={renderPattern}
            keyExtractor={(item, index) => `${item.strength}-${index}`}
            contentContainerStyle={styles.patternsList}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <Text style={styles.listHeaderTitle}>
                  Your Spotted Strengths
                </Text>
                <Text style={styles.listHeaderSubtitle}>
                  These are patterns I&apos;ve noticed over the past 30 days. They&apos;re not random—they&apos;re who you are. 💜
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
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
    gap: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
    flex: 1,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginTop: 24,
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  patternsList: {
    padding: 20,
    paddingBottom: 40,
  },
  listHeader: {
    marginBottom: 24,
  },
  listHeaderTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  listHeaderSubtitle: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  patternCard: {
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  patternCardGradient: {
    padding: 20,
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternHeaderText: {
    flex: 1,
  },
  patternStrength: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  patternMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700' as const,
    textTransform: 'capitalize' as const,
  },
  patternCount: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: '600' as const,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 16,
  },
  insightSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.light.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  insightText: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.light.text,
  },
  examplesSection: {
    marginBottom: 16,
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  exampleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  exampleText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.textSecondary,
  },
  moreExamples: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontStyle: 'italic' as const,
    marginTop: 4,
  },
  invitationSection: {
    marginTop: 4,
  },
  invitationCard: {
    padding: 16,
    borderRadius: 16,
  },
  invitationText: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.light.text,
  },
});
