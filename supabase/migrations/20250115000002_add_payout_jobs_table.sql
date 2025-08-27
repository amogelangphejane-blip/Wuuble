-- Add Payout Jobs Table for Automated Payout Processing
-- This table tracks scheduled and processed payout jobs

CREATE TABLE IF NOT EXISTS payout_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL,
  total_creators INTEGER DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0.00,
  successful_payouts INTEGER DEFAULT 0,
  failed_payouts INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Additional data
  metadata JSONB DEFAULT '{}',
  error_details TEXT,
  
  -- Constraints
  CONSTRAINT check_payout_job_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payout_jobs_status ON payout_jobs(status);
CREATE INDEX IF NOT EXISTS idx_payout_jobs_scheduled_date ON payout_jobs(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_payout_jobs_created_at ON payout_jobs(created_at);

-- RLS Policies (Admin only access)
ALTER TABLE payout_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only platform admins can access payout jobs" ON payout_jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'role' = 'platform_admin')
    )
  );

-- Function to get payout statistics
CREATE OR REPLACE FUNCTION get_payout_statistics(
  p_date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'role' = 'platform_admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  SELECT jsonb_build_object(
    'total_jobs', COUNT(*),
    'completed_jobs', COUNT(*) FILTER (WHERE status = 'completed'),
    'failed_jobs', COUNT(*) FILTER (WHERE status = 'failed'),
    'total_amount_paid', COALESCE(SUM(total_amount) FILTER (WHERE status = 'completed'), 0),
    'total_creators_paid', COALESCE(SUM(successful_payouts), 0),
    'average_payout_amount', CASE 
      WHEN SUM(successful_payouts) > 0 
      THEN ROUND(SUM(total_amount) FILTER (WHERE status = 'completed') / SUM(successful_payouts), 2)
      ELSE 0 
    END,
    'success_rate', CASE 
      WHEN COUNT(*) > 0 
      THEN ROUND((COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / COUNT(*)) * 100, 2)
      ELSE 0 
    END
  ) INTO v_stats
  FROM payout_jobs
  WHERE (p_date_from IS NULL OR created_at >= p_date_from)
    AND (p_date_to IS NULL OR created_at <= p_date_to);

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel pending payout jobs
CREATE OR REPLACE FUNCTION cancel_payout_job(p_job_id UUID)
RETURNS JSONB AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'role' = 'platform_admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Update job status to cancelled
  UPDATE payout_jobs
  SET 
    status = 'cancelled',
    completed_at = NOW(),
    error_details = 'Manually cancelled by admin'
  WHERE id = p_job_id 
    AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Job not found or not in pending status'
    );
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add some sample configuration data for testing
INSERT INTO platform_fee_config (fee_percentage, currency, is_active) 
VALUES (20.00, 'USD', true)
ON CONFLICT DO NOTHING;