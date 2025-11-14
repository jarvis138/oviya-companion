import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Mail, MailOpen, Calendar } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors, { getColorsForMood } from '../constants/colors';
import { useChat } from '../contexts/ChatContext';
import { 
  getMonthlyLetters, 
  markLetterAsRead,
  type MonthlyLetter 
} from '../utils/monthlyLetter';

export default function LettersScreen() {
  const { currentMood } = useChat();
  const [letters, setLetters] = useState<MonthlyLetter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLetter, setSelectedLetter] = useState<MonthlyLetter | null>(null);

  const moodColors = getColorsForMood(currentMood || 'caring');

  useEffect(() => {
    loadLetters();
  }, []);

  const loadLetters = async () => {
    setIsLoading(true);
    try {
      const data = await getMonthlyLetters();
      setLetters(data.sort((a, b) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error('Failed to load letters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openLetter = async (letter: MonthlyLetter) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSelectedLetter(letter);
    if (!letter.read) {
      await markLetterAsRead(letter.id);
      loadLetters();
    }
  };

  const closeLetter = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedLetter(null);
  };

  const renderLetter = ({ item }: { item: MonthlyLetter }) => {
    return (
      <Pressable
        onPress={() => openLetter(item)}
        style={({ pressed }) => [
          styles.letterCard,
          pressed && styles.letterCardPressed,
        ]}
      >
        <LinearGradient
          colors={
            item.read
              ? ['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.6)']
              : ['rgba(255, 255, 255, 0.98)', 'rgba(255, 255, 255, 0.9)']
          }
          style={styles.letterCardGradient}
        >
          <View style={styles.letterCardHeader}>
            {item.read ? (
              <MailOpen size={32} color={Colors.light.textSecondary} />
            ) : (
              <Mail size={32} color={moodColors.accent} />
            )}
            {!item.read && <View style={styles.unreadBadge} />}
          </View>

          <Text style={styles.letterMonth}>
            {item.month} {item.year}
          </Text>
          <Text style={styles.letterPreview} numberOfLines={2}>
            {item.content.split('\n\n')[0]}
          </Text>

          <View style={styles.letterFooter}>
            <Calendar size={14} color={Colors.light.textSecondary} />
            <Text style={styles.letterDate}>
              {new Date(item.timestamp).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
        </LinearGradient>
      </Pressable>
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
          <Mail size={24} color={moodColors.accent} />
          <Text style={styles.headerTitle}>Monthly Letters</Text>
          <View style={styles.backButton} />
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={moodColors.accent} />
            <Text style={styles.loadingText}>Loading your letters...</Text>
          </View>
        ) : letters.length === 0 ? (
          <View style={styles.emptyState}>
            <Mail size={64} color={moodColors.accent} />
            <Text style={styles.emptyTitle}>Your First Letter Is Coming</Text>
            <Text style={styles.emptyDescription}>
              At the end of each month, I&apos;ll write you a personal letter reflecting on what I&apos;ve noticed about your growth, patterns, and journey.
              {'\n\n'}
              Keep talking with me, and your first letter will arrive soon! 💜
            </Text>
          </View>
        ) : (
          <FlatList
            data={letters}
            renderItem={renderLetter}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.lettersList}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <Text style={styles.listHeaderTitle}>
                  Letters from Oviya
                </Text>
                <Text style={styles.listHeaderSubtitle}>
                  Personal reflections on your journey, written just for you
                </Text>
              </View>
            }
          />
        )}

        <Modal
          visible={selectedLetter !== null}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={closeLetter}
        >
          {selectedLetter && (
            <View style={styles.modalWrapper}>
              <LinearGradient
                colors={[moodColors.gradientStart, moodColors.gradientEnd]}
                style={StyleSheet.absoluteFill}
              />
              <SafeAreaView style={styles.modalSafeArea} edges={['top', 'bottom']}>
                <View style={styles.modalHeader}>
                  <Pressable
                    onPress={closeLetter}
                    style={styles.closeButton}
                  >
                    <ArrowLeft size={24} color={Colors.light.text} />
                  </Pressable>
                  <View style={styles.modalHeaderCenter}>
                    <Mail size={20} color={moodColors.accent} />
                    <Text style={styles.modalHeaderText}>
                      {selectedLetter.month} {selectedLetter.year}
                    </Text>
                  </View>
                  <View style={styles.closeButton} />
                </View>

                <ScrollView style={styles.letterContent}>
                  <View style={styles.letterEnvelope}>
                    <LinearGradient
                      colors={['rgba(255, 255, 255, 0.98)', 'rgba(255, 255, 255, 0.95)']}
                      style={styles.letterEnvelopeGradient}
                    >
                      <MailOpen size={48} color={moodColors.accent} />
                      <Text style={styles.letterContentText}>
                        {selectedLetter.content}
                      </Text>
                      <View style={styles.letterSignature}>
                        <View style={[styles.signatureLine, { backgroundColor: moodColors.accent }]} />
                        <Text style={[styles.signatureText, { color: moodColors.accent }]}>
                          With care,{'\n'}Oviya
                        </Text>
                      </View>
                    </LinearGradient>
                  </View>
                </ScrollView>
              </SafeAreaView>
            </View>
          )}
        </Modal>
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
  lettersList: {
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
  letterCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  letterCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  letterCardGradient: {
    padding: 20,
  },
  letterCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative' as const,
  },
  unreadBadge: {
    position: 'absolute' as const,
    top: -4,
    left: 20,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B9D',
  },
  letterMonth: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  letterPreview: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.light.textSecondary,
    marginBottom: 16,
  },
  letterFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  letterDate: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: '500' as const,
  },
  modalWrapper: {
    flex: 1,
  },
  modalSafeArea: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  modalHeaderText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  letterContent: {
    flex: 1,
  },
  letterEnvelope: {
    margin: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  letterEnvelopeGradient: {
    padding: 32,
    alignItems: 'center',
  },
  letterContentText: {
    fontSize: 16,
    lineHeight: 26,
    color: Colors.light.text,
    marginTop: 24,
    textAlign: 'left',
    width: '100%',
  },
  letterSignature: {
    marginTop: 32,
    alignItems: 'flex-end',
    width: '100%',
  },
  signatureLine: {
    width: 100,
    height: 2,
    marginBottom: 12,
  },
  signatureText: {
    fontSize: 16,
    fontWeight: '600' as const,
    fontStyle: 'italic' as const,
    textAlign: 'right',
    lineHeight: 24,
  },
});
