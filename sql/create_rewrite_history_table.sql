-- Create rewrite_history table for tracking text rewrites
CREATE TABLE IF NOT EXISTS public.rewrite_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  rewritten_text TEXT NOT NULL,
  rewrite_type TEXT, -- e.g., 'humanizer', 'tone-mapper', 'readability-sculptor', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rewrite_history_user_id ON public.rewrite_history(user_id);
CREATE INDEX IF NOT EXISTS idx_rewrite_history_created_at ON public.rewrite_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rewrite_history_rewrite_type ON public.rewrite_history(rewrite_type);

-- Enable Row Level Security
ALTER TABLE public.rewrite_history ENABLE ROW LEVEL SECURITY;

-- Create policies for rewrite_history
-- Users can view their own rewrite history
CREATE POLICY "Users can view their own rewrite history"
  ON public.rewrite_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own rewrite history
CREATE POLICY "Users can insert their own rewrite history"
  ON public.rewrite_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own rewrite history
CREATE POLICY "Users can delete their own rewrite history"
  ON public.rewrite_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- Users can update their own rewrite history
CREATE POLICY "Users can update their own rewrite history"
  ON public.rewrite_history
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
