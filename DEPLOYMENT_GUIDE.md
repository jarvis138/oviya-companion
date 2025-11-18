# 🚀 Tier 0 Deployment Guide

## What Has Been Implemented

### ✅ Backend (Complete)

**Location**: `/home/user/oviya-backend/`

- **Next.js API** with TypeScript
- **Claude 3.5 Sonnet** integration
- **Rate limiting** (10 messages/minute per user)
- **Health check endpoints**
- **Error handling** and logging
- **Vercel-ready** deployment

**Files Created**:
- `package.json` - Dependencies
- `app/api/chat/route.ts` - Main chat endpoint
- `app/api/health/route.ts` - Health check
- `app/page.tsx` - Home page
- `app/layout.tsx` - Layout
- `README.md` - Backend documentation
- `.env.example` - Environment variable template
- `.gitignore` - Git ignore rules

### ✅ Frontend Security (Complete)

**Changes Made**:
1. Created `.env` with all secrets
2. Updated `services/supabase.ts` - Uses `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. Updated `services/api.ts` - Uses `EXPO_PUBLIC_GIPHY_API_KEY` and `EXPO_PUBLIC_TMDB_API_KEY`
4. Updated `.gitignore` - Excludes `.env` from git
5. Created `services/claude.ts` - New service for backend API calls

### ⚠️ Frontend Integration (Needs Completion)

**What's Left**:
- Replace Rork API call in `app/index.tsx` with our new backend
- This requires updating the `handleSend` function (line 339+)

---

## 📦 Step 1: Deploy Backend to Vercel

### A. Install Dependencies

```bash
cd /home/user/oviya-backend

# Install dependencies
npm install
# or
bun install
```

### B. Test Locally

```bash
# Create .env.local
cp .env.example .env.local

# Edit .env.local and add your Anthropic API key:
# ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

# Run development server
npm run dev
# or
bun dev
```

Visit `http://localhost:3000/api/health` - should see:
```json
{
  "status": "healthy",
  "service": "oviya-backend",
  ...
}
```

### C. Deploy to Vercel

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Deploy
cd /home/user/oviya-backend
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? (your account)
# - Link to existing project? N
# - Project name? oviya-backend
# - Directory? ./
# - Override settings? N

# You'll get a URL like: https://oviya-backend-xxx.vercel.app
```

### D. Add Environment Variables

```bash
# Add Anthropic API key to Vercel
vercel env add ANTHROPIC_API_KEY production
# Paste your API key when prompted: sk-ant-api03-...

# Also add for preview and development
vercel env add ANTHROPIC_API_KEY preview
vercel env add ANTHROPIC_API_KEY development

# Redeploy with environment variables
vercel --prod
```

### E. Test Production Deployment

```bash
# Test health check
curl https://oviya-backend-xxx.vercel.app/api/health

# Test chat endpoint
curl -X POST https://oviya-backend-xxx.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "systemPrompt": "You are a helpful assistant.",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

**Save your production URL!** You'll need it for the frontend.

---

## 📱 Step 2: Update Frontend Configuration

### A. Update .env File

Edit `/home/user/oviya-companion/.env`:

```bash
# Change this line:
EXPO_PUBLIC_API_URL=http://localhost:3000

# To your production URL:
EXPO_PUBLIC_API_URL=https://oviya-backend-xxx.vercel.app
```

### B. Update app/index.tsx (REQUIRED)

**Current Code** (line 384-540):
```typescript
// Calls Rork API
const agentResponse = await fetch(
  new URL("/agent/chat", process.env["EXPO_PUBLIC_TOOLKIT_URL"]).toString(),
  { /* ... */ }
);
```

**Replace With**:
```typescript
// Prepare messages for Claude
const claudeMessages = messages.map(msg => ({
  role: msg.role,
  content: msg.parts
    .filter(p => p.type === 'text')
    .map(p => p.text)
    .join('\n'),
}));

// Add current user message
claudeMessages.push({
  role: 'user',
  content: inputText.trim(),
});

// Build system prompt
const systemPrompt = buildSystemPrompt(userMemory, currentMood);

// Call our new backend
console.log('[ChatScreen] Calling Claude API via backend...');
const responseText = await getChatResponse(
  userProfile.id,
  systemPrompt,
  claudeMessages
);

console.log('[ChatScreen] Got response from Claude');

// Split response into chunks for natural delivery
const chunks = splitIntoChunks(responseText);

// Send response messages
if (chunks.length === 1) {
  const oviyaMessage: Message = {
    id: generateUUID(),
    role: 'assistant',
    parts: [{ type: 'text', text: responseText }],
    timestamp: Date.now(),
  };
  addMessage(oviyaMessage);
} else {
  // Send multiple chunks with delays
  for (let i = 0; i < chunks.length; i++) {
    if (i > 0) {
      setIsTyping(true);
      const chunkDelay = 800 + Math.min(chunks[i].length * 20, 2000);
      await new Promise(resolve => setTimeout(resolve, chunkDelay));
    }

    const oviyaMessage: Message = {
      id: generateUUID(),
      role: 'assistant',
      parts: [{ type: 'text', text: chunks[i] }],
      timestamp: Date.now(),
    };

    setIsTyping(false);
    addMessage(oviyaMessage);
  }
}
```

