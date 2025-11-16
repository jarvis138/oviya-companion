# Supabase Integration Setup Guide

## Step 1: Run the Migration

1. Go to your Supabase dashboard: https://mrmebjsuiaqeentaqeya.supabase.co
2. Navigate to SQL Editor
3. Copy the contents of `supabase-migration.sql`
4. Paste and run the SQL script

This will create:
- `users` table
- `messages` table  
- `user_memory` table
- `detected_strengths` table
- All necessary indexes and RLS policies

## Step 2: Enable Anonymous Sign-In (IMPORTANT)

1. In Supabase Dashboard, go to Authentication > Providers
2. Find "Anonymous" provider
3. Toggle it ON
4. Save

This is required because the app uses anonymous authentication for users.

## Step 3: Verify Tables

In Supabase Dashboard > Table Editor, you should see:
- users
- messages
- user_memory
- detected_strengths

## Step 4: Test the Integration

1. Run your app
2. It should automatically create an anonymous user on first launch
3. Check Supabase Dashboard > Authentication > Users to see the anonymous user
4. Check Table Editor > users to see the user record

## What's Integrated

### ✅ AuthContext
- Uses Supabase anonymous authentication
- Stores user profiles in `users` table
- Handles onboarding status
- Profile updates sync to database

### 🔄 ChatContext (Next Step)
- Will store messages in `messages` table
- Will store user memory in `user_memory` table  
- Will track detected strengths in `detected_strengths` table

## Environment Variables (Already Configured)

The following are hardcoded in `services/supabase.ts`:
- SUPABASE_URL: https://mrmebjsuiaqeentaqeya.supabase.co
- SUPABASE_ANON_KEY: eyJhbGc...

For production, you may want to move these to environment variables.

## Troubleshooting

### Issue: "Failed to create anonymous user"
**Solution:** Make sure anonymous sign-in is enabled in Authentication > Providers

### Issue: "new row violates row-level security policy"
**Solution:** Check that RLS policies are created correctly. Re-run the migration SQL.

### Issue: User not persisting across sessions
**Solution:** Verify AsyncStorage is working correctly. Supabase uses AsyncStorage to persist sessions.

## Next Steps

1. Update ChatContext to use Supabase (currently uses AsyncStorage)
2. Implement real-time message sync (optional)
3. Add vector embeddings for semantic memory search
4. Set up database backups
