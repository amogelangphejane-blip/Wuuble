import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WalletService } from '@/services/walletService';
import { EarningsBreakdown } from '@/types/wallet';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface EarningsChartProps {
  walletId: string;
}

export function EarningsChart({ walletId }: EarningsChartProps) {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [earningsData, setEarningsData] = useState<EarningsBreakdown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEarningsData();
  }, [walletId, period]);

  const loadEarningsData = async () => {
    setLoading(true);
    setError(null);

    try {
      const periods = getPeriods(period);
      const data: EarningsBreakdown[] = [];

      for (const { start, end } of periods) {
        const breakdown = await WalletService.getEarningsBreakdown(
          walletId,
          start.toISOString(),
          end.toISOString()
        );
        
        if (breakdown) {
          data.push(breakdown);
        }
      }

      setEarningsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const getPeriods = (period: string) => {
    const now = new Date();
    const periods: { start: Date; end: Date }[] = [];

    switch (period) {
      case '7d':
        // Last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const start = new Date(date);
          start.setHours(0, 0, 0, 0);
          const end = new Date(date);
          end.setHours(23, 59, 59, 999);
          periods.push({ start, end });
        }
        break;
      
      case '30d':
        // Last 4 weeks
        for (let i = 3; i >= 0; i--) {
          const endDate = new Date(now);
          endDate.setDate(endDate.getDate() - (i * 7));
          const startDate = new Date(endDate);
          startDate.setDate(startDate.getDate() - 6);
          periods.push({ start: startDate, end: endDate });
        }
        break;
      
      case '90d':
        // Last 3 months
        for (let i = 2; i >= 0; i--) {
          const endDate = new Date(now);
          endDate.setMonth(endDate.getMonth() - i);
          endDate.setDate(0); // Last day of previous month
          const startDate = new Date(endDate);
          startDate.setDate(1); // First day of month
          periods.push({ start: startDate, end: endDate });
        }
        break;
      
      case '1y':
        // Last 12 months
        for (let i = 11; i >= 0; i--) {
          const endDate = new Date(now);
          endDate.setMonth(endDate.getMonth() - i);
          endDate.setDate(0); // Last day of previous month
          const startDate = new Date(endDate);
          startDate.setDate(1); // First day of month
          periods.push({ start: startDate, end: endDate });
        }
        break;
    }

    return periods;
  };

  const formatPeriodLabel = (breakdown: EarningsBreakdown, index: number) => {
    const start = new Date(breakdown.period_start);
    
    switch (period) {
      case '7d':
        return start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      case '30d':
        return `Week ${index + 1}`;
      case '90d':
        return start.toLocaleDateString('en-US', { month: 'short' });
      case '1y':
        return start.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      default:
        return start.toLocaleDateString();
    }
  };

  const calculateTrend = () => {
    if (earningsData.length < 2) return { trend: 'neutral', percentage: 0 };
    
    const latest = earningsData[earningsData.length - 1]?.net_earnings || 0;
    const previous = earningsData[earningsData.length - 2]?.net_earnings || 0;
    
    if (previous === 0) return { trend: 'neutral', percentage: 0 };
    
    const percentage = ((latest - previous) / previous) * 100;
    const trend = percentage > 5 ? 'up' : percentage < -5 ? 'down' : 'neutral';
    
    return { trend, percentage: Math.abs(percentage) };
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const maxEarnings = Math.max(...earningsData.map(d => d.net_earnings));
  const totalEarnings = earningsData.reduce((sum, d) => sum + d.net_earnings, 0);
  const { trend, percentage } = calculateTrend();

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          {getTrendIcon(trend)}
          <span className={`text-sm font-medium ${getTrendColor(trend)}`}>
            {trend === 'up' && `+${percentage.toFixed(1)}%`}
            {trend === 'down' && `-${percentage.toFixed(1)}%`}
            {trend === 'neutral' && 'No change'}
          </span>
        </div>
        
        <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 Days</SelectItem>
            <SelectItem value="30d">30 Days</SelectItem>
            <SelectItem value="90d">90 Days</SelectItem>
            <SelectItem value="1y">1 Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Simple Bar Chart */}
      <div className="space-y-4">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Total: {formatCurrency(totalEarnings)}</span>
          <span>Avg: {formatCurrency(totalEarnings / Math.max(1, earningsData.length))}</span>
        </div>
        
        <div className="space-y-2">
          {earningsData.map((data, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-16 text-xs text-gray-500 text-right">
                {formatPeriodLabel(data, index)}
              </div>
              <div className="flex-1 relative">
                <div className="h-8 bg-gray-100 rounded-md overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 ease-in-out"
                    style={{
                      width: maxEarnings > 0 ? `${(data.net_earnings / maxEarnings) * 100}%` : '0%'
                    }}
                  />
                </div>
                <div className="absolute inset-y-0 right-2 flex items-center">
                  <span className="text-xs font-medium text-gray-700">
                    {formatCurrency(data.net_earnings)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {earningsData.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No earnings data available for this period</p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {earningsData.length > 0 && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-xs text-gray-500">Platform Fees</p>
            <p className="text-sm font-medium">
              {formatCurrency(earningsData.reduce((sum, d) => sum + d.platform_fees, 0))}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Gross Revenue</p>
            <p className="text-sm font-medium">
              {formatCurrency(earningsData.reduce((sum, d) => sum + d.gross_revenue, 0))}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}