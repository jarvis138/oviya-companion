# 🚀 Quick Start: Launch Oviya in 1 Hour

## TL;DR - What You're Doing

1. Create a simple backend API (15 min)
2. Deploy to Vercel for free (10 min)
3. Update Rork app to use your backend (20 min)
4. Test with beta users (15 min)

**Total time**: ~1 hour
**Cost**: $0 (Vercel free tier + Anthropic free credits)

---

## Step 1: Get API Key (5 min)

1. Go to: https://console.anthropic.com/
2. Sign up with email
3. Settings → API Keys → Create Key
4. Copy key: `sk-ant-api03-xxxxx`
5. Billing → Add $5-10 credits

---

## Step 2: Create Backend (15 min)

```bash
# Open terminal, create NEW folder
mkdir oviya-backend
cd oviya-backend

# Create Next.js project
npx create-next-app@latest . --typescript --app --no-tailwind

# Install Claude SDK
npm install @anthropic-ai/sdk

# Create API endpoint
mkdir -p app/api/chat
```

**Create file**: `app/api/chat/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { userId, systemPrompt, messages } = await request.json();

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages,
    });

    const text = response.content.find(c => c.type === 'text');

    return NextResponse.json({
      message: {
        role: 'assistant',
        content: text && 'text' in text ? text.text : '',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
```

**Create file**: `.env.local`

```bash
ANTHROPIC_API_KEY=sk-ant-api03-YOUR-KEY-HERE
```

**Test locally**:

```bash
npm run dev
# Visit: http://localhost:3000/api/chat
# Should see: {"status":"ok"}
```

---

## Step 3: Deploy to Vercel (10 min)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Answer prompts:
# - Set up and deploy? Y
# - Which scope? (your account)
# - Link to existing? N
# - Project name? oviya-backend
# - Directory? ./
# - Override? N

# You'll get: https://oviya-backend-xxx.vercel.app

# Add environment variable
vercel env add ANTHROPIC_API_KEY production
# Paste your API key

# Redeploy
vercel --prod
```

**Test production**:
```bash
curl https://oviya-backend-xxx.vercel.app/api/chat
# Should return: {"status":"ok"}
```

**Save your URL!** You'll need it next.

---

## Step 4: Update Rork App (20 min)

### A. Create Environment File

In `oviya-companion` folder, create `.env`:

```bash
EXPO_PUBLIC_API_URL=https://oviya-backend-xxx.vercel.app

EXPO_PUBLIC_SUPABASE_URL=https://mrmebjsuiaqeentaqeya.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ybWVianN1aWFxZWVudGFxZXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMTUwNDMsImV4cCI6MjA3ODg5MTA0M30.6i7En1hPLxn5qUi-4a07RqjuJovwjjH5cmbLuQprJwc

EXPO_PUBLIC_GIPHY_API_KEY=l3MLtCTvVv9rxfVd3T6XaEmxuZjF2quS
EXPO_PUBLIC_TMDB_API_KEY=bb6444cf69a7114d8720ef5859d2722c
```

### B. Update .gitignore

Add to `.gitignore`:

```
.env
.env.local
.env.*.local
```

### C. Update Supabase Service

Edit `services/supabase.ts`:

**Find this**:
```typescript
const supabaseUrl = 'https://mrmebjsuiaqeentaqeya.supabase.co';
const supabaseAnonKey = 'eyJhbGci...';
```

**Replace with**:
```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
```

### D. Update API Service

Edit `services/api.ts`:

**Find this**:
```typescript
const GIPHY_API_KEY = 'l3MLtCTvVv9rxfVd3T6XaEmxuZjF2quS';
const TMDB_API_KEY = 'bb6444cf69a7114d8720ef5859d2722c';
```

**Replace with**:
```typescript
const GIPHY_API_KEY = process.env.EXPO_PUBLIC_GIPHY_API_KEY!;
const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY!;
```

---

## Step 5: Test Locally (10 min)

```bash
# In oviya-companion directory
bun run start

# Scan QR code with Expo Go app on phone
# Or press 'w' for web preview

