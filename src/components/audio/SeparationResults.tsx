
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Download } from 'lucide-react';

export interface SeparationResult {
  query: string;
  extractedAudio: string;
  confidence: number;
  description: string;
  matchedSounds: string[];
}

interface SeparationResultsProps {
  results: SeparationResult[];
}

const SeparationResults = ({ results }: SeparationResultsProps) => {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);

  const togglePlayback = (index: number) => {
    const audio = audioRefs.current[index];
    if (audio) {
      if (playingIndex === index) {
        audio.pause();
        setPlayingIndex(null);
      } else {
        audioRefs.current.forEach(a => a?.pause());
        audio.play();
        setPlayingIndex(index);
      }
    }
  };

  const downloadExtracted = (audioUrl: string, query: string) => {
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `extracted_${query.replace(/\s+/g, '_')}.wav`;
    a.click();
  };

  if (results.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Extraction Results</h3>
      
      <div className="space-y-4">
        {results.map((result, index) => (
          <Card key={index} className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium">"{result.query}"</h4>
                  <p className="text-sm text-gray-600">{result.description}</p>
                  
                  {result.matchedSounds.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">Matched sounds: </span>
                      {result.matchedSounds.map((sound, i) => (
                        <Badge key={i} variant="secondary" className="text-xs mr-1">
                          {sound}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium">
                    Confidence: {(result.confidence * 100).toFixed(1)}%
                  </div>
                  <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        result.confidence > 0.8 ? 'bg-green-500' :
                        result.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${result.confidence * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <audio 
                ref={el => audioRefs.current[index] = el}
                src={result.extractedAudio}
                onEnded={() => setPlayingIndex(null)}
              />
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => togglePlayback(index)}
                  variant="outline"
                  size="sm"
                >
                  {playingIndex === index ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {playingIndex === index ? 'Pause' : 'Play'}
                </Button>
                <Button 
                  onClick={() => downloadExtracted(result.extractedAudio, result.query)}
                  variant="outline"
                  size="sm"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SeparationResults;
