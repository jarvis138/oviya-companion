# 🚀 Oviya Deployment & Integration Guide

## Overview

This guide covers deploying Oviya's world-class AI companion features to production.

---

## 📋 Prerequisites

### Required Accounts & Services

1. **Supabase** (Already configured)
   - Database for messages and user memory
   - Real-time subscriptions
   - Authentication

2. **Speech-to-Text Service** (Choose one)
   - OpenAI Whisper API (recommended)
   - Deepgram
   - Google Cloud Speech-to-Text
   - Azure Speech Services

3. **Text-to-Speech Service** (Choose one)
   - ElevenLabs (recommended for emotion-aware voice)
   - Google Cloud TTS
   - Azure TTS
   - Amazon Polly

4. **Mobile Automation Backend** (Optional)
   - Deploy mobile-use framework
   - See: https://github.com/minitap-ai/mobile-use

---

## 🔧 Installation

### Step 1: Install Dependencies

```bash
# Install new dependencies for voice and security
bun install expo-av expo-secure-store

# Or if using npm:
npm install expo-av expo-secure-store
```

### Step 2: Environment Variables

Create or update `.env`:

```env
# Existing Supabase config
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# New: Speech-to-Text API (Whisper example)
EXPO_PUBLIC_WHISPER_API_KEY=your_whisper_key
EXPO_PUBLIC_WHISPER_API_URL=https://api.openai.com/v1/audio/transcriptions

# New: Text-to-Speech API (ElevenLabs example)
EXPO_PUBLIC_ELEVEN_LABS_API_KEY=your_elevenlabs_key
EXPO_PUBLIC_ELEVEN_LABS_VOICE_ID=default_voice_id

# New: Mobile Automation Backend (if using)
EXPO_PUBLIC_MOBILE_USE_API_URL=http://your-backend-url:8000

# Security
EXPO_PUBLIC_ENCRYPTION_KEY=generate_secure_random_key_here
```

### Step 3: Database Schema Updates

Run this SQL in your Supabase dashboard:

```sql
-- Add emotional trajectory tracking
CREATE TABLE IF NOT EXISTS emotional_trajectory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  timestamp BIGINT NOT NULL,
  primary_emotion TEXT NOT NULL,
  secondary_emotions JSONB,
  intensity TEXT,
  confidence NUMERIC,
  valence NUMERIC,
  arousal NUMERIC,
  micro_emotions JSONB,
  contextual_factors JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_emotional_trajectory_user ON emotional_trajectory(user_id);
CREATE INDEX idx_emotional_trajectory_timestamp ON emotional_trajectory(timestamp);

-- Add proactive engagement tracking
CREATE TABLE IF NOT EXISTS proactive_messages (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL,
  scheduled_for BIGINT NOT NULL,
  sent_at BIGINT,
  context TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_proactive_messages_user ON proactive_messages(user_id);
CREATE INDEX idx_proactive_messages_scheduled ON proactive_messages(scheduled_for);

-- Add security audit logs
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  timestamp BIGINT NOT NULL,
  event TEXT NOT NULL,
  details TEXT,
  severity TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_security_logs_user ON security_audit_logs(user_id);
CREATE INDEX idx_security_logs_severity ON security_audit_logs(severity);

-- Add consent preferences
CREATE TABLE IF NOT EXISTS consent_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  analytics BOOLEAN DEFAULT FALSE,
  personalization BOOLEAN DEFAULT TRUE,
  third_party_sharing BOOLEAN DEFAULT FALSE,
  voice_recording BOOLEAN DEFAULT FALSE,
  location_tracking BOOLEAN DEFAULT FALSE,
  last_updated BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add task execution history
CREATE TABLE IF NOT EXISTS task_execution_history (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  task_request JSONB NOT NULL,
  task_result JSONB,
  executed_at BIGINT NOT NULL,
  success BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_task_history_user ON task_execution_history(user_id);
CREATE INDEX idx_task_history_executed ON task_execution_history(executed_at);

-- Add engagement patterns
ALTER TABLE user_memory ADD COLUMN IF NOT EXISTS engagement_patterns JSONB;
ALTER TABLE user_memory ADD COLUMN IF NOT EXISTS voice_preferences JSONB;
```