**Note**: This simplified version removes tool calls (GIFs, Bollywood, Music). These will be added back in Tier 1 with proper backend support.

---

## 📊 Step 3: Add Message Pagination

Update `/home/user/oviya-companion/contexts/ChatContext.tsx`:

**Find** (around line 80-90):
```typescript
const messagesData = await supabase
  .from('messages')
  .select('*')
  .eq('user_id', userProfile.id)
  .order('timestamp', { ascending: true });
```

**Replace With**:
```typescript
// Load only last 50 messages for performance
const messagesData = await supabase
  .from('messages')
  .select('*')
  .eq('user_id', userProfile.id)
  .order('timestamp', { ascending: false })
  .limit(50);

// Reverse to show oldest first
if (messagesData.data) {
  messagesData.data.reverse();
}
```

---

## 🧪 Step 4: Test Locally

```bash
cd /home/user/oviya-companion

# Start Expo dev server
bun run start

# Test on device:
# 1. Scan QR code with Expo Go app
# 2. Sign in / create account
# 3. Send a message
# 4. Verify you get response from Claude
# 5. Send 11 messages quickly to test rate limiting
```

**Expected Results**:
- ✅ Messages send successfully
- ✅ Oviya responds with Claude AI
- ✅ After 10 messages in 1 minute, get rate limit error
- ✅ App loads last 50 messages only

---

## 🚀 Step 5: Deploy to Production

```bash
cd /home/user/oviya-companion

# Commit changes
git add .
git commit -m "Tier 0: Migrate to Claude API backend with environment variables"
git push

# Changes will auto-deploy via Rork (if configured)
# Or manually deploy based on your setup
```

---

## ✅ Verification Checklist

### Backend
- [ ] `npm install` succeeds
- [ ] `npm run dev` works locally
- [ ] `/api/health` returns healthy status
- [ ] `/api/chat` POST returns valid response
- [ ] Deployed to Vercel successfully
- [ ] Environment variables added to Vercel
- [ ] Production URL accessible

### Frontend
- [ ] `.env` file created
- [ ] No hardcoded secrets in code files
- [ ] `.env` in `.gitignore`
- [ ] `services/supabase.ts` uses env vars
- [ ] `services/api.ts` uses env vars
- [ ] `services/claude.ts` exists and works
- [ ] `app/index.tsx` updated to use new backend
- [ ] Message pagination implemented
- [ ] App runs locally without errors

### End-to-End Testing
- [ ] User can sign up / login
- [ ] User can send messages
- [ ] Oviya responds with Claude AI
- [ ] Rate limiting works (10 msg/min)
- [ ] Messages persist in database
- [ ] App loads fast (only 50 recent messages)
- [ ] No errors in console

---

## 🐛 Troubleshooting

### "ANTHROPIC_API_KEY is not defined"

**Backend**:
```bash
cd /home/user/oviya-backend

# Check environment variables
vercel env ls

# Add if missing
vercel env add ANTHROPIC_API_KEY production
# Paste your key

# Redeploy
vercel --prod
```

### "Cannot connect to backend"

**Frontend**:
```bash
# Check .env file
cat /home/user/oviya-companion/.env

# Should have:
EXPO_PUBLIC_API_URL=https://oviya-backend-xxx.vercel.app

# Restart Expo
bun run start --clear
```

### "Supabase error"

```bash
# Verify environment variables
cat /home/user/oviya-companion/.env

# Should have:
EXPO_PUBLIC_SUPABASE_URL=https://...
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### "Rate limit exceeded"

**Expected!** This is working as designed. Users can only send 10 messages per minute in Tier 0.

### "Messages not loading"

Check console for errors. Make sure:
1. Supabase credentials are correct
2. Internet connection is working
3. Database tables exist

---

## 📈 Monitoring

### Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select `oviya-backend`
3. Monitor:
   - Function invocations
   - Response times
   - Error rates
   - Bandwidth

### Logs

```bash
# View realtime logs
vercel logs oviya-backend

# View logs for specific deployment
vercel logs oviya-backend --follow
```

### Costs

**Track costs**:
1. Anthropic dashboard: https://console.anthropic.com/
2. View API usage and costs
3. Expected: $50-150/month for 500 users

---

## 🎯 Next Steps (Tier 1)

When you reach 400-500 users:

1. **Add Redis** for caching and rate limiting
2. **Migrate to NestJS** (better for real-time)
3. **Deploy to Cloud Run** (better auto-scaling)
4. **Add BullMQ** message queue

See `SCALING_ROADMAP.md` for details.

---

## 📞 Support

**Issues**:
- Backend: Check `/home/user/oviya-backend/README.md`
- Frontend: Check Expo logs in terminal
- API: Check Anthropic dashboard

**Documentation**:
- Anthropic: https://docs.anthropic.com/
- Next.js: https://nextjs.org/docs
- Vercel: https://vercel.com/docs
- Expo: https://docs.expo.dev/

---

## 🎉 Success!

Once deployed, you have:
- ✅ Scalable backend on Vercel (FREE tier)
- ✅ Secure environment variables
- ✅ Claude 3.5 Sonnet AI
- ✅ Rate limiting protection
- ✅ Production-ready infrastructure

**Ready to onboard your first 500 users!** 🚀
