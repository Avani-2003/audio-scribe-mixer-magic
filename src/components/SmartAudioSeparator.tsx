
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AudioLines } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QueryInput from './audio/QueryInput';
import SeparationResults, { SeparationResult } from './audio/SeparationResults';
import AudioFileDisplay from './audio/AudioFileDisplay';
import { loadAudioFile } from '../utils/audioProcessing';
import { extractAudioByFrequency } from '../utils/frequencyFiltering';
import { 
  parseQuery, 
  matchQueryWithDetectedSounds, 
  calculateSeparationConfidence, 
  generateDescription 
} from '../utils/queryProcessing';

interface SmartAudioSeparatorProps {
  audioFile?: File | null;
  audioUrl?: string | null;
  detectedSounds?: string[];
}

const SmartAudioSeparator = ({ audioFile, audioUrl, detectedSounds = [] }: SmartAudioSeparatorProps) => {
  const [localAudioFile, setLocalAudioFile] = useState<File | null>(audioFile || null);
  const [localAudioUrl, setLocalAudioUrl] = useState<string | null>(audioUrl || null);
  const [textQuery, setTextQuery] = useState('');
  const [separationResults, setSeparationResults] = useState<SeparationResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setLocalAudioFile(file);
      const url = URL.createObjectURL(file);
      setLocalAudioUrl(url);
      setSeparationResults([]);
      toast({
        title: "Audio File Loaded",
        description: "Ready for source separation"
      });
    }
  };

  const processTextQuery = async (query: string) => {
    if (!localAudioFile || !localAudioUrl) return;

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      const targetSounds = parseQuery(query);
      setProcessingProgress(20);

      const matchedSounds = matchQueryWithDetectedSounds(targetSounds, detectedSounds);
      setProcessingProgress(40);

      const audioBuffer = await loadAudioFile(localAudioFile);
      setProcessingProgress(60);

      const results: SeparationResult[] = [];
      
      for (const target of targetSounds) {
        setProcessingProgress(60 + (targetSounds.indexOf(target) / targetSounds.length) * 30);
        
        const separatedAudio = await extractAudioByFrequency(audioBuffer, target, matchedSounds);
        const confidence = calculateSeparationConfidence(target, matchedSounds);
        
        results.push({
          query: target,
          extractedAudio: separatedAudio,
          confidence: confidence,
          description: generateDescription(target, confidence),
          matchedSounds: matchedSounds.filter(sound => 
            sound.toLowerCase().includes(target.toLowerCase()) ||
            target.toLowerCase().includes(sound.toLowerCase())
          )
        });
      }

      setSeparationResults(results);
      setProcessingProgress(100);

      toast({
        title: "Separation Complete",
        description: `Successfully processed ${results.length} audio queries`
      });

    } catch (error) {
      console.error('Audio processing error:', error);
      toast({
        title: "Processing Failed",
        description: "Error occurred during audio separation",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const currentAudioFile = localAudioFile || audioFile;
  const currentAudioUrl = localAudioUrl || audioUrl;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AudioLines className="w-5 h-5" />
          Smart Audio Source Separator
        </CardTitle>
        <p className="text-sm text-gray-600">
          Extract specific sounds from mixed audio using natural language queries
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {!currentAudioFile && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="audioFile">Upload Mixed Audio File</Label>
              <Input
                id="audioFile"
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
            </div>
          </div>
        )}

        {currentAudioUrl && (
          <div className="space-y-4">
            <AudioFileDisplay 
              audioUrl={currentAudioUrl} 
              detectedSounds={detectedSounds} 
            />

            <QueryInput
              textQuery={textQuery}
              onQueryChange={setTextQuery}
              onProcess={() => processTextQuery(textQuery)}
              isProcessing={isProcessing}
              processingProgress={processingProgress}
            />
          </div>
        )}

        <SeparationResults results={separationResults} />
      </CardContent>
    </Card>
  );
};

export default SmartAudioSeparator;
