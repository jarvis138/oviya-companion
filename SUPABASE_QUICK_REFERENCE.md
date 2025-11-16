# 🎯 Supabase Quick Reference

## 📋 Setup Checklist (2 Steps)

### 1. Run Migration SQL
- Go to: https://mrmebjsuiaqeentaqeya.supabase.co
- Click: **SQL Editor**
- Copy: All code from `supabase-migration.sql`
- Paste & **RUN**

### 2. Enable Anonymous Auth
- Go to: **Authentication** → **Providers**
- Toggle: **Anonymous** → **ON**
- Click: **Save**

---

## 📊 Database Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User profiles | id, name, email, avatar_emoji, preferences |
| `messages` | Chat history | user_id, role, parts, timestamp, reactions |
| `user_memory` | Semantic memory | user_id, important_facts, stress_level, mood |
| `detected_strengths` | Growth tracking | user_id, strength_type, context, quote |

---

## 🔧 How to Use

### Query Messages
```typescript
const { data } = await supabase
  .from('messages')
  .select('*')
  .eq('user_id', userId)
  .order('timestamp', { ascending: true });
```

### Insert Message
```typescript
await supabase.from('messages').insert({
  user_id: userId,
  role: 'user',
  parts: [{ type: 'text', text: 'Hello!' }],
  timestamp: Date.now(),
});
```

### Update Memory
```typescript
await supabase
  .from('user_memory')
  .update({ stress_level: 5 })
  .eq('user_id', userId);
```

### Add Reaction
```typescript
await supabase
  .from('messages')
  .update({ reactions: [...existingReactions, newReaction] })
  .eq('id', messageId);
```

---

## 🚨 Common Errors & Fixes

| Error | Fix |
|-------|-----|
| "Failed to create anonymous user" | Enable anonymous auth in Dashboard |
| "relation does not exist" | Run migration SQL |
| "violates row-level security" | Re-run migration SQL |
| "Cannot read property of undefined" | Check user is authenticated |

---

## 📱 Testing Flow

1. Run app → Anonymous user created automatically
2. Send message → Check `messages` table
3. Update profile → Check `users` table
4. Track stress → Check `user_memory` table

---

## 🔗 Important Links

- **Dashboard**: https://mrmebjsuiaqeentaqeya.supabase.co
- **SQL Editor**: Dashboard → SQL Editor
- **Table Editor**: Dashboard → Table Editor
- **Auth Users**: Dashboard → Authentication → Users
- **Logs**: Dashboard → Logs → Postgres Logs

---

## 📝 Project Credentials

```typescript
URL: https://mrmebjsuiaqeentaqeya.supabase.co
ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
(full key in services/supabase.ts)
```

---

## ✅ Verification

After setup, verify:
- [ ] Tables exist in Table Editor
- [ ] Anonymous user in Authentication → Users
- [ ] User record in users table
- [ ] Message appears after sending
- [ ] No RLS policy errors in console

---

**Need help?** See `SUPABASE_SUMMARY.md` for full guide!
