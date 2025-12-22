import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target } from 'lucide-react';
import { CircularProgress } from './CircularProgress';
import { cn } from '@/lib/utils';

interface DailyGoalCardProps {
  current: number;
  goal: number;
  className?: string;
  hideHeader?: boolean;
}

export function DailyGoalCard({ current, goal, className, hideHeader }: DailyGoalCardProps) {
  const isComplete = current >= goal;
  const remaining = Math.max(0, goal - current);

  const getMotivationalMessage = () => {
    const percentage = (current / goal) * 100;
    if (percentage >= 100) return "🎉 Goal achieved! Keep going!";
    if (percentage >= 75) return "Almost there! You're so close!";
    if (percentage >= 50) return "Halfway there! Keep it up!";
    if (percentage >= 25) return "Great start! Keep pushing!";
    return "Let's start learning today!";
  };

  // If hideHeader, render simplified version
  if (hideHeader) {
    return (
      <div className={cn("flex items-center gap-6", className)}>
        <CircularProgress 
          value={current} 
          max={goal}
          size={100}
          strokeWidth={10}
          label="complete"
        />
        
        <div className="flex-1">
          <div className="text-3xl font-bold text-foreground">
            {current}
            <span className="text-lg text-muted-foreground font-normal">
              /{goal}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">LingQs created</p>
          
          <p className="mt-3 text-sm font-medium">
            {getMotivationalMessage()}
          </p>
          
          {!isComplete && (
            <p className="text-xs text-muted-foreground mt-1">
              {remaining} more to reach your daily goal
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={cn(
      "transition-all duration-300",
      isComplete && "ring-2 ring-success/50",
      className
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Today's Goal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <CircularProgress 
            value={current} 
            max={goal}
            size={100}
            strokeWidth={10}
            label="complete"
          />
          
          <div className="flex-1">
            <div className="text-3xl font-bold text-foreground">
              {current}
              <span className="text-lg text-muted-foreground font-normal">
                /{goal}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">LingQs created</p>
            
            <p className="mt-3 text-sm font-medium">
              {getMotivationalMessage()}
            </p>
            
            {!isComplete && (
              <p className="text-xs text-muted-foreground mt-1">
                {remaining} more to reach your daily goal
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
