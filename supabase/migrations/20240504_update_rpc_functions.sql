
-- Create the RPC function for saving portfolio analysis
CREATE OR REPLACE FUNCTION public.save_portfolio_analysis(
  analysis_data jsonb,
  user_id_input uuid,
  generated_at_input timestamp with time zone
) RETURNS void AS $$
BEGIN
  INSERT INTO public.portfolio_analysis (
    user_id,
    analysis_data,
    generated_at
  ) VALUES (
    user_id_input,
    analysis_data,
    generated_at_input
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the RPC function for getting the latest portfolio analysis
CREATE OR REPLACE FUNCTION public.get_latest_portfolio_analysis(
  user_id_input uuid
) RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT 
    jsonb_build_object(
      'id', id,
      'analysis_data', analysis_data,
      'generated_at', generated_at
    )
  INTO result
  FROM public.portfolio_analysis
  WHERE user_id = user_id_input
  ORDER BY generated_at DESC
  LIMIT 1;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the RPC function for getting all portfolio analyses
CREATE OR REPLACE FUNCTION public.get_all_portfolio_analyses(
  user_id_input uuid
) RETURNS jsonb[] AS $$
DECLARE
  result jsonb[];
BEGIN
  SELECT 
    array_agg(
      jsonb_build_object(
        'id', id,
        'analysis_data', analysis_data,
        'generated_at', generated_at
      )
    )
  INTO result
  FROM public.portfolio_analysis
  WHERE user_id = user_id_input
  ORDER BY generated_at DESC;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix portfolio_analysis table schema if it doesn't exist yet
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'portfolio_analysis') THEN
    CREATE TABLE public.portfolio_analysis (
      id BIGSERIAL PRIMARY KEY,
      user_id UUID REFERENCES auth.users NOT NULL,
      analysis_data JSONB NOT NULL,
      generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
  END IF;
END
$$;

-- Ensure appropriate permissions
ALTER FUNCTION public.save_portfolio_analysis(jsonb, uuid, timestamp with time zone) OWNER TO postgres;
ALTER FUNCTION public.get_latest_portfolio_analysis(uuid) OWNER TO postgres;
ALTER FUNCTION public.get_all_portfolio_analyses(uuid) OWNER TO postgres;

-- Set the RLS policies for the portfolio_analysis table
ALTER TABLE IF EXISTS public.portfolio_analysis ENABLE ROW LEVEL SECURITY;

-- Ensure the RLS policy exists for selecting data
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_catalog.pg_policies 
    WHERE tablename = 'portfolio_analysis' 
    AND policyname = 'Users can view their own analyses'
  ) THEN
    CREATE POLICY "Users can view their own analyses" 
      ON public.portfolio_analysis FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Ensure the RLS policy exists for inserting data
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_catalog.pg_policies 
    WHERE tablename = 'portfolio_analysis' 
    AND policyname = 'Users can insert their own analyses'
  ) THEN
    CREATE POLICY "Users can insert their own analyses" 
      ON public.portfolio_analysis FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;
