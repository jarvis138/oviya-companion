-- OVIYA Database Migration
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT,
  name TEXT,
  avatar_emoji TEXT DEFAULT '😊',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  preferences JSONB DEFAULT '{"notifications": true, "soundEffects": true, "hapticFeedback": true}'::JSONB,
  onboarding_completed BOOLEAN DEFAULT FALSE
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  parts JSONB NOT NULL,
  timestamp BIGINT NOT NULL,
  reactions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User memory table
CREATE TABLE IF NOT EXISTS user_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  name TEXT,
  preferences JSONB DEFAULT '{}'::JSONB,
  important_facts TEXT[] DEFAULT ARRAY[]::TEXT[],
  first_met_date BIGINT NOT NULL,
  last_active_date BIGINT NOT NULL,
  stress_level INTEGER DEFAULT 0,
  consecutive_stress_days INTEGER DEFAULT 0,
  last_stress_date BIGINT,
  celebrated_milestones BIGINT[] DEFAULT ARRAY[]::BIGINT[],
  saved_moments TEXT[] DEFAULT ARRAY[]::TEXT[],
  current_mood TEXT DEFAULT 'caring' CHECK (current_mood IN ('playful', 'reflective', 'energetic', 'cozy', 'caring')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Detected strengths table
CREATE TABLE IF NOT EXISTS detected_strengths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  strength_type TEXT NOT NULL,
  context TEXT NOT NULL,
  quote TEXT NOT NULL,
  detected_at BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_memory_user_id ON user_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_detected_strengths_user_id ON detected_strengths(user_id);
CREATE INDEX IF NOT EXISTS idx_detected_strengths_strength_type ON detected_strengths(strength_type);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE detected_strengths ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

-- RLS Policies for messages table
CREATE POLICY "Users can view their own messages"
  ON messages FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own messages"
  ON messages FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
  ON messages FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for user_memory table
CREATE POLICY "Users can view their own memory"
  ON user_memory FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own memory"
  ON user_memory FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own memory"
  ON user_memory FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own memory"
  ON user_memory FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for detected_strengths table
CREATE POLICY "Users can view their own strengths"
  ON detected_strengths FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own strengths"
  ON detected_strengths FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own strengths"
  ON detected_strengths FOR DELETE
  USING (user_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_memory_updated_at BEFORE UPDATE ON user_memory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
