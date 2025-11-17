-- OVIYA RLS Policy Fix for Non-Auth Users
-- Run this in your Supabase SQL Editor to fix RLS issues

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

DROP POLICY IF EXISTS "Users can view their own memory" ON user_memory;
DROP POLICY IF EXISTS "Users can insert their own memory" ON user_memory;
DROP POLICY IF EXISTS "Users can update their own memory" ON user_memory;
DROP POLICY IF EXISTS "Users can delete their own memory" ON user_memory;

DROP POLICY IF EXISTS "Users can view their own strengths" ON detected_strengths;
DROP POLICY IF EXISTS "Users can insert their own strengths" ON detected_strengths;
DROP POLICY IF EXISTS "Users can delete their own strengths" ON detected_strengths;

-- Create permissive policies for users table (allow all operations)
CREATE POLICY "Allow all operations on users"
  ON users FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create permissive policies for messages table (allow all operations)
CREATE POLICY "Allow all operations on messages"
  ON messages FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create permissive policies for user_memory table (allow all operations)
CREATE POLICY "Allow all operations on user_memory"
  ON user_memory FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create permissive policies for detected_strengths table (allow all operations)
CREATE POLICY "Allow all operations on detected_strengths"
  ON detected_strengths FOR ALL
  USING (true)
  WITH CHECK (true);
