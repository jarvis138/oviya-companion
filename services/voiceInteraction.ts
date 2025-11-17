/**
 * Voice Interaction System for Oviya
 *
 * Enables voice-based conversations with emotion-aware responses.
 * Uses Expo's Audio API for recording and playback.
 *
 * Features:
 * - Speech-to-text for user input
 * - Text-to-speech with emotional prosody
 * - Voice activity detection
 * - Background noise handling
 * - Conversation mode (continuous listening)
 */

import { Audio } from 'expo-av';
import type { EmotionDetectionResult } from './emotionalIntelligence';

export interface VoiceConfig {
  language: string;
  voice: 'default' | 'warm' | 'energetic' | 'calm' | 'professional';
  speed: number; // 0.5 to 2.0
  pitch: number; // 0.5 to 2.0
}

export interface VoiceRecording {
  uri: string;
  duration: number;
  metering?: number[];
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  language: string;
  alternatives?: string[];
}

/**
 * Voice recording manager with audio permissions
 */
export class VoiceRecorder {
  private recording: Audio.Recording | null = null;
  private isRecording = false;

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('[VoiceRecorder] Permission request failed:', error);
      return false;
    }
  }

  async startRecording(): Promise<boolean> {
    try {
      if (this.isRecording) {
        console.warn('[VoiceRecorder] Already recording');
        return false;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Create recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      this.recording = recording;
      this.isRecording = true;

      console.log('[VoiceRecorder] Recording started');
      return true;
    } catch (error) {
      console.error('[VoiceRecorder] Failed to start recording:', error);
      return false;
    }
  }

  async stopRecording(): Promise<VoiceRecording | null> {
    try {
      if (!this.recording || !this.isRecording) {
        console.warn('[VoiceRecorder] No active recording');
        return null;
      }

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      const status = await this.recording.getStatusAsync();

      const duration = status.isLoaded ? status.durationMillis : 0;

      this.isRecording = false;
      const recordingData = this.recording;
      this.recording = null;

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      console.log('[VoiceRecorder] Recording stopped:', uri, duration);

      return uri ? { uri, duration } : null;
    } catch (error) {
      console.error('[VoiceRecorder] Failed to stop recording:', error);
      return null;
    }
  }

  async cancelRecording(): Promise<void> {
    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
      } catch (error) {
        console.error('[VoiceRecorder] Failed to cancel recording:', error);
      }

      this.recording = null;
      this.isRecording = false;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
    }
  }

  getRecordingStatus(): { isRecording: boolean } {
    return { isRecording: this.isRecording };
  }
}

/**
 * Speech-to-text transcription
 * In production, this would use services like Whisper, Deepgram, or Google Speech-to-Text
 */
export async function transcribeAudio(audioUri: string): Promise<TranscriptionResult> {
  try {
    // TODO: Integrate with actual STT service
    // For now, this is a placeholder that would call an API endpoint

    const formData = new FormData();
    formData.append('audio', {
      uri: audioUri,
      type: 'audio/m4a',
      name: 'recording.m4a',
    } as any);

    // In production, call your STT API:
    // const response = await fetch('YOUR_STT_ENDPOINT', {
    //   method: 'POST',
    //   body: formData,
    // });
    // const result = await response.json();

    // Placeholder response
    console.log('[VoiceInteraction] Transcription requested for:', audioUri);

    return {
      text: 'Voice transcription placeholder', // Would come from API
      confidence: 0.95,
      language: 'en-US',
      alternatives: [],
    };
  } catch (error) {
    console.error('[VoiceInteraction] Transcription failed:', error);
    throw new Error('Failed to transcribe audio');
  }
}

/**
 * Text-to-speech with emotion-aware prosody
 */
export class VoiceGenerator {
  private sound: Audio.Sound | null = null;
  private config: VoiceConfig = {
    language: 'en-US',
    voice: 'default',
    speed: 1.0,
    pitch: 1.0,
  };

