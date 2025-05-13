
-- First, check if portfolio_analysis table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'portfolio_analysis') THEN
        -- Create the portfolio_analysis table if it doesn't exist
        CREATE TABLE IF NOT EXISTS public.portfolio_analysis (
          id BIGSERIAL PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id),
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
    END IF;
END
$$;

-- Update functions
DROP FUNCTION IF EXISTS public.get_latest_analysis();
CREATE OR REPLACE FUNCTION public.get_latest_analysis()
RETURNS jsonb AS $$
DECLARE
  user_id_var uuid;
  analysis_data jsonb;
  analysis_date timestamptz;
  result jsonb;
BEGIN
  -- Get the current user ID
  user_id_var := auth.uid();
  
  -- Find the latest analysis for the user
  SELECT pa.analysis_data, pa.analysis_date INTO analysis_data, analysis_date
  FROM portfolio_analysis pa
  WHERE pa.user_id = user_id_var
  ORDER BY pa.analysis_date DESC
  LIMIT 1;
  
  -- Add timestamps to the analysis data
  IF analysis_data IS NOT NULL THEN
    analysis_data := jsonb_set(
      jsonb_set(
        analysis_data, 
        '{timestamp}', 
        to_jsonb(analysis_date::text)
      ),
      '{generatedDate}',
      to_jsonb(analysis_date::text)
    );
  END IF;
  
  RETURN analysis_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.get_latest_portfolio_snapshot();
CREATE OR REPLACE FUNCTION public.get_latest_portfolio_snapshot()
RETURNS jsonb AS $$
DECLARE
  user_id_var uuid;
  snapshot jsonb;
BEGIN
  -- Get the current user ID
  user_id_var := auth.uid();
  
  -- Find the latest snapshot for the user
  SELECT snapshot_data INTO snapshot
  FROM portfolio_snapshots
  WHERE user_id = user_id_var
  ORDER BY snapshot_date DESC
  LIMIT 1;
  
  RETURN snapshot;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