---

## 🎯 Feature Activation

### Phase 1: Emotional Intelligence (Ready Now)

**File**: `services/emotionalIntelligence.ts`

```typescript
// In your chat handler (app/index.tsx):
import { analyzeEmotionFromText, getResponseStrategy, EmotionalTrajectoryTracker } from '../services/emotionalIntelligence';

// After user sends message:
const emotion = analyzeEmotionFromText(userMessage, conversationHistory);
const strategy = getResponseStrategy(emotion);

// Use strategy to guide Oviya's response
console.log('Response strategy:', strategy);
```

**Integration Points:**
1. Call `analyzeEmotionFromText()` on every user message
2. Store results in `emotional_trajectory` table
3. Use `getResponseStrategy()` to guide response tone
4. Display emotional insights in user profile/dashboard

---

### Phase 2: Proactive Engagement (Needs Background Job)

**File**: `services/proactiveEngagement.ts`

**Setup Background Job:**

```typescript
// Create: services/backgroundJobs.ts
import { analyzeEngagementPatterns, shouldSendProactiveMessage, generateProactiveMessage } from './proactiveEngagement';

export async function runProactiveEngagementJob() {
  // Run every hour
  const users = await getAllActiveUsers();

  for (const user of users) {
    const patterns = analyzeEngagementPatterns(user.messages, user.id);
    const shouldSend = shouldSendProactiveMessage(patterns, user.memory);

    if (shouldSend.shouldSend && shouldSend.type) {
      const message = generateProactiveMessage(
        shouldSend.type,
        user.memory,
        patterns
      );

      // Schedule for optimal time
      const sendTime = getOptimalSendTime(patterns, message.type);

      // Save to database
      await saveProactiveMessage(message, sendTime);
    }
  }
}
```

**Scheduling Options:**
- **Web**: Use setInterval or cron job
- **Mobile**: Use Expo Background Tasks
- **Server**: Use cron or task scheduler

---

### Phase 3: Voice Interaction (Needs API Integration)

**File**: `services/voiceInteraction.ts`

**Update STT Integration:**

```typescript
// In services/voiceInteraction.ts, update transcribeAudio():

export async function transcribeAudio(audioUri: string): Promise<TranscriptionResult> {
  const formData = new FormData();
  formData.append('file', {
    uri: audioUri,
    type: 'audio/m4a',
    name: 'recording.m4a',
  } as any);
  formData.append('model', 'whisper-1');

  const response = await fetch(
    process.env.EXPO_PUBLIC_WHISPER_API_URL!,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_WHISPER_API_KEY}`,
      },
      body: formData,
    }
  );

  const result = await response.json();

  return {
    text: result.text,
    confidence: 0.95,
    language: result.language || 'en',
  };
}
```

**Update TTS Integration:**

```typescript
// In VoiceGenerator.generateSpeech():

async generateSpeech(text: string, emotion?: EmotionDetectionResult) {
  const { speed, pitch } = this.getVoiceParametersForEmotion(emotion);

  const response = await fetch(
    'https://api.elevenlabs.io/v1/text-to-speech/' + process.env.EXPO_PUBLIC_ELEVEN_LABS_VOICE_ID,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.EXPO_PUBLIC_ELEVEN_LABS_API_KEY!,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  );

  const audioBlob = await response.blob();
  // Save blob to temp file and return URI
  const uri = await saveBlobToFile(audioBlob);

  return { uri, duration: 0 };
}
```

**Add Voice UI:**

```tsx
// In app/index.tsx:
import { VoiceRecorder, ConversationMode } from '../services/voiceInteraction';

// Add state:
const [isRecording, setIsRecording] = useState(false);
const recorder = useRef(new VoiceRecorder()).current;

