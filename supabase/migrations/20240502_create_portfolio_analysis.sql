
-- Create portfolio_analysis table if it doesn't exist
CREATE TABLE IF NOT EXISTS portfolio_analysis (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_data JSONB NOT NULL,
  analysis_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_portfolio_analysis_user_id ON portfolio_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_analysis_date ON portfolio_analysis(analysis_date);

-- Enable RLS
ALTER TABLE portfolio_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own portfolio analysis"
  ON portfolio_analysis
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own portfolio analysis"
  ON portfolio_analysis
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
