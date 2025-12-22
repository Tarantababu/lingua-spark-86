import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface DayActivity {
  date: string;
  count: number;
  dayOfWeek: number;
}

interface ActivityHeatmapProps {
  data: DayActivity[];
  dailyGoal: number;
  days?: number;
}

export function ActivityHeatmap({ data, dailyGoal, days = 28 }: ActivityHeatmapProps) {
  // Generate last N days
  const generateDays = () => {
    const result: DayActivity[] = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const existing = data.find(d => d.date === dateStr);
      
      result.push({
        date: dateStr,
        count: existing?.count || 0,
        dayOfWeek: date.getDay(),
      });
    }
    
    return result;
  };

  const activityData = generateDays();
  
  const getIntensityClass = (count: number) => {
    if (count === 0) return 'heatmap-empty';
    if (count < dailyGoal * 0.5) return 'heatmap-low';
    if (count < dailyGoal) return 'heatmap-medium';
    if (count === dailyGoal) return 'heatmap-high';
    return 'heatmap-max';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Group by weeks for display
  const weeks: DayActivity[][] = [];
  let currentWeek: DayActivity[] = [];
  
  activityData.forEach((day, index) => {
    if (index === 0) {
      // Pad the first week with empty cells
      for (let i = 0; i < day.dayOfWeek; i++) {
        currentWeek.push({ date: '', count: -1, dayOfWeek: i });
      }
    }
    
    currentWeek.push(day);
    
    if (day.dayOfWeek === 6 || index === activityData.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const totalActivity = activityData.reduce((sum, d) => sum + Math.max(0, d.count), 0);
  const activeDays = activityData.filter(d => d.count > 0).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Activity Calendar
          </CardTitle>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>
              {activeDays} active days
            </span>
            <span>
              {totalActivity} total LingQs
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="flex gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  day.count === -1 ? (
                    <div key={`empty-${dayIndex}`} className="w-4 h-4" />
                  ) : (
                    <Tooltip key={day.date}>
                      <TooltipTrigger asChild>
                        <div 
                          className={cn(
                            "w-4 h-4 heatmap-cell cursor-default",
                            getIntensityClass(day.count)
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-sm">
                          <p className="font-medium">{formatDate(day.date)}</p>
                          <p className="text-muted-foreground">
                            {day.count} LingQs
                            {day.count >= dailyGoal && ' ✓ Goal met!'}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )
                ))}
              </div>
            ))}
          </div>
        </TooltipProvider>
        
        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded heatmap-empty" />
            <div className="w-3 h-3 rounded heatmap-low" />
            <div className="w-3 h-3 rounded heatmap-medium" />
            <div className="w-3 h-3 rounded heatmap-high" />
            <div className="w-3 h-3 rounded heatmap-max" />
          </div>
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}
