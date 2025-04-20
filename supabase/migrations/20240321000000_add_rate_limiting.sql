-- Create a table to track API requests
CREATE TABLE IF NOT EXISTS api_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    ip_address TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    request_count INT DEFAULT 1
);

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_api_requests_user_timestamp 
ON api_requests(user_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_api_requests_ip_timestamp 
ON api_requests(ip_address, timestamp);

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_user_id UUID,
    p_ip_address TEXT,
    p_endpoint TEXT,
    p_max_requests INT DEFAULT 100,
    p_window_seconds INT DEFAULT 60
) RETURNS BOOLEAN AS $$
DECLARE
    v_count INT;
BEGIN
    -- Clean up old records
    DELETE FROM api_requests 
    WHERE timestamp < NOW() - INTERVAL '1 day';

    -- Count requests within the time window
    SELECT COALESCE(SUM(request_count), 0) INTO v_count
    FROM api_requests
    WHERE (user_id = p_user_id OR ip_address = p_ip_address)
    AND endpoint = p_endpoint
    AND timestamp > NOW() - (p_window_seconds || ' seconds')::INTERVAL;

    -- If under limit, record the request and return true
    IF v_count < p_max_requests THEN
        INSERT INTO api_requests (user_id, ip_address, endpoint)
        VALUES (p_user_id, p_ip_address, p_endpoint);
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE api_requests ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts only through the check_rate_limit function
CREATE POLICY insert_api_requests ON api_requests
    FOR INSERT TO authenticated
    WITH CHECK (TRUE);

-- Create policy to allow reads only to the same user
CREATE POLICY read_own_requests ON api_requests
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Function to get remaining requests
CREATE OR REPLACE FUNCTION get_remaining_requests(
    p_user_id UUID,
    p_ip_address TEXT,
    p_endpoint TEXT,
    p_max_requests INT DEFAULT 100,
    p_window_seconds INT DEFAULT 60
) RETURNS INT AS $$
DECLARE
    v_count INT;
BEGIN
    SELECT COALESCE(SUM(request_count), 0) INTO v_count
    FROM api_requests
    WHERE (user_id = p_user_id OR ip_address = p_ip_address)
    AND endpoint = p_endpoint
    AND timestamp > NOW() - (p_window_seconds || ' seconds')::INTERVAL;

    RETURN p_max_requests - v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 