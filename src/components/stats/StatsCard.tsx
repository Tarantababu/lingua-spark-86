import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedCounter } from './AnimatedCounter';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  iconColor?: string;
  label: string;
  value: number;
  suffix?: string;
  subValue?: string;
  className?: string;
  delay?: number;
}

export function StatsCard({ 
  icon: Icon,
  iconColor = "text-primary",
  label, 
  value, 
  suffix,
  subValue,
  className,
  delay = 0
}: StatsCardProps) {
  return (
    <Card 
      className={cn(
        "animate-slide-up opacity-0",
        className
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-1">
            <AnimatedCounter 
              value={value} 
              className="text-2xl font-bold text-foreground"
              duration={1200}
            />
            {suffix && (
              <span className="text-sm text-muted-foreground">{suffix}</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{label}</p>
          {subValue && (
            <p className="text-xs text-muted-foreground/70 mt-0.5">{subValue}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