// Add button:
<Pressable
  onPress={async () => {
    if (isRecording) {
      const recording = await recorder.stopRecording();
      if (recording) {
        const transcription = await transcribeAudio(recording.uri);
        setInputText(transcription.text);
      }
    } else {
      await recorder.startRecording();
    }
    setIsRecording(!isRecording);
  }}
>
  <Mic size={24} color={isRecording ? 'red' : 'gray'} />
</Pressable>
```

---

### Phase 4: Mobile Automation (Needs Backend)

**File**: `services/mobileAutomation.ts`

**Option A: Use Mobile-Use Backend**

1. Deploy mobile-use Python backend:
```bash
git clone https://github.com/minitap-ai/mobile-use
cd mobile-use
docker-compose up -d
```

2. Update `executeTask()` in mobileAutomation.ts:
```typescript
export async function executeTask(task: TaskRequest): Promise<TaskResult> {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_MOBILE_USE_API_URL}/execute`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command: task.userRequest,
        intent: task.intent,
        parameters: task.parameters,
      }),
    }
  );

  return await response.json();
}
```

**Option B: Implement Limited Features Natively**

For common tasks, use React Native APIs:
- Email: `Linking.openURL('mailto:...')`
- Calendar: `expo-calendar`
- Reminders: Local notifications
- Music: `expo-av` or deep linking to Spotify

---

### Phase 5: Security (Ready Now)

**File**: `services/security.ts`

**Immediate Implementation:**

```typescript
// In your app initialization:
import { SecureStorageManager, ConsentManager, ContentFilter } from '../services/security';

// Before saving any user data:
const sensitive = ContentFilter.isOversharing(userMessage);
if (sensitive.isOversharing) {
  const warning = ContentFilter.getOversharingWarning(userMessage);
  // Show warning to user
  showWarningDialog(warning);
}

// When storing sensitive data:
await SecureStorageManager.store('user_auth_token', token);

// When checking permissions:
const canRecord = await ConsentManager.hasConsent('voiceRecording');
if (!canRecord) {
  // Ask for consent first
  await requestVoiceConsent();
}
```

**Add Privacy Settings Page:**

Create `app/privacy-settings.tsx`:

```tsx
import { ConsentManager } from '../services/security';

export default function PrivacySettings() {
  const [consent, setConsent] = useState(await ConsentManager.getConsent());

  const updateConsent = async (key, value) => {
    await ConsentManager.updateConsent({ [key]: value });
    setConsent(await ConsentManager.getConsent());
  };

  return (
    <View>
      <Switch
        value={consent.analytics}
        onValueChange={(v) => updateConsent('analytics', v)}
      />
      <Text>Usage Analytics</Text>

      <Switch
        value={consent.voiceRecording}
        onValueChange={(v) => updateConsent('voiceRecording', v)}
      />
      <Text>Voice Recording</Text>

      {/* More options */}
    </View>
  );
}
```

---

## 🧪 Testing

### Emotional Intelligence Testing

```typescript
// Test file: __tests__/emotionalIntelligence.test.ts
import { analyzeEmotionFromText } from '../services/emotionalIntelligence';

test('detects hidden sadness', () => {
  const result = analyzeEmotionFromText("I'm fine...");
  expect(result.microEmotions.fakingHappiness).toBeGreaterThan(0.5);
});

test('detects sarcasm', () => {
  const result = analyzeEmotionFromText("Yeah, that's just great.");
  expect(result.microEmotions.sarcasm).toBeGreaterThan(0.5);
});
```

### Proactive Engagement Testing

```typescript
import { shouldSendProactiveMessage } from '../services/proactiveEngagement';

test('suggests wellbeing check after 24h silence for daily user', () => {
  const patterns = {
    engagementFrequency: 'daily',
    lastActiveTime: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
  };

  const result = shouldSendProactiveMessage(patterns, userMemory);
  expect(result.shouldSend).toBe(true);
  expect(result.type).toBe('wellbeing_check');
});
```

### Voice Interaction Testing

