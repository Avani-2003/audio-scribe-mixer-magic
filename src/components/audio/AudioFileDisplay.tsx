
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface AudioFileDisplayProps {
  audioUrl: string;
  detectedSounds: string[];
}

const AudioFileDisplay = ({ audioUrl, detectedSounds }: AudioFileDisplayProps) => {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h4 className="font-medium mb-2">Loaded Audio File</h4>
      <audio src={audioUrl} controls className="w-full" />
      
      {detectedSounds.length > 0 && (
        <div className="mt-3">
          <h5 className="text-sm font-medium mb-2">Available Sounds:</h5>
          <div className="flex flex-wrap gap-1">
            {detectedSounds.map((sound, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {sound}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioFileDisplay;
