
-- SQL migration to create or replace necessary RPC functions

-- Function to get the latest portfolio snapshot
CREATE OR REPLACE FUNCTION get_latest_portfolio_snapshot(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_snapshot_data JSONB;
BEGIN
    SELECT snapshot_data INTO v_snapshot_data
    FROM portfolio_snapshots
    WHERE user_id = p_user_id
    ORDER BY snapshot_date DESC
    LIMIT 1;
    
    RETURN v_snapshot_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to save a portfolio snapshot
CREATE OR REPLACE FUNCTION save_portfolio_snapshot(p_user_id UUID, p_snapshot_data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO portfolio_snapshots(user_id, snapshot_data, snapshot_date)
    VALUES (p_user_id, p_snapshot_data, NOW());
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get the latest portfolio analysis
CREATE OR REPLACE FUNCTION get_latest_analysis(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_analysis_data JSONB;
BEGIN
    SELECT analysis_data INTO v_analysis_data
    FROM portfolio_analysis
    WHERE user_id = p_user_id
    ORDER BY analysis_date DESC
    LIMIT 1;
    
    RETURN v_analysis_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to save portfolio analysis
CREATE OR REPLACE FUNCTION save_portfolio_analysis(p_user_id UUID, p_analysis_data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO portfolio_analysis(user_id, analysis_data, analysis_date)
    VALUES (p_user_id, p_analysis_data, NOW());
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure proper RLS policies for these tables
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies for portfolio_snapshots
CREATE POLICY "Users can view their own portfolio snapshots"
    ON portfolio_snapshots
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own portfolio snapshots"
    ON portfolio_snapshots
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policies for portfolio_analysis
CREATE POLICY "Users can view their own portfolio analysis"
    ON portfolio_analysis
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own portfolio analysis"
    ON portfolio_analysis
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
