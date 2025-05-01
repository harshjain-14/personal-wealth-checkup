
-- Create portfolio_snapshots table to store Zerodha portfolio data
CREATE TABLE IF NOT EXISTS public.portfolio_snapshots (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  snapshot_data JSONB NOT NULL,
  snapshot_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;

-- Users can view their own portfolio snapshots
CREATE POLICY "Users can view their own portfolio snapshots" 
  ON public.portfolio_snapshots 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can insert their own portfolio snapshots
CREATE POLICY "Users can create their own portfolio snapshots" 
  ON public.portfolio_snapshots 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Only allow service role to update or delete
CREATE POLICY "Service role can update portfolio snapshots" 
  ON public.portfolio_snapshots 
  FOR UPDATE 
  USING (false);

CREATE POLICY "Service role can delete portfolio snapshots" 
  ON public.portfolio_snapshots 
  FOR DELETE 
  USING (false);

-- Create index on user_id for faster lookups
CREATE INDEX portfolio_snapshots_user_id_idx ON public.portfolio_snapshots (user_id);