```typescript
test('adjusts voice for sadness', () => {
  const emotion = {
    primaryEmotion: 'sadness',
    intensity: 'strong',
  };

  const generator = new VoiceGenerator();
  const params = generator['getVoiceParametersForEmotion'](emotion);

  expect(params.pitch).toBeLessThan(1.0); // Lower pitch
  expect(params.speed).toBeLessThan(1.0); // Slower
});
```

---

## 📊 Monitoring & Analytics

### Key Metrics to Track

1. **Emotional Intelligence**
   - Emotion detection accuracy (compare against user feedback)
   - Response strategy effectiveness
   - Alert trigger rates

2. **Proactive Engagement**
   - Proactive message open rate
   - User response rate to proactive messages
   - Optimal send time accuracy

3. **Voice Interaction**
   - STT accuracy
   - Voice session length
   - User preference (voice vs. text)

4. **Mobile Automation**
   - Task completion success rate
   - Task type distribution
   - User satisfaction ratings

5. **Security**
   - Oversharing warnings triggered
   - Consent opt-in rates
   - Security audit log severity distribution

### Recommended Tools

- **Sentry**: Error tracking
- **PostHog**: Product analytics
- **Supabase Analytics**: Database insights
- **Custom Dashboard**: Build using Supabase + React

---

## 🚨 Troubleshooting

### Voice Recording Not Working

```typescript
// Check permissions:
const { status } = await Audio.requestPermissionsAsync();
console.log('Microphone permission:', status);

// Check audio mode:
await Audio.setAudioModeAsync({
  allowsRecordingIOS: true,
  playsInSilentModeIOS: true,
});
```

### Proactive Messages Not Sending

```typescript
// Check background job status:
console.log('Scheduled messages:', scheduler.getScheduledMessages());

// Verify timing calculations:
const sendTime = getOptimalSendTime(patterns, messageType);
console.log('Will send at:', new Date(sendTime));
```

### Emotional Detection Seems Off

```typescript
// Add debug logging:
const emotion = analyzeEmotionFromText(text, history);
console.log('Detected emotion:', {
  primary: emotion.primaryEmotion,
  confidence: emotion.confidence,
  microEmotions: emotion.microEmotions,
});
```

---

## 🔄 Rollout Strategy

### Week 1: Soft Launch
- Deploy emotional intelligence
- Deploy security features
- Enable for 10% of users
- Monitor metrics closely

### Week 2: Voice Features
- Deploy voice interaction
- Gather user feedback
- Optimize STT/TTS based on usage
- Expand to 50% of users

### Week 3: Proactive Engagement
- Launch proactive messaging
- Fine-tune timing algorithms
- A/B test message types
- 100% rollout

### Week 4: Mobile Automation
- Beta test with power users
- Gather task execution data
- Optimize NLP parsing
- Gradual rollout

---

## 📝 Documentation for Users

Create user-facing documentation:

1. **Privacy Policy**: Explain data handling, security measures
2. **Voice Guide**: How to use voice features
3. **Task Automation Guide**: What Oviya can help with
4. **Emotional Intelligence Explainer**: How Oviya understands emotions

---

## 🎓 Training & Support

### Internal Team Training

1. **Engineering**: Deep dive into each system
2. **Support**: Common issues and troubleshooting
3. **Product**: Feature capabilities and roadmap

### User Education

1. **Onboarding Flow**: Introduce new features gradually
2. **Tooltips**: Contextual help in UI
3. **Video Tutorials**: Show features in action
4. **FAQ**: Common questions

---

## 🚀 Next Steps

1. [ ] Review deployment guide with team
2. [ ] Set up required API accounts (Whisper, ElevenLabs)
3. [ ] Run database migrations
4. [ ] Deploy to staging environment
5. [ ] Conduct QA testing
6. [ ] Plan phased rollout
7. [ ] Monitor metrics
8. [ ] Iterate based on feedback

---

## 💬 Support

For deployment questions or issues:
- **Engineering Lead**: [Contact]
- **DevOps**: [Contact]
- **Product**: [Contact]

---

**Ready to deploy the future of AI companionship! 🌟**
