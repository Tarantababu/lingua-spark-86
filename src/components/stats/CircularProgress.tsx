import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface CircularProgressProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showValue?: boolean;
  label?: string;
}

export function CircularProgress({
  value,
  max,
  size = 120,
  strokeWidth = 12,
  className,
  showValue = true,
  label
}: CircularProgressProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min((animatedValue / max) * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;
  
  const isComplete = value >= max;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value);
    }, 100);
    return () => clearTimeout(timer);
  }, [value]);

  // Gradient colors based on progress
  const getGradientId = () => {
    if (percentage >= 100) return 'complete';
    if (percentage >= 66) return 'high';
    if (percentage >= 33) return 'medium';
    return 'low';
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="circular-progress"
      >
        <defs>
          <linearGradient id="progress-low" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--destructive))" />
            <stop offset="100%" stopColor="hsl(var(--warning))" />
          </linearGradient>
          <linearGradient id="progress-medium" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--warning))" />
            <stop offset="100%" stopColor="hsl(var(--info))" />
          </linearGradient>
          <linearGradient id="progress-high" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--info))" />
            <stop offset="100%" stopColor="hsl(var(--success))" />
          </linearGradient>
          <linearGradient id="progress-complete" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--success))" />
            <stop offset="100%" stopColor="hsl(142 76% 50%)" />
          </linearGradient>
        </defs>
        
        {/* Background track */}
        <circle
          className="circular-progress-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress bar */}
        <circle
          className="circular-progress-bar"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#progress-${getGradientId()})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showValue && (
          <>
            <span className={cn(
              "text-2xl font-bold transition-all",
              isComplete && "text-success"
            )}>
              {Math.round(percentage)}%
            </span>
            {label && (
              <span className="text-xs text-muted-foreground">{label}</span>
            )}
          </>
        )}
        {isComplete && (
          <span className="text-lg mt-1">🎉</span>
        )}
      </div>
    </div>
  );
}
