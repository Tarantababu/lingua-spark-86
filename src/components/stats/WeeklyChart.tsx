import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface DayData {
  date: string;
  day: string;
  lingqs: number;
  goal: number;
}

interface WeeklyChartProps {
  data: DayData[];
  dailyGoal: number;
}

export function WeeklyChart({ data, dailyGoal }: WeeklyChartProps) {
  const totalLingQs = data.reduce((sum, d) => sum + d.lingqs, 0);
  const avgLingQs = Math.round(totalLingQs / data.length);
  const daysGoalMet = data.filter(d => d.lingqs >= dailyGoal).length;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const metGoal = value >= dailyGoal;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{label}</p>
          <p className="text-sm text-muted-foreground">
            {value} LingQs {metGoal && '✓'}
          </p>
          {!metGoal && (
            <p className="text-xs text-muted-foreground">
              {dailyGoal - value} to goal
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Weekly Activity
          </CardTitle>
          <div className="flex gap-4 text-sm">
            <span className="text-muted-foreground">
              Avg: <span className="font-medium text-foreground">{avgLingQs}</span>
            </span>
            <span className="text-muted-foreground">
              Goal met: <span className="font-medium text-success">{daysGoalMet}/7</span>
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorLingqs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                vertical={false}
              />
              <XAxis 
                dataKey="day" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              {/* Goal line */}
              <Area
                type="monotone"
                dataKey="goal"
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                fill="none"
                strokeWidth={1}
              />
              {/* Actual data */}
              <Area
                type="monotone"
                dataKey="lingqs"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorLingqs)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
