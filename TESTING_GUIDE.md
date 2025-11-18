# 🧪 Testing Guide - Tier 0 Implementation

## ✅ Backend Tests Passed

The backend has been tested and is working:

- ✅ Dependencies installed successfully (74 packages)
- ✅ Server starts without errors
- ✅ Health check endpoint works: `http://localhost:3000/api/health`
- ✅ Returns proper JSON response with status

---

## 🚀 How to Test with Expo

### Prerequisites

1. **Anthropic API Key** (Required for chat to work)
   - Go to: https://console.anthropic.com/
   - Sign up and create an API key
   - You'll get something like: `sk-ant-api03-xxxxx...`

2. **Mobile Device or Emulator**
   - iOS: Expo Go app from App Store
   - Android: Expo Go app from Play Store
   - Or: iOS Simulator / Android Emulator

---

## Step-by-Step Testing

### 1. Configure Backend API Key

```bash
cd /home/user/oviya-backend

# Edit .env.local and add your real API key
nano .env.local
# Or
code .env.local

# Replace this line:
# ANTHROPIC_API_KEY=sk-ant-api03-REPLACE_WITH_YOUR_ACTUAL_KEY
# With your actual key:
# ANTHROPIC_API_KEY=sk-ant-api03-your-real-key-here
```

### 2. Start Backend Server

Open **Terminal 1**:

```bash
cd /home/user/oviya-backend

# Start backend
npm run dev

# You should see:
# ▲ Next.js 14.x.x
# - Local: http://localhost:3000
# ✓ Ready in X.Xs
```

**Keep this terminal running!**

### 3. Test Backend Endpoints

Open **Terminal 2**:

```bash
# Test health check
curl http://localhost:3000/api/health

# Should return:
# {
#   "status": "healthy",
#   "service": "oviya-backend",
#   ...
# }

# Test chat endpoint (optional)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "systemPrompt": "You are a helpful assistant.",
    "messages": [{"role": "user", "content": "Say hello!"}]
  }'

# Should return a chat response from Claude
```

### 4. Start Expo Frontend

Open **Terminal 3**:

```bash
cd /home/user/oviya-companion

# Make sure .env file exists
cat .env

# Should show:
# EXPO_PUBLIC_API_URL=http://localhost:3000
# EXPO_PUBLIC_SUPABASE_URL=https://...
# (and other variables)

# Start Expo
bun run start

# Or if you want web preview:
# bun run start-web
```

### 5. Open on Device

Once Expo starts, you'll see a QR code:

**On Mobile Device:**
1. Open **Expo Go** app
2. Scan the QR code
3. App will load

**On Web:**
1. Press `w` in the terminal
2. Opens browser automatically

**On iOS Simulator:**
1. Press `i` in the terminal
2. Opens in simulator

**On Android Emulator:**
1. Press `a` in the terminal
2. Opens in emulator

---

## 🧪 What to Test

### Test 1: App Loads ✅
- [ ] App opens without errors
- [ ] See splash screen
- [ ] See onboarding or login screen

### Test 2: Authentication ✅
- [ ] Can create account or login
- [ ] No errors in console
- [ ] User profile loads

### Test 3: Environment Variables ✅
- [ ] Check Expo console logs
- [ ] Should NOT see warnings about missing API keys
- [ ] If you see warnings, check your `.env` file

### Test 4: Chat Functionality ✅
- [ ] Can see chat screen
- [ ] Can type message
- [ ] Can send message
- [ ] Loading indicator appears
- [ ] Response arrives from Oviya (via Claude API)
- [ ] Message appears in chat

### Test 5: Rate Limiting ✅
- [ ] Send 10 messages quickly
- [ ] On 11th message, should get rate limit error
- [ ] Wait 60 seconds
- [ ] Can send messages again

### Test 6: Message Persistence ✅
- [ ] Send a few messages
- [ ] Close app
- [ ] Reopen app
- [ ] Messages are still there
- [ ] Only last 50 messages load (performance optimization)

---

## 📊 Expected Console Output

### Backend Console (Terminal 1)
```
▲ Next.js 14.x.x
- Local: http://localhost:3000

✓ Ready in 2.5s
○ Compiling /api/chat ...
✓ Compiled /api/chat in 1.2s
[Chat API] Processing message for user xxx
[Chat API] Successfully generated response for user xxx
```

### Frontend Console (Terminal 3)
```
› Metro waiting on exp://...
› Scan the QR code above with Expo Go (iOS)
[Claude Service] Calling backend: http://localhost:3000/api/chat
[Claude Service] Response received (X tokens)
[ChatScreen] Got response from Claude
```

