import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Flame } from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';
import { cn } from '@/lib/utils';

interface StreakCardProps {
  streak: number;
  className?: string;
}

const MILESTONES = [7, 30, 100, 365];

export function StreakCard({ streak, className }: StreakCardProps) {
  const isActive = streak > 0;
  const nextMilestone = MILESTONES.find(m => m > streak) || MILESTONES[MILESTONES.length - 1];
  const reachedMilestones = MILESTONES.filter(m => streak >= m);
  
  const getMessage = () => {
    if (streak === 0) return "Start learning to build your streak!";
    if (streak >= 365) return "🏆 Legendary! One year streak!";
    if (streak >= 100) return "🌟 Incredible dedication!";
    if (streak >= 30) return "🔥 One month strong!";
    if (streak >= 7) return "⚡ One week streak!";
    return `${nextMilestone - streak} days to next milestone`;
  };

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300",
      isActive && "streak-card-active animate-glow-pulse",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "relative p-3 rounded-full",
              isActive 
                ? "bg-streak/20" 
                : "bg-muted"
            )}>
              <Flame 
                className={cn(
                  "w-8 h-8 transition-all",
                  isActive 
                    ? "text-streak animate-flame-flicker" 
                    : "text-muted-foreground"
                )} 
              />
              {isActive && (
                <div className="absolute inset-0 bg-streak/20 rounded-full animate-pulse-soft" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Day Streak</p>
              <div className="flex items-baseline gap-1">
                <AnimatedCounter 
                  value={streak} 
                  className="text-4xl font-bold text-foreground"
                  duration={1500}
                />
                <span className="text-lg text-muted-foreground">days</span>
              </div>
            </div>
          </div>
          
          {/* Milestone badges */}
          <div className="flex gap-1">
            {reachedMilestones.map(milestone => (
              <div 
                key={milestone}
                className="w-8 h-8 rounded-full bg-streak/20 flex items-center justify-center animate-bounce-in"
                title={`${milestone} day milestone reached!`}
              >
                <span className="text-xs font-bold text-streak">{milestone}</span>
              </div>
            ))}
          </div>
        </div>
        
        <p className="mt-3 text-sm text-muted-foreground">
          {getMessage()}
        </p>
        
        {/* Progress to next milestone */}
        {isActive && streak < 365 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{streak} days</span>
              <span>{nextMilestone} days</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-streak to-warning rounded-full transition-all duration-500"
                style={{ width: `${(streak / nextMilestone) * 100}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
