# 🚀 Tier 0 Implementation Guide for Rork

## Overview
This guide helps you upgrade Oviya from Rork's built-in AI to your own scalable backend using Claude 3.5 Sonnet.

---

## 📋 Prerequisites

- [x] Anthropic API key (get from https://console.anthropic.com/)
- [x] Vercel account (free tier - https://vercel.com)
- [x] Node.js installed locally

---

## Part 1: Create Backend (15 minutes)

### Step 1: Create Backend Project

```bash
# Create new folder OUTSIDE oviya-companion
mkdir oviya-backend
cd oviya-backend

# Initialize Next.js project
npx create-next-app@latest . --typescript --app --no-tailwind --src-dir=false --import-alias="@/*"
# Answer "Yes" to all prompts

# Install dependencies
npm install @anthropic-ai/sdk
```

### Step 2: Create API Route

Create file: `app/api/chat/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Simple in-memory rate limiting (upgrade to Redis in Tier 1)
const userLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // 10 messages per minute
const WINDOW_MS = 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const { userId, systemPrompt, messages } = await request.json();

    // Rate limiting
    const now = Date.now();
    const limit = userLimits.get(userId);

    if (limit) {
      if (now < limit.resetTime) {
        if (limit.count >= RATE_LIMIT) {
          return NextResponse.json(
            { error: 'Too many messages. Please wait a minute.' },
            { status: 429 }
          );
        }
        limit.count++;
      } else {
        userLimits.set(userId, { count: 1, resetTime: now + WINDOW_MS });
      }
    } else {
      userLimits.set(userId, { count: 1, resetTime: now + WINDOW_MS });
    }

    // Call Claude
    console.log(`[API] Calling Claude for user ${userId}`);
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content :
                 m.content.map((c: any) => c.text).join(''),
      })),
    });

    // Extract text response
    const textContent = response.content.find(c => c.type === 'text');

    return NextResponse.json({
      message: {
        role: 'assistant',
        content: textContent && 'text' in textContent ? textContent.text : '',
      },
    });

  } catch (error: any) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'oviya-backend' });
}
```

### Step 3: Create Environment File

Create `.env.local`:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-YOUR-KEY-HERE
```

### Step 4: Test Locally

```bash
npm run dev
# Server starts at http://localhost:3000

# Test health check in browser:
# http://localhost:3000/api/chat
# Should see: {"status":"ok","service":"oviya-backend"}
```

### Step 5: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts:
# Set up and deploy? Y
# Which scope? (select your account)
# Link to existing project? N
# Project name? oviya-backend
# In which directory? ./ (press Enter)
# Override settings? N

# It will deploy and give you URL like:
# https://oviya-backend-xxx.vercel.app

# Add environment variable
vercel env add ANTHROPIC_API_KEY production
# Paste your API key when prompted

# Redeploy with env vars
vercel --prod
```

**Save your production URL!** You'll need it in Part 2.

Example: `https://oviya-backend-abc123.vercel.app`

---

## Part 2: Update Rork App (10 minutes)

### Step 1: Create New Claude Service

In your `oviya-companion` project, the file `services/claude.ts` has been created.

### Step 2: Update Environment Variables

Edit `.env` (create if doesn't exist):

```bash
# Backend API
EXPO_PUBLIC_API_URL=https://oviya-backend-abc123.vercel.app

# Supabase (move from hardcoded)
EXPO_PUBLIC_SUPABASE_URL=https://mrmebjsuiaqeentaqeya.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ybWVianN1aWFxZWVudGFxZXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMTUwNDMsImV4cCI6MjA3ODg5MTA0M30.6i7En1hPLxn5qUi-4a07RqjuJovwjjH5cmbLuQprJwc

# Third-party (move from hardcoded)
EXPO_PUBLIC_GIPHY_API_KEY=l3MLtCTvVv9rxfVd3T6XaEmxuZjF2quS
EXPO_PUBLIC_TMDB_API_KEY=bb6444cf69a7114d8720ef5859d2722c
```

**Important**: Add to `.gitignore`:

```bash
# Add to .gitignore
.env
.env.local
.env.*.local
```

### Step 3: Update Supabase Service

Edit `services/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// CHANGE: Use environment variables instead of hardcoded values
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Rest of file stays the same...
```

### Step 4: Update API Service

Edit `services/api.ts`:

```typescript
// CHANGE: Use environment variables
const GIPHY_API_KEY = process.env.EXPO_PUBLIC_GIPHY_API_KEY!;
const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY!;

// Rest of file stays the same...
```

---

## Part 3: Simplify Chat for Tier 0 (Using Rork AI)

**For Tier 0, the EASIEST approach**: Keep using Rork's AI temporarily, just add the security and pagination fixes.

### Option A: Quick Tier 0 (Recommended)

**What to do NOW**:
1. ✅ Move secrets to `.env` (done above)
2. ✅ Add message pagination
3. ✅ Deploy current app

**Backend migration to Tier 1** when you hit 500 users.

### Add Pagination to Current Code

Edit `contexts/ChatContext.tsx`:

Find the `loadData` function and modify the messages query:

```typescript
// In ChatContext.tsx, find this line (around line 80-90):
const messagesData = await supabase
  .from('messages')
  .select('*')
  .eq('user_id', userProfile.id)
  .order('timestamp', { ascending: true });

// REPLACE WITH (add pagination):
const messagesData = await supabase
  .from('messages')
  .select('*')
  .eq('user_id', userProfile.id)
  .order('timestamp', { ascending: false }) // Latest first
  .limit(50) // Only load last 50 messages
  .order('timestamp', { ascending: true }); // Then reverse to show oldest first

// For older messages, add lazy loading later
```

---

## Part 4: Deploy & Test

### Deploy Rork App

```bash
# In oviya-companion directory

# Test locally first
bun run start

# Scan QR code with Expo Go app
# Test chat functionality
# Verify it works!

# Push to GitHub (Rork auto-deploys)
git add .
git commit -m "Tier 0: Security fixes and pagination"
git push origin main

# Changes will auto-deploy via Rork
```

---

## Part 5: Monitor & Optimize (Week 2-4)

### Set Up Basic Monitoring

Create `app/api/health/route.ts` in backend:

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  const stats = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'oviya-backend',
    version: '1.0.0',
  };

  return NextResponse.json(stats);
}
```

### Monitor These Metrics

**In Vercel Dashboard**:
- Response time (should be <1s)
- Error rate (should be <1%)
- Function invocations
- Bandwidth usage

**Upgrade to Tier 1 when**:
- Users > 400 (80% of 500 capacity)
- Response time > 2s consistently
- Errors > 1%

---

## 📊 Expected Tier 0 Performance

```yaml
Capacity: 500 concurrent users
Response time: 1-2 seconds (p95)
Uptime: 99% (Vercel free tier)
Cost: $100-200/month
  - Vercel: Free
  - Anthropic Claude: $50-150/month
  - Supabase: $25/month

Success metrics:
  ✅ App loads in < 3s
  ✅ Messages send in < 2s
  ✅ No hardcoded secrets
  ✅ Rate limiting works (10 msg/min)
  ✅ Pagination loads fast
```

---

## 🚨 Common Issues & Fixes

### Issue: "ANTHROPIC_API_KEY is not defined"
**Fix**:
```bash
# Make sure .env.local exists in backend
# Redeploy with:
vercel --prod
```

### Issue: "Cannot read property of undefined (EXPO_PUBLIC_API_URL)"
**Fix**:
```bash
# In oviya-companion/.env, make sure you have:
EXPO_PUBLIC_API_URL=https://your-backend.vercel.app

# Restart Expo:
bun run start
```

### Issue: "Rate limit exceeded"
**Expected!** Working as designed. Users can only send 10 messages/minute in Tier 0.

### Issue: "Supabase connection error"
**Fix**: Check environment variables are set correctly:
```bash
# Should be in .env:
EXPO_PUBLIC_SUPABASE_URL=https://...
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## ✅ Tier 0 Checklist

Before declaring Tier 0 complete:

- [ ] Backend deployed to Vercel
- [ ] Health check endpoint works (`/api/health`)
- [ ] `.env` created with all variables
- [ ] Secrets removed from code files
- [ ] `.gitignore` includes `.env`
- [ ] Message pagination implemented
- [ ] Rate limiting tested (try sending 11 messages fast)
- [ ] App works on real device (via Expo Go)
- [ ] Chat responses come from Claude API
- [ ] 10 beta users tested successfully

---

## 🎯 Next: Tier 1 Preparation

When you hit 400-500 users, start preparing Tier 1:

1. **Set up Redis** (Upstash free tier)
2. **Add connection pooling** (PgBouncer)
3. **Migrate to NestJS** (better than Next.js for real-time)
4. **Deploy to Cloud Run** (better auto-scaling)

See `TIER1_IMPLEMENTATION.md` (coming soon)

---

## 💬 Questions?

**Backend not working?**
- Check Vercel logs: `vercel logs`
- Test locally: `npm run dev`
- Verify API key is set: `vercel env ls`

**Frontend not connecting?**
- Check `.env` has correct URL
- Restart Expo: `bun run start`
- Clear cache: `bunx expo start --clear`

**Still stuck?**
- Check Rork documentation: https://rork.com/docs
- Anthropic docs: https://docs.anthropic.com
- Vercel docs: https://vercel.com/docs