---

## 🐛 Troubleshooting

### "Cannot connect to backend"

**Check:**
1. Backend is running in Terminal 1
2. `.env` has `EXPO_PUBLIC_API_URL=http://localhost:3000`
3. No firewall blocking port 3000

**Fix:**
```bash
# Restart backend
cd /home/user/oviya-backend
npm run dev

# Check it's running
curl http://localhost:3000/api/health
```

### "ANTHROPIC_API_KEY is not defined"

**Check:**
1. `/home/user/oviya-backend/.env.local` exists
2. Contains your real API key
3. No extra spaces or quotes

**Fix:**
```bash
cd /home/user/oviya-backend
echo "ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key" > .env.local

# Restart backend
npm run dev
```

### "Supabase error"

**Check:**
1. `.env` file exists in `/home/user/oviya-companion/`
2. Contains `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. Internet connection is working

**Fix:**
```bash
cd /home/user/oviya-companion
cat .env

# Should have EXPO_PUBLIC_SUPABASE_* variables
# If missing, copy from .env.example
```

### "Rate limit exceeded"

**This is expected!** ✅

The system is working correctly. Rate limiting prevents abuse:
- Limit: 10 messages per minute per user
- Reset: After 60 seconds
- Wait 1 minute and try again

### "Metro bundler error"

**Fix:**
```bash
cd /home/user/oviya-companion

# Clear cache and restart
bun run start --clear

# Or
rm -rf .expo node_modules
bun install
bun run start
```

---

## ✅ Success Criteria

Your Tier 0 implementation is working if:

1. ✅ Backend starts without errors
2. ✅ Health check returns JSON
3. ✅ Frontend loads in Expo
4. ✅ Can login/signup
5. ✅ Can send messages
6. ✅ Oviya responds with Claude AI
7. ✅ Rate limiting kicks in at 10 messages
8. ✅ Messages persist in database
9. ✅ No console errors (except expected rate limit)

---

## 📸 Testing Checklist

**Before Testing:**
- [ ] Anthropic API key obtained
- [ ] Backend `.env.local` configured
- [ ] Frontend `.env` file exists
- [ ] All environment variables set

**During Testing:**
- [ ] Terminal 1: Backend running
- [ ] Terminal 2: For testing commands (optional)
- [ ] Terminal 3: Expo running
- [ ] Device: Expo Go app open

**After Testing:**
- [ ] All tests pass
- [ ] No critical errors
- [ ] Ready for deployment

---

## 🚀 Next Steps After Testing

Once testing is complete:

### If Everything Works ✅
1. **Deploy backend to Vercel**
   ```bash
   cd /home/user/oviya-backend
   vercel --prod
   ```

2. **Update frontend .env**
   ```bash
   # Change:
   EXPO_PUBLIC_API_URL=http://localhost:3000
   # To:
   EXPO_PUBLIC_API_URL=https://your-backend.vercel.app
   ```

3. **Deploy frontend**
   ```bash
   cd /home/user/oviya-companion
   git add .
   git commit -m "Ready for production"
   git push
   ```

4. **Invite beta users!** 🎉

### If Issues Found 🐛
1. Check troubleshooting section above
2. Check `DEPLOYMENT_GUIDE.md`
3. Review console logs for specific errors
4. Ensure all environment variables are set correctly

---

## 💡 Tips

**Performance:**
- Backend responds in <1s with Claude API
- First message may be slower (cold start)
- Subsequent messages are faster

**Cost Monitoring:**
- Check Anthropic dashboard for API usage
- Expected: ~$0.01-0.03 per conversation
- For 100 test messages: ~$1-3

**Best Practices:**
- Test with 2-3 users first
- Monitor backend logs during testing
- Check Supabase for message persistence
- Verify rate limiting works

---

## 📞 Support

**Documentation:**
- Deployment: `DEPLOYMENT_GUIDE.md`
- Complete guide: `IMPLEMENTATION_COMPLETE.md`
- Scaling plan: `SCALING_ROADMAP.md`

**Logs:**
- Backend: Terminal 1 (npm run dev output)
- Frontend: Terminal 3 (Expo output)
- Browser console: Press F12 in web browser

**APIs:**
- Anthropic: https://console.anthropic.com/
- Supabase: https://supabase.com/dashboard
- Vercel: https://vercel.com/dashboard

---

## 🎉 Ready to Test!

Run these commands in separate terminals:

```bash
# Terminal 1: Backend
cd /home/user/oviya-backend
npm run dev

# Terminal 3: Frontend
cd /home/user/oviya-companion
bun run start
```

Then scan the QR code and start chatting! 🚀
