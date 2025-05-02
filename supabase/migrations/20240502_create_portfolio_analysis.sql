
-- Create table for storing portfolio analysis results
CREATE TABLE IF NOT EXISTS public.portfolio_analysis (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  portfolio_data JSONB NOT NULL,
  analysis_data JSONB NOT NULL,
  analysis_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.portfolio_analysis ENABLE ROW LEVEL SECURITY;

-- Users can only view their own analyses
CREATE POLICY "Users can view their own analyses" 
  ON public.portfolio_analysis 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can only insert their own analyses
CREATE POLICY "Users can insert their own analyses" 
  ON public.portfolio_analysis 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create index on user_id and analysis_date for faster queries
CREATE INDEX IF NOT EXISTS portfolio_analysis_user_id_analysis_date_idx 
  ON public.portfolio_analysis(user_id, analysis_date DESC);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS portfolio_analysis_user_id_idx 
  ON public.portfolio_analysis(user_id);
