
-- Function to get the latest portfolio snapshot
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

-- Function to get the latest analysis
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
