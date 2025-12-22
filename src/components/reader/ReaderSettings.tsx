import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { X } from 'lucide-react';

interface ReaderSettingsProps {
  fontSize: number;
  setFontSize: (size: number) => void;
  lineHeight: number;
  setLineHeight: (height: number) => void;
  onClose: () => void;
}

export default function ReaderSettings({
  fontSize,
  setFontSize,
  lineHeight,
  setLineHeight,
  onClose,
}: ReaderSettingsProps) {
  return (
    <Card className="mx-4 mt-2 animate-slide-up">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Reading Settings</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-muted-foreground">Font Size</span>
            <span className="text-sm font-medium">{fontSize}px</span>
          </div>
          <Slider
            value={[fontSize]}
            onValueChange={([value]) => setFontSize(value)}
            min={14}
            max={28}
            step={1}
          />
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-muted-foreground">Line Height</span>
            <span className="text-sm font-medium">{lineHeight.toFixed(1)}</span>
          </div>
          <Slider
            value={[lineHeight * 10]}
            onValueChange={([value]) => setLineHeight(value / 10)}
            min={12}
            max={25}
            step={1}
          />
        </div>
      </CardContent>
    </Card>
  );
}
