import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Bookmark } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Message, MessagePart } from '../contexts/ChatContext';
import { useChat } from '../contexts/ChatContext';
import Colors from '../constants/colors';

type TextSegment = {
  text: string;
  bold?: boolean;
  italic?: boolean;
};

function parseMarkdown(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let currentIndex = 0;

  const boldItalicRegex = /\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*/g;
  let match: RegExpExecArray | null;

  while ((match = boldItalicRegex.exec(text)) !== null) {
    if (match.index > currentIndex) {
      segments.push({ text: text.slice(currentIndex, match.index) });
    }

    if (match[1]) {
      segments.push({ text: match[1], bold: true, italic: true });
    } else if (match[2]) {
      segments.push({ text: match[2], bold: true });
    } else if (match[3]) {
      segments.push({ text: match[3], italic: true });
    }

    currentIndex = match.index + match[0].length;
  }

  if (currentIndex < text.length) {
    segments.push({ text: text.slice(currentIndex) });
  }

  return segments.length > 0 ? segments : [{ text }];
}

type Props = {
  message: Message;
  isLatest: boolean;
};

export default function MessageBubble({ message, isLatest }: Props) {
  const { userMemory, saveMoment } = useChat();
  const isOviya = message.role === 'assistant';
  const isSaved = userMemory?.savedMoments?.includes(message.id) ?? false;

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
        const segments = parseMarkdown(part.text);
        return (
          <Text
            key={index}
            style={[
              styles.messageText,
              isOviya ? styles.oviyaText : styles.userText,
            ]}
          >
            {segments.map((segment, i) => (
              <Text
                key={i}
                style={[
                  segment.bold && styles.boldText,
                  segment.italic && styles.italicText,
                ]}
              >
                {segment.text}
              </Text>
            ))}
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

  const hasReactions = message.reactions && message.reactions.length > 0;

  return (
    <View style={styles.messageWrapper}>
      <Pressable
        onLongPress={handleLongPress}
        delayLongPress={500}
        style={[
          styles.messageContainer,
          isOviya ? styles.oviyaContainer : styles.userContainer,
        ]}
      >
        {isOviya ? (
          <View style={styles.oviyaBubble}>
            {message.parts.map((part, index) => renderPart(part, index))}
            {isSaved && (
              <View style={styles.savedBadge}>
                <Bookmark size={12} color={Colors.light.accent} fill={Colors.light.accent} />
              </View>
            )}
          </View>
        ) : (
          <LinearGradient
            colors={['#4A90E2', '#357ABD']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.userBubble}
          >
            {message.parts.map((part, index) => renderPart(part, index))}
            {isSaved && (
              <View style={styles.savedBadge}>
                <Bookmark size={12} color="#FFFFFF" fill="#FFFFFF" />
              </View>
            )}
          </LinearGradient>
        )}
      </Pressable>
      {hasReactions && (
        <View style={[
          styles.reactionsContainer,
          isOviya ? styles.reactionsLeft : styles.reactionsRight,
        ]}>
          {message.reactions?.map((reaction, index) => (
            <View key={`${reaction.timestamp}-${index}`} style={styles.reactionBubble}>
              <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export function TypingIndicator() {
  return (
    <View style={[styles.messageContainer, styles.oviyaContainer]}>
      <View style={styles.oviyaBubble}>
        <View style={styles.typingContainer}>
          <ActivityIndicator size="small" color={Colors.light.accent} />
          <Text style={styles.typingText}>Oviya is typing...</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  messageWrapper: {
    width: '100%',
  },
  messageContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    maxWidth: '80%',
  },
  oviyaContainer: {
    alignSelf: 'flex-start',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  oviyaBubble: {
    backgroundColor: Colors.light.oviyaBubble,
    borderRadius: 20,
    borderTopLeftRadius: 4,
    padding: 14,
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  userBubble: {
    borderRadius: 20,
    borderTopRightRadius: 4,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  messageText: {
    fontSize: 16,
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
    overflow: 'hidden',
  },
  gif: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  sticker: {
    fontSize: 48,
    textAlign: 'center',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontStyle: 'italic' as const,
  },
  savedBadge: {
    position: 'absolute' as const,
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: -4,
    marginBottom: 4,
    paddingHorizontal: 16,
  },
  reactionsLeft: {
    alignSelf: 'flex-start',
    marginLeft: 20,
  },
  reactionsRight: {
    alignSelf: 'flex-end',
    marginRight: 20,
  },
  reactionBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  boldText: {
    fontWeight: '700' as const,
  },
  italicText: {
    fontStyle: 'italic' as const,
  },
});
