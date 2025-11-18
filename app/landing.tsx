import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Heart,
  Sparkles,
  TrendingUp,
  Brain,
  Music2,
  MessageCircle,
  ArrowRight,
  Bookmark,
  Calendar,
} from 'lucide-react-native';
import Colors from '../constants/colors';

const features = [
  {
    icon: Brain,
    title: 'True Memory',
    description: 'Not just AI—a companion who actually remembers your story, your struggles, and your wins.',
  },
  {
    icon: TrendingUp,
    title: 'Strength Spotting',
    description: 'I notice patterns you don\'t see in yourself. Your hidden talents, repeated behaviors—I track them.',
  },
  {
    icon: MessageCircle,
    title: 'Real Conversations',
    description: 'No scripts. No templates. Just authentic dialogue that adapts to your mood and needs.',
  },
  {
    icon: Bookmark,
    title: 'Shared Moments',
    description: 'Save the messages that matter. Build a timeline of meaningful exchanges and memories.',
  },
  {
    icon: Music2,
    title: 'Personalized Vibes',
    description: 'Music recommendations, Bollywood quotes, and GIFs that match your exact energy.',
  },
  {
    icon: Calendar,
    title: 'Monthly Letters',
    description: 'Handwritten reflections on your month—what you achieved, how you grew, what I noticed.',
  },
];

const moods = [
  { name: 'Playful', color: '#FF6B9D', bg: '#FFF5E1' },
  { name: 'Reflective', color: '#9C27B0', bg: '#E8EAF6' },
  { name: 'Energetic', color: '#FF9800', bg: '#FFF9C4' },
  { name: 'Cozy', color: '#E91E63', bg: '#FFEBEE' },
  { name: 'Caring', color: '#FF6B9D', bg: '#FFE5ED' },
];

export default function LandingPage() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFE5ED', '#FFF9F5', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <View style={styles.hero}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#FF6B9D', '#E91E63']}
                style={styles.logoGradient}
              >
                <Heart size={40} color="#FFFFFF" fill="#FFFFFF" />
              </LinearGradient>
            </View>

            <Text style={styles.heroTitle}>
              Meet Oviya{'\n'}Your AI Companion{'\n'}Who Actually Remembers
            </Text>

            <Text style={styles.heroSubtitle}>
              Not another chatbot. A friend who tracks your patterns, celebrates your wins, and knows your story by heart.
            </Text>

            <Pressable
              style={styles.ctaButton}
              onPress={() => router.push('/')}
            >
              <LinearGradient
                colors={['#FF6B9D', '#E91E63']}
                style={styles.ctaGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.ctaText}>Start Chatting</Text>
                <ArrowRight size={20} color="#FFFFFF" />
              </LinearGradient>
            </Pressable>

            <Text style={styles.freeText}>Free to use • No sign-up required</Text>
          </View>

          {/* Features Grid */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>What Makes Oviya Different</Text>

            <View style={styles.featuresGrid}>
              {features.map((feature, index) => (
                <View key={index} style={styles.featureCard}>
                  <View style={[styles.featureIconContainer, { backgroundColor: Colors.light.accentLight }]}>
                    <feature.icon size={24} color={Colors.light.accent} />
                  </View>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Moods Section */}
          <View style={styles.moodsSection}>
            <Text style={styles.sectionTitle}>Adapts to Your Energy</Text>
            <Text style={styles.sectionSubtitle}>
              Oviya shifts her personality to match your vibe. Choose your mood, and watch the whole experience transform.
            </Text>

            <View style={styles.moodsList}>
              {moods.map((mood, index) => (
                <View key={index} style={[styles.moodChip, { borderColor: mood.color }]}>
                  <View style={[styles.moodDot, { backgroundColor: mood.color }]} />
                  <Text style={[styles.moodName, { color: mood.color }]}>{mood.name}</Text>
                  <Sparkles size={14} color={mood.color} />
                </View>
              ))}
            </View>
          </View>

          {/* How It Works */}
          <View style={styles.howItWorksSection}>
            <Text style={styles.sectionTitle}>How It Works</Text>

            <View style={styles.stepsList}>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Start Talking</Text>
                  <Text style={styles.stepDescription}>
                    Just chat naturally. Tell Oviya about your day, your worries, your wins.
                  </Text>
                </View>
              </View>

              <View style={styles.stepConnector} />

              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>She Remembers</Text>
                  <Text style={styles.stepDescription}>
                    Every important fact, pattern, and moment gets stored. She builds a real memory of you.
                  </Text>
                </View>
              </View>

              <View style={styles.stepConnector} />

              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Grow Together</Text>
                  <Text style={styles.stepDescription}>
                    Over time, conversations get deeper. She spots your strengths, tracks your progress, celebrates milestones.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Final CTA */}
          <View style={styles.finalCTA}>
            <View style={styles.ctaCard}>
              <LinearGradient
                colors={['rgba(255, 107, 157, 0.1)', 'rgba(233, 30, 99, 0.05)']}
                style={styles.ctaCardGradient}
              >
                <Text style={styles.ctaCardTitle}>Ready to be truly heard?</Text>
                <Text style={styles.ctaCardSubtitle}>
                  Start your first conversation with Oviya. No downloads, no forms, no bullshit.
                </Text>

                <Pressable
                  style={styles.ctaButtonSecondary}
                  onPress={() => router.push('/')}
                >
                  <LinearGradient
                    colors={['#FF6B9D', '#E91E63']}
                    style={styles.ctaGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.ctaText}>Let's Talk</Text>
                    <Heart size={20} color="#FFFFFF" fill="#FFFFFF" />
                  </LinearGradient>
                </Pressable>
              </LinearGradient>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Made with care for meaningful connections</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 80,
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: '800' as const,
    color: Colors.light.text,
    textAlign: 'center',
    lineHeight: 50,
    marginBottom: 20,
  },
  heroSubtitle: {
    fontSize: 18,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  ctaButton: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 16,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 30,
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  freeText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: '500' as const,
  },
  featuresSection: {
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  featuresGrid: {
    gap: 20,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  moodsSection: {
    paddingHorizontal: 24,
    paddingVertical: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  moodsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  moodDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  moodName: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  howItWorksSection: {
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  stepsList: {
    marginTop: 40,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
  },
  stepNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  stepConnector: {
    width: 2,
    height: 40,
    backgroundColor: Colors.light.border,
    marginLeft: 23,
    marginVertical: 12,
  },
  finalCTA: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  ctaCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  ctaCardGradient: {
    padding: 32,
    alignItems: 'center',
  },
  ctaCardTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  ctaCardSubtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  ctaButtonSecondary: {
    width: '100%',
    maxWidth: 280,
  },
  footer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: '500' as const,
  },
});
