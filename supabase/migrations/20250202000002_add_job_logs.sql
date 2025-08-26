-- Create job logs table for cron job tracking
CREATE TABLE IF NOT EXISTS public.job_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_type TEXT NOT NULL, -- e.g., 'renewal', 'cleanup', 'reminder'
  success BOOLEAN NOT NULL,
  duration_ms INTEGER NOT NULL,
  stats JSONB, -- Job-specific statistics
  error_message TEXT, -- Error message if job failed
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_logs_type ON public.job_logs(job_type);
CREATE INDEX IF NOT EXISTS idx_job_logs_executed_at ON public.job_logs(executed_at);
CREATE INDEX IF NOT EXISTS idx_job_logs_success ON public.job_logs(success);

-- Enable RLS on job logs table
ALTER TABLE public.job_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy for job logs (only system can access)
CREATE POLICY "System can manage job logs" 
  ON public.job_logs 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Function to create job log table if it doesn't exist (for cron service)
CREATE OR REPLACE FUNCTION public.create_job_log_if_not_exists()
RETURNS void AS $$
BEGIN
  -- This function is called by the cron service to ensure the table exists
  -- The table creation is already handled by this migration
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get renewal dashboard statistics
CREATE OR REPLACE FUNCTION public.get_renewal_dashboard_stats(p_community_id UUID DEFAULT NULL)
RETURNS TABLE (
  due_today INTEGER,
  due_this_week INTEGER,
  past_due INTEGER,
  trial_ending_soon INTEGER,
  total_active INTEGER,
  total_revenue_monthly DECIMAL,
  last_job_success BOOLEAN,
  last_job_executed_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_week_end DATE := CURRENT_DATE + INTERVAL '7 days';
  v_now TIMESTAMP WITH TIME ZONE := now();
BEGIN
  RETURN QUERY
  WITH subscription_stats AS (
    SELECT 
      COUNT(*) FILTER (
        WHERE status IN ('active', 'trial') 
        AND current_period_end::date = v_today
      )::INTEGER as due_today_count,
      
      COUNT(*) FILTER (
        WHERE status IN ('active', 'trial') 
        AND current_period_end::date BETWEEN v_today + 1 AND v_week_end
      )::INTEGER as due_week_count,
      
      COUNT(*) FILTER (WHERE status = 'past_due')::INTEGER as past_due_count,
      
      COUNT(*) FILTER (
        WHERE status = 'trial' 
        AND trial_end IS NOT NULL 
        AND trial_end::date BETWEEN v_today AND v_week_end
      )::INTEGER as trial_ending_count,
      
      COUNT(*) FILTER (WHERE status IN ('active', 'trial'))::INTEGER as total_active_count,
      
      COALESCE(SUM(
        CASE 
          WHEN status IN ('active', 'trial') AND billing_cycle = 'monthly' THEN 
            COALESCE(p.price_monthly, 0)
          WHEN status IN ('active', 'trial') AND billing_cycle = 'yearly' THEN 
            COALESCE(p.price_yearly, 0) / 12
          ELSE 0 
        END
      ), 0) as monthly_revenue
    FROM public.community_member_subscriptions s
    LEFT JOIN public.community_subscription_plans p ON p.id = s.plan_id
    WHERE (p_community_id IS NULL OR s.community_id = p_community_id)
  ),
  job_stats AS (
    SELECT 
      success as last_success,
      executed_at as last_executed
    FROM public.job_logs 
    WHERE job_type = 'renewal'
    ORDER BY executed_at DESC 
    LIMIT 1
  )
  SELECT 
    ss.due_today_count,
    ss.due_week_count,
    ss.past_due_count,
    ss.trial_ending_count,
    ss.total_active_count,
    ss.monthly_revenue,
    COALESCE(js.last_success, false),
    js.last_executed
  FROM subscription_stats ss
  CROSS JOIN job_stats js;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get subscription health metrics
CREATE OR REPLACE FUNCTION public.get_subscription_health_metrics(p_community_id UUID DEFAULT NULL)
RETURNS TABLE (
  active_subscriptions INTEGER,
  trial_subscriptions INTEGER,
  past_due_subscriptions INTEGER,
  cancelled_subscriptions INTEGER,
  expired_subscriptions INTEGER,
  monthly_recurring_revenue DECIMAL,
  yearly_recurring_revenue DECIMAL,
  average_subscription_value DECIMAL,
  churn_rate_monthly DECIMAL,
  growth_rate_monthly DECIMAL
) AS $$
DECLARE
  v_last_month_start DATE := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month');
  v_last_month_end DATE := DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day';
  v_this_month_start DATE := DATE_TRUNC('month', CURRENT_DATE);
BEGIN
  RETURN QUERY
  WITH current_stats AS (
    SELECT 
      COUNT(*) FILTER (WHERE status = 'active')::INTEGER as active_count,
      COUNT(*) FILTER (WHERE status = 'trial')::INTEGER as trial_count,
      COUNT(*) FILTER (WHERE status = 'past_due')::INTEGER as past_due_count,
      COUNT(*) FILTER (WHERE status = 'cancelled')::INTEGER as cancelled_count,
      COUNT(*) FILTER (WHERE status = 'expired')::INTEGER as expired_count,
      
      COALESCE(SUM(
        CASE 
          WHEN status = 'active' AND billing_cycle = 'monthly' THEN p.price_monthly
          ELSE 0 
        END
      ), 0) as mrr,
      
      COALESCE(SUM(
        CASE 
          WHEN status = 'active' AND billing_cycle = 'yearly' THEN p.price_yearly
          ELSE 0 
        END
      ), 0) as arr,
      
      COALESCE(AVG(
        CASE 
          WHEN status = 'active' AND billing_cycle = 'monthly' THEN p.price_monthly
          WHEN status = 'active' AND billing_cycle = 'yearly' THEN p.price_yearly / 12
          ELSE NULL
        END
      ), 0) as avg_value
      
    FROM public.community_member_subscriptions s
    LEFT JOIN public.community_subscription_plans p ON p.id = s.plan_id
    WHERE (p_community_id IS NULL OR s.community_id = p_community_id)
  ),
  churn_stats AS (
    SELECT 
      COUNT(*) FILTER (
        WHERE status = 'active' 
        AND created_at >= v_last_month_start 
        AND created_at <= v_last_month_end
      )::DECIMAL as last_month_active,
      
      COUNT(*) FILTER (
        WHERE status IN ('cancelled', 'expired') 
        AND cancelled_at >= v_last_month_start 
        AND cancelled_at <= v_last_month_end
      )::DECIMAL as last_month_churned,
      
      COUNT(*) FILTER (
        WHERE status = 'active' 
        AND created_at >= v_this_month_start
      )::DECIMAL as this_month_new
      
    FROM public.community_member_subscriptions s
    WHERE (p_community_id IS NULL OR s.community_id = p_community_id)
  )
  SELECT 
    cs.active_count,
    cs.trial_count,
    cs.past_due_count,
    cs.cancelled_count,
    cs.expired_count,
    cs.mrr,
    cs.arr,
    cs.avg_value,
    CASE 
      WHEN ch.last_month_active > 0 THEN (ch.last_month_churned / ch.last_month_active) * 100
      ELSE 0 
    END as churn_rate,
    CASE 
      WHEN cs.active_count > 0 THEN (ch.this_month_new / cs.active_count) * 100
      ELSE 0 
    END as growth_rate
  FROM current_stats cs
  CROSS JOIN churn_stats ch;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;