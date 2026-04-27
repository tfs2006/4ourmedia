-- ============================================
-- PromoGen Database Schema for Supabase
-- ============================================
-- Run this SQL in your Supabase SQL Editor:
-- https://app.supabase.com → Your Project → SQL Editor → New Query
-- ============================================

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
-- Stores user credits and profile data
-- Links to Supabase Auth users via id

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  credits INTEGER DEFAULT 3 NOT NULL,
  total_purchased INTEGER DEFAULT 0 NOT NULL,
  total_used INTEGER DEFAULT 0 NOT NULL,
  last_daily_credit TIMESTAMP WITH TIME ZONE,
  streak_days INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own data
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Allow insert for new users (triggered by auth)
CREATE POLICY "Enable insert for authenticated users" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- PURCHASES TABLE
-- ============================================
-- Records all credit purchases for audit trail

CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  plan_id TEXT,
  credits INTEGER NOT NULL,
  amount_cents INTEGER,
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_stripe_session ON public.purchases(stripe_session_id);

-- Enable Row Level Security
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Users can only view their own purchases
CREATE POLICY "Users can view own purchases" ON public.purchases
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert purchases (from webhook)
CREATE POLICY "Service role can insert purchases" ON public.purchases
  FOR INSERT WITH CHECK (true);

-- ============================================
-- PROMO HISTORY TABLE
-- ============================================
-- Stores generated promos for user history

CREATE TABLE IF NOT EXISTS public.promo_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  analysis JSONB NOT NULL,
  background_image TEXT, -- Base64 or URL
  final_image TEXT, -- Base64 or URL
  brand_kit_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_promo_history_user_id ON public.promo_history(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_history_created ON public.promo_history(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.promo_history ENABLE ROW LEVEL SECURITY;

-- Users can only access their own history
CREATE POLICY "Users can view own history" ON public.promo_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history" ON public.promo_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own history" ON public.promo_history
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- BRAND KITS TABLE (Optional - for cloud sync)
-- ============================================
-- Stores user brand kits in the cloud

CREATE TABLE IF NOT EXISTS public.brand_kits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  logo_url TEXT,
  logo_position TEXT DEFAULT 'top-center',
  logo_size INTEGER DEFAULT 30,
  display_url TEXT,
  primary_color TEXT DEFAULT '#8B5CF6',
  secondary_color TEXT DEFAULT '#EC4899',
  font_style TEXT DEFAULT 'modern',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index
CREATE INDEX IF NOT EXISTS idx_brand_kits_user_id ON public.brand_kits(user_id);

-- Enable Row Level Security
ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;

-- Users can only access their own brand kits
CREATE POLICY "Users can view own brand kits" ON public.brand_kits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brand kits" ON public.brand_kits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand kits" ON public.brand_kits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand kits" ON public.brand_kits
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to use a credit (atomic decrement)
CREATE OR REPLACE FUNCTION public.use_credit(user_uuid UUID)
RETURNS TABLE (success BOOLEAN, remaining INTEGER) AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Lock the row and get current credits
  SELECT credits INTO current_credits
  FROM public.users
  WHERE id = user_uuid
  FOR UPDATE;
  
  IF current_credits IS NULL OR current_credits <= 0 THEN
    RETURN QUERY SELECT FALSE, COALESCE(current_credits, 0);
    RETURN;
  END IF;
  
  -- Decrement credits
  UPDATE public.users
  SET credits = credits - 1, total_used = total_used + 1
  WHERE id = user_uuid;
  
  RETURN QUERY SELECT TRUE, current_credits - 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits (for purchases)
CREATE OR REPLACE FUNCTION public.add_credits(user_uuid UUID, amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  new_credits INTEGER;
BEGIN
  UPDATE public.users
  SET credits = credits + amount, total_purchased = total_purchased + amount
  WHERE id = user_uuid
  RETURNING credits INTO new_credits;
  
  RETURN new_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- API USAGE TRACKING TABLE
-- ============================================
-- Tracks all API calls for rate limiting and cost monitoring

CREATE TABLE IF NOT EXISTS public.api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  endpoint TEXT NOT NULL, -- 'analyze' or 'generate-image'
  ip_address TEXT,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  success BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_api_usage_created ON public.api_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON public.api_usage(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_usage_ip ON public.api_usage(ip_address);
CREATE INDEX IF NOT EXISTS idx_api_usage_user ON public.api_usage(user_id);

-- Composite index for date range queries
CREATE INDEX IF NOT EXISTS idx_api_usage_date_endpoint ON public.api_usage(created_at, endpoint);

-- Enable RLS (only service role can access)
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- Only service role can insert/read (backend only)
CREATE POLICY "Service role full access to api_usage" ON public.api_usage
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- USAGE STATS VIEW (for easy querying)
-- ============================================

CREATE OR REPLACE VIEW public.api_usage_stats AS
SELECT 
  DATE_TRUNC('day', created_at) AS day,
  endpoint,
  COUNT(*) AS total_calls,
  COUNT(*) FILTER (WHERE success = true) AS successful_calls,
  COUNT(DISTINCT ip_address) AS unique_ips,
  COUNT(DISTINCT user_id) AS unique_users
FROM public.api_usage
GROUP BY DATE_TRUNC('day', created_at), endpoint
ORDER BY day DESC;

-- ============================================
-- CLEANUP FUNCTION (optional - for cost savings)
-- ============================================
-- Deletes usage records older than 90 days

CREATE OR REPLACE FUNCTION public.cleanup_old_api_usage()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.api_usage
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.purchases TO authenticated;
GRANT ALL ON public.promo_history TO authenticated;
GRANT ALL ON public.brand_kits TO authenticated;

-- Grant access to service role (for webhooks and API usage tracking)
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.purchases TO service_role;
GRANT ALL ON public.api_usage TO service_role;

-- ============================================
-- BOT SALES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.bot_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  stripe_session_id TEXT UNIQUE NOT NULL,
  plan_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  buyer_email TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bot_sales_created ON public.bot_sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bot_sales_plan ON public.bot_sales(plan_id);

ALTER TABLE public.bot_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to bot_sales" ON public.bot_sales
  FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON public.bot_sales TO service_role;

-- ============================================
-- DONE!
-- ============================================
-- After running this SQL, you'll need to:
-- 1. Enable Email Auth in Authentication → Providers
-- 2. Enable Google Auth in Authentication → Providers (optional)
-- 3. Copy your Supabase URL and anon key to your .env file
