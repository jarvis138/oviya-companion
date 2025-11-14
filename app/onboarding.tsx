import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Heart, ArrowRight, MessageCircle, Sparkles, TrendingUp } from 'lucide-react-native';
import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const ONBOARDING_SCREENS = [
  {
    id: 1,
    icon: Heart,
    title: 'Meet Oviya',
    subtitle: 'Your AI Companion',
    description: 'Think of me as that friend who actually remembers everything you tell them (in a non-creepy way, promise 😄)',
    color: '#FF6B9D',
  },
  {
    id: 2,
    icon: MessageCircle,
    title: 'Real Conversations',
    description: 'From deep talks to silly memes, sarcasm to support - I adapt to what you need, when you need it',
    color: '#4A90E2',
  },
  {
    id: 3,
    icon: Sparkles,
    title: 'Personalized Experience',
    description: 'I remember your story, celebrate your wins, and develop inside jokes unique to our friendship',
    color: '#9B59B6',
  },
  {
    id: 4,
    icon: TrendingUp,
    title: 'Growth Together',
    description: 'Track your strengths, get care packages during tough times, and receive monthly letters reflecting on your journey',
    color: '#27AE60',
  },
];

export default function OnboardingScreen() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const scrollX = useState(new Animated.Value(0))[0];

  const handleNext = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (currentScreen < ONBOARDING_SCREENS.length - 1) {
      setCurrentScreen(currentScreen + 1);
    }
  };

  const handleSkip = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    await AsyncStorage.setItem('oviya_onboarding_completed', 'true');
    router.replace('/');
  };

  const handleGetStarted = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    
    await AsyncStorage.setItem('oviya_onboarding_completed', 'true');
    router.replace('/');
  };

  const screen = ONBOARDING_SCREENS[currentScreen];
  const IconComponent = screen.icon;
  const isLastScreen = currentScreen === ONBOARDING_SCREENS.length - 1;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[screen.color, screen.color + 'CC']}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          {!isLastScreen && (
            <Pressable onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <IconComponent size={80} color="#FFFFFF" strokeWidth={1.5} />
          </View>

          <Text style={styles.title}>{screen.title}</Text>
          {screen.subtitle && (
            <Text style={styles.subtitle}>{screen.subtitle}</Text>
          )}
          <Text style={styles.description}>{screen.description}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.pagination}>
            {ONBOARDING_SCREENS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  currentScreen === index ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>

          <Pressable
            onPress={isLastScreen ? handleGetStarted : handleNext}
            style={styles.nextButton}
          >
            <Text style={styles.nextButtonText}>
              {isLastScreen ? "Let's Begin" : 'Next'}
            </Text>
            <ArrowRight size={20} color={screen.color} />
          </Pressable>
        </View>
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'flex-end',
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 17,
    fontWeight: '400' as const,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: 26,
  },
  footer: {
    paddingHorizontal: 40,
    paddingBottom: 40,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
  dotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
    minWidth: 200,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
});