  constructor(config?: Partial<VoiceConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Adjusts voice parameters based on detected emotion
   */
  private getVoiceParametersForEmotion(emotion?: EmotionDetectionResult): {
    speed: number;
    pitch: number;
  } {
    if (!emotion) {
      return { speed: this.config.speed, pitch: this.config.pitch };
    }

    let speed = this.config.speed;
    let pitch = this.config.pitch;

    // Adjust based on primary emotion
    switch (emotion.primaryEmotion) {
      case 'joy':
        // Happier voice: slightly higher pitch, slightly faster
        pitch += 0.1;
        speed += 0.1;
        break;

      case 'sadness':
        // Gentler voice: lower pitch, slower
        pitch -= 0.1;
        speed -= 0.1;
        break;

      case 'anger':
        // Firm but not aggressive: steady pace
        speed += 0.05;
        break;

      case 'fear':
      case 'anticipation':
        // Calming voice: lower pitch, slower
        pitch -= 0.15;
        speed -= 0.15;
        break;

      case 'trust':
        // Warm voice: slightly lower pitch
        pitch -= 0.05;
        break;

      default:
        // Keep default
        break;
    }

    // Adjust based on intensity
    if (emotion.intensity === 'strong' || emotion.intensity === 'overwhelming') {
      // More pronounced adjustments for strong emotions
      speed *= 0.95; // Speak slower for intense emotions
    }

    // Clamp values to valid ranges
    speed = Math.max(0.5, Math.min(2.0, speed));
    pitch = Math.max(0.5, Math.min(2.0, pitch));

    return { speed, pitch };
  }

  async generateSpeech(
    text: string,
    emotion?: EmotionDetectionResult
  ): Promise<{ uri: string; duration: number } | null> {
    try {
      // Get emotion-adjusted voice parameters
      const { speed, pitch } = this.getVoiceParametersForEmotion(emotion);

      // TODO: Integrate with actual TTS service (ElevenLabs, Google TTS, Azure, etc.)
      // For now, this is a placeholder

      console.log('[VoiceGenerator] Generating speech:', {
        text: text.substring(0, 50) + '...',
        speed,
        pitch,
        emotion: emotion?.primaryEmotion,
      });

      // In production, call your TTS API:
      // const response = await fetch('YOUR_TTS_ENDPOINT', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     text,
      //     voice: this.config.voice,
      //     language: this.config.language,
      //     speed,
      //     pitch,
      //   }),
      // });
      //
      // const audioBlob = await response.blob();
      // const uri = URL.createObjectURL(audioBlob);

      // Placeholder - in production this would be the actual audio URI
      return null;
    } catch (error) {
      console.error('[VoiceGenerator] Speech generation failed:', error);
      return null;
    }
  }

  async playSpeech(uri: string): Promise<boolean> {
    try {
      // Clean up previous sound
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      // Load and play new sound
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );

      this.sound = sound;

      // Set up completion callback
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          console.log('[VoiceGenerator] Playback finished');
          this.cleanup();
        }
      });

      return true;
    } catch (error) {
      console.error('[VoiceGenerator] Failed to play speech:', error);
      return false;
    }
  }

  async stopSpeech(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
      } catch (error) {
        console.error('[VoiceGenerator] Failed to stop speech:', error);
      }

      this.sound = null;
    }
  }

  private async cleanup(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.unloadAsync();
      } catch (error) {
        console.error('[VoiceGenerator] Cleanup failed:', error);
      }

      this.sound = null;
    }
  }

  updateConfig(config: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Conversation mode manager for continuous voice interaction
 */
export class ConversationMode {
  private recorder: VoiceRecorder;
  private generator: VoiceGenerator;
  private isActive = false;
  private silenceThreshold = 500; // ms of silence before stopping recording

  constructor() {
    this.recorder = new VoiceRecorder();
    this.generator = new VoiceGenerator();
  }

  async start(): Promise<boolean> {
    const hasPermission = await this.recorder.requestPermissions();
    if (!hasPermission) {
      console.error('[ConversationMode] No microphone permission');
      return false;
    }

    this.isActive = true;
    console.log('[ConversationMode] Conversation mode activated');
    return true;
  }

  async stop(): Promise<void> {
    this.isActive = false;
    await this.recorder.cancelRecording();
    await this.generator.stopSpeech();
    console.log('[ConversationMode] Conversation mode deactivated');
  }

  isConversationActive(): boolean {
    return this.isActive;
  }

  getRecorder(): VoiceRecorder {
    return this.recorder;
  }

  getGenerator(): VoiceGenerator {
    return this.generator;
  }
}

/**
 * Voice activity detection (VAD) - detects when user is speaking
 * This is a simplified version. Production would use a more sophisticated VAD algorithm.
 */
export function detectVoiceActivity(audioMetering: number[]): boolean {
  if (audioMetering.length === 0) return false;

  // Calculate average audio level
  const avgLevel = audioMetering.reduce((a, b) => a + b, 0) / audioMetering.length;

  // Threshold for voice activity (adjust based on testing)
  const VOICE_THRESHOLD = -30; // dB

  return avgLevel > VOICE_THRESHOLD;
}
