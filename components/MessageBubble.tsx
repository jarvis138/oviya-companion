import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Bookmark } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Message, MessagePart } from '../contexts/ChatContext';
import { useChat } from '../contexts/ChatContext';
import Colors, { getColorsForMood } from '../constants/colors';

type Props = {
  message: Message;
  isLatest: boolean;
};

export default function MessageBubble({ message, isLatest }: Props) {
  const { userMemory, saveMoment, currentMood } = useChat();
  const isOviya = message.role === 'assistant';
  const isSaved = userMemory?.savedMoments?.includes(message.id) ?? false;
  const moodColors = getColorsForMood(currentMood);

  const handleLongPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    Alert.alert(
      isSaved ? 'Remove from Moments?' : 'Save this Moment?',
      isSaved 
        ? 'This message will be removed from your Shared Moments gallery.'
        : 'This message will be saved to your Shared Moments gallery where you can revisit it anytime.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isSaved ? 'Remove' : 'Save',
          onPress: () => {
            saveMoment(message.id);
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
            }
          },
          style: isSaved ? 'destructive' : 'default',
        },
      ]
    );
  };

  const renderPart = (part: MessagePart, index: number) => {
    switch (part.type) {
      case 'text':
        return (
          <Text
            key={index}
            style={[
              styles.messageText,
              isOviya ? styles.oviyaText : styles.userText,
            ]}
          >
            {part.text}
          </Text>
        );

      case 'gif':
        return (
          <View key={index} style={styles.gifContainer}>
            <Image
              source={{ uri: part.url }}
              style={styles.gif}
              contentFit="cover"
              alt={part.alt}
            />
          </View>
        );

      case 'sticker':
        return (
          <Text key={index} style={styles.sticker}>
            {part.emoji}
          </Text>
        );

      default:
        return null;
    }
  };

  return (
    <Pressable
      onLongPress={handleLongPress}
      delayLongPress={500}
      style={[
        styles.messageContainer,
        isOviya ? styles.oviyaContainer : styles.userContainer,
      ]}
    >
      {isOviya ? (
        <BlurView intensity={20} tint="light" style={styles.oviyaBubble}>
          <View style={styles.bubbleContent}>
            {message.parts.map((part, index) => renderPart(part, index))}
            {isSaved && (
              <View style={styles.savedBadge}>
                <Bookmark size={12} color={moodColors.accent} fill={moodColors.accent} />
              </View>
            )}
          </View>
        </BlurView>
      ) : (
        <BlurView intensity={30} tint="light" style={styles.userBubble}>
          <View style={[styles.bubbleContent, styles.userBubbleContent, { backgroundColor: moodColors.accent }]}>
            {message.parts.map((part, index) => renderPart(part, index))}
            {isSaved && (
              <View style={styles.savedBadge}>
                <Bookmark size={12} color="#FFFFFF" fill="#FFFFFF" />
              </View>
            )}
          </View>
        </BlurView>
      )}
    </Pressable>
  );
}

export function TypingIndicator() {
  return (
    <View style={[styles.messageContainer, styles.oviyaContainer]}>
      <BlurView intensity={20} tint="light" style={styles.oviyaBubble}>
        <View style={styles.bubbleContent}>
          <View style={styles.typingContainer}>
            <ActivityIndicator size="small" color={Colors.light.accent} />
            <Text style={styles.typingText}>Oviya is typing...</Text>
          </View>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    maxWidth: '75%',
  },
  oviyaContainer: {
    alignSelf: 'flex-start',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  oviyaBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 20,
    borderTopLeftRadius: 4,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  userBubble: {
    borderRadius: 20,
    borderTopRightRadius: 4,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  bubbleContent: {
    padding: 16,
    position: 'relative' as const,
  },
  userBubbleContent: {
    borderRadius: 20,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  oviyaText: {
    color: Colors.light.text,
  },
  userText: {
    color: '#FFFFFF',
  },
  gifContainer: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden' as const,
  },
  gif: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  sticker: {
    fontSize: 48,
    textAlign: 'center' as const,
  },
  typingContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  typingText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontStyle: 'italic' as const,
  },
  savedBadge: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});
