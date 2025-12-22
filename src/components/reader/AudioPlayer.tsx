import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AudioPlayerProps {
  audioUrl: string;
  onClose: () => void;
}

const speedOptions = [
  { value: '0.5', label: '0.5x' },
  { value: '0.75', label: '0.75x' },
  { value: '1', label: '1x' },
  { value: '1.25', label: '1.25x' },
  { value: '1.5', label: '1.5x' },
  { value: '2', label: '2x' },
];

export default function AudioPlayer({ audioUrl, onClose }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState('1');

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    audio.addEventListener('error', () => {
      console.error('Audio playback error');
    });

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [audioUrl]);

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleSeek = useCallback((value: number[]) => {
    if (!audioRef.current) return;
    const newTime = value[0];
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, []);

  const handleSpeedChange = useCallback((value: string) => {
    if (!audioRef.current) return;
    setSpeed(value);
    audioRef.current.playbackRate = parseFloat(value);
  }, []);

  const formatTime = (time: number): string => {
    if (!isFinite(time) || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-50 shadow-lg">
      <div className="container mx-auto max-w-3xl">
        <div className="flex items-center gap-4">
          {/* Play/Pause Button */}
          <Button
            variant="default"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={togglePlayPause}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </Button>

          {/* Time Display */}
          <span className="text-sm text-muted-foreground w-12 shrink-0">
            {formatTime(currentTime)}
          </span>

          {/* Progress Bar */}
          <div className="flex-1 relative">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="cursor-pointer"
            />
          </div>

          {/* Duration */}
          <span className="text-sm text-muted-foreground w-12 shrink-0">
            {formatTime(duration)}
          </span>

          {/* Speed Control */}
          <Select value={speed} onValueChange={handleSpeedChange}>
            <SelectTrigger className="w-20 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {speedOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.pause();
              }
              onClose();
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