# Test:
# 1. Sign up / log in
# 2. Send a message
# 3. Verify you get response
# 4. Try sending 11 messages fast (should hit rate limit)
```

**Expected behavior**:
- ✅ Messages send successfully
- ✅ Oviya responds with Claude AI
- ✅ Rate limit kicks in at 10 messages

---

## Step 6: Deploy to Production (5 min)

```bash
# Commit changes
git add .
git commit -m "Tier 0: Secure backend with Claude API"
git push origin main

# Rork auto-deploys from GitHub
# Wait 2-3 minutes for deployment
```

**Verify deployment**:
1. Open Rork dashboard
2. Check deployment status
3. Test on phone with production app

---

## ✅ Success Checklist

After completing all steps:

- [ ] Backend deployed to Vercel
- [ ] `curl https://your-backend.vercel.app/api/chat` returns `{"status":"ok"}`
- [ ] `.env` file created (and in `.gitignore`)
- [ ] No hardcoded secrets in code
- [ ] App runs locally
- [ ] Messages send successfully
- [ ] Claude AI responds
- [ ] Rate limiting works (try 11 messages)
- [ ] Deployed to Rork production
- [ ] Tested on real phone

---

## 🐛 Troubleshooting

### "ANTHROPIC_API_KEY is not defined"

```bash
# In oviya-backend folder:
vercel env ls
# Should show ANTHROPIC_API_KEY

# If not:
vercel env add ANTHROPIC_API_KEY production
# Paste your key

vercel --prod
```

### "Cannot read property EXPO_PUBLIC_API_URL"

```bash
# Make sure .env exists in oviya-companion
cat .env

# Restart Expo:
bun run start --clear
```

### "Network request failed"

```bash
# Check backend is running:
curl https://your-backend.vercel.app/api/chat

# If error, check Vercel logs:
vercel logs
```

### Rate limit not working

**This is expected!** Rate limiting resets every minute. Wait 60 seconds and try again.

---

## 📊 Monitor Your App

### Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Click on `oviya-backend`
3. View:
   - Function invocations
   - Response times
   - Error rates
   - Bandwidth usage

### Anthropic Dashboard

1. Go to: https://console.anthropic.com/
2. View:
   - API usage
   - Costs
   - Rate limits

### Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. View:
   - Active users
   - Database size
   - API requests

---

## 💰 Expected Costs (First Month)

```yaml
Vercel: $0 (free tier)
Anthropic: $20-50 (with free credits)
Supabase: $0 (free tier for <500 users)

Total: $20-50

# After free credits run out:
# ~$0.10-0.20 per user per month
# For 500 users: $50-100/month
```

---

## 🎯 Next Steps

### Week 1:
- [x] Deploy backend ✅
- [ ] Invite 10 beta testers
- [ ] Collect feedback
- [ ] Fix bugs

### Week 2-4:
- [ ] Invite 50 more users
- [ ] Monitor performance
- [ ] Optimize prompts
- [ ] Add features based on feedback

### When you hit 400 users:
- [ ] Read `TIER1_IMPLEMENTATION.md`
- [ ] Add Redis caching
- [ ] Upgrade to NestJS
- [ ] Deploy to Cloud Run

---

## 🆘 Need Help?

**Quick answers**:
- Backend issues: Check Vercel logs (`vercel logs`)
- Frontend issues: Check Expo logs (in terminal)
- API issues: Check Anthropic dashboard

**Documentation**:
- Detailed guide: `TIER0_IMPLEMENTATION.md`
- Full roadmap: `SCALING_ROADMAP.md`
- Rork docs: https://rork.com/docs
- Anthropic docs: https://docs.anthropic.com

**Support**:
- Rork support: support@rork.com
- Anthropic support: https://support.anthropic.com

---

## 🎉 You're Done!

You now have:
- ✅ Scalable backend on Vercel
- ✅ Secure environment variables
- ✅ Claude 3.5 Sonnet AI
- ✅ Rate limiting
- ✅ Production-ready app

**Ready to get your first 500 users!** 🚀

**Next**: Start inviting beta testers and gather feedback!
