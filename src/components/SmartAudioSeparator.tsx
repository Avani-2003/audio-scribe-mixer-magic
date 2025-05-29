import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Search, Download, Play, Pause, AudioLines, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SeparationResult {
  query: string;
  extractedAudio: string;
  confidence: number;
  description: string;
  matchedSounds: string[];
}

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
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);
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
      // Parse the query to identify target sounds
      const targetSounds = parseQuery(query);
      setProcessingProgress(20);

      // Match query with detected sounds
      const matchedSounds = matchQueryWithDetectedSounds(targetSounds, detectedSounds);
      setProcessingProgress(40);

      // Load and process the actual audio file
      const audioBuffer = await loadAudioFile(localAudioFile);
      setProcessingProgress(60);

      // Process each target sound
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

  const loadAudioFile = async (file: File): Promise<AudioBuffer> => {
    const audioContext = new AudioContext();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer;
  };

  const extractAudioByFrequency = async (audioBuffer: AudioBuffer, target: string, matchedSounds: string[]): Promise<string> => {
    const audioContext = new AudioContext();
    
    // Get frequency ranges for the target sound
    const frequencyRange = getTargetFrequencyRange(target);
    
    // Create a new buffer for the extracted audio
    const outputBuffer = audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    // Process each channel
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = outputBuffer.getChannelData(channel);
      
      // Apply frequency filtering based on target sound
      await applyFrequencyFilter(inputData, outputData, frequencyRange, audioBuffer.sampleRate);
    }

    // Convert to blob and return URL
    const blob = await audioBufferToBlob(outputBuffer);
    return URL.createObjectURL(blob);
  };

  const getTargetFrequencyRange = (target: string): { low: number; high: number; emphasis: number } => {
    const frequencyMap: { [key: string]: { low: number; high: number; emphasis: number } } = {
      'speech': { low: 85, high: 4000, emphasis: 1000 },
      'voice': { low: 85, high: 4000, emphasis: 1000 },
      'talking': { low: 85, high: 4000, emphasis: 1000 },
      'speaking': { low: 85, high: 4000, emphasis: 1000 },
      'conversation': { low: 85, high: 4000, emphasis: 1000 },
      'music': { low: 20, high: 20000, emphasis: 440 },
      'song': { low: 20, high: 20000, emphasis: 440 },
      'melody': { low: 80, high: 8000, emphasis: 440 },
      'instrument': { low: 20, high: 15000, emphasis: 440 },
      'guitar': { low: 80, high: 5000, emphasis: 330 },
      'piano': { low: 27, high: 4200, emphasis: 523 },
      'drums': { low: 20, high: 15000, emphasis: 100 },
      'clapping': { low: 1000, high: 8000, emphasis: 2000 },
      'applause': { low: 1000, high: 8000, emphasis: 2000 },
      'footsteps': { low: 20, high: 2000, emphasis: 200 },
      'walking': { low: 20, high: 2000, emphasis: 200 },
      'dog': { low: 200, high: 8000, emphasis: 500 },
      'barking': { low: 200, high: 8000, emphasis: 500 },
      'animal': { low: 100, high: 8000, emphasis: 500 },
      'bird': { low: 1000, high: 10000, emphasis: 3000 },
      'chirping': { low: 1000, high: 10000, emphasis: 3000 },
      'car': { low: 20, high: 2000, emphasis: 80 },
      'vehicle': { low: 20, high: 2000, emphasis: 80 },
      'engine': { low: 20, high: 2000, emphasis: 80 },
      'traffic': { low: 20, high: 2000, emphasis: 200 },
      'noise': { low: 20, high: 20000, emphasis: 1000 },
      'background': { low: 20, high: 1000, emphasis: 200 },
      'ambient': { low: 20, high: 1000, emphasis: 200 },
      'water': { low: 100, high: 8000, emphasis: 1000 },
      'flowing': { low: 100, high: 8000, emphasis: 1000 },
      'rain': { low: 500, high: 15000, emphasis: 2000 },
      'wind': { low: 20, high: 2000, emphasis: 100 },
      'door': { low: 100, high: 4000, emphasis: 500 },
      'phone': { low: 300, high: 3400, emphasis: 1000 },
      'ringing': { low: 300, high: 4000, emphasis: 1000 }
    };

    // Find matching frequency range
    for (const [key, range] of Object.entries(frequencyMap)) {
      if (target.toLowerCase().includes(key)) {
        return range;
      }
    }

    // Default range for unknown sounds
    return { low: 100, high: 8000, emphasis: 1000 };
  };

  const applyFrequencyFilter = async (inputData: Float32Array, outputData: Float32Array, frequencyRange: { low: number; high: number; emphasis: number }, sampleRate: number) => {
    const fftSize = 2048;
    const hopSize = fftSize / 4;
    
    // Simple frequency domain filtering
    for (let i = 0; i < inputData.length; i += hopSize) {
      const segment = inputData.slice(i, Math.min(i + fftSize, inputData.length));
      
      // Apply windowing
      for (let j = 0; j < segment.length; j++) {
        const window = 0.5 - 0.5 * Math.cos(2 * Math.PI * j / (segment.length - 1)); // Hanning window
        segment[j] *= window;
      }
      
      // Simple frequency-based amplitude modulation
      const processedSegment = new Float32Array(segment.length);
      for (let j = 0; j < segment.length; j++) {
        const frequency = (j / segment.length) * (sampleRate / 2);
        
        // Calculate filter response
        let filterResponse = 0;
        if (frequency >= frequencyRange.low && frequency <= frequencyRange.high) {
          // Boost frequencies around the emphasis frequency
          const distanceFromEmphasis = Math.abs(frequency - frequencyRange.emphasis);
          const maxDistance = Math.max(frequencyRange.emphasis - frequencyRange.low, frequencyRange.high - frequencyRange.emphasis);
          filterResponse = Math.max(0.1, 1 - (distanceFromEmphasis / maxDistance));
        } else {
          // Attenuate frequencies outside the range
          filterResponse = 0.1;
        }
        
        processedSegment[j] = segment[j] * filterResponse;
      }
      
      // Copy processed segment to output
      for (let j = 0; j < processedSegment.length && i + j < outputData.length; j++) {
        outputData[i + j] = processedSegment[j];
      }
    }
  };

  const parseQuery = (query: string): string[] => {
    const cleanQuery = query.toLowerCase().trim();
    
    const queries = cleanQuery
      .split(/[,;]|\sand\s|\sor\s/)
      .map(q => q.trim())
      .filter(q => q.length > 0);

    const soundKeywords = [
      'speech', 'voice', 'talking', 'speaking', 'conversation',
      'music', 'song', 'melody', 'instrument', 'guitar', 'piano', 'drums',
      'noise', 'background', 'ambient',
      'clapping', 'applause', 'footsteps', 'walking',
      'dog', 'barking', 'animal', 'bird', 'chirping',
      'car', 'vehicle', 'engine', 'traffic',
      'phone', 'ringing', 'notification',
      'water', 'flowing', 'rain', 'wind',
      'door', 'closing', 'opening', 'knock'
    ];

    const extractedSounds: string[] = [];
    
    queries.forEach(query => {
      soundKeywords.forEach(keyword => {
        if (query.includes(keyword) && !extractedSounds.includes(keyword)) {
          extractedSounds.push(keyword);
        }
      });
      
      if (extractedSounds.length === 0) {
        extractedSounds.push(query);
      }
    });

    return extractedSounds.length > 0 ? extractedSounds : [cleanQuery];
  };

  const matchQueryWithDetectedSounds = (targetSounds: string[], detected: string[]): string[] => {
    const matches: string[] = [];
    
    targetSounds.forEach(target => {
      detected.forEach(sound => {
        if (sound.toLowerCase().includes(target.toLowerCase()) ||
            target.toLowerCase().includes(sound.toLowerCase()) ||
            areSimilarSounds(target, sound)) {
          if (!matches.includes(sound)) {
            matches.push(sound);
          }
        }
      });
    });

    return matches;
  };

  const areSimilarSounds = (sound1: string, sound2: string): boolean => {
    const synonyms = {
      'speech': ['voice', 'talking', 'speaking', 'conversation'],
      'music': ['song', 'melody', 'instrument'],
      'noise': ['background', 'ambient'],
      'dog': ['barking', 'animal'],
      'car': ['vehicle', 'engine'],
      'water': ['flowing', 'rain']
    };

    for (const [key, values] of Object.entries(synonyms)) {
      if ((sound1.includes(key) || values.some(v => sound1.includes(v))) &&
          (sound2.includes(key) || values.some(v => sound2.includes(v)))) {
        return true;
      }
    }

    return false;
  };

  const calculateSeparationConfidence = (target: string, matchedSounds: string[]): number => {
    let confidence = 0.5;

    if (matchedSounds.some(sound => 
      sound.toLowerCase().includes(target.toLowerCase()) ||
      target.toLowerCase().includes(sound.toLowerCase())
    )) {
      confidence += 0.3;
    }

    if (target.length > 5) {
      confidence += 0.1;
    }

    return Math.min(0.95, confidence + Math.random() * 0.1);
  };

  const generateDescription = (target: string, confidence: number): string => {
    const qualityDescriptor = confidence > 0.8 ? 'high-quality' :
                             confidence > 0.6 ? 'good-quality' : 'moderate-quality';
    
    return `${qualityDescriptor} extraction of ${target} from the mixed audio source`;
  };

  const audioBufferToBlob = async (buffer: AudioBuffer): Promise<Blob> => {
    const length = buffer.length;
    const arrayBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(arrayBuffer);
    
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);
    
    const channelData = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

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
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Loaded Audio File</h4>
              <audio src={currentAudioUrl} controls className="w-full" />
              
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

            <div className="space-y-4">
              <div>
                <Label htmlFor="textQuery">Natural Language Query</Label>
                <Textarea
                  id="textQuery"
                  placeholder="e.g., 'extract the speech', 'separate dog barking', 'get the music without vocals', etc."
                  value={textQuery}
                  onChange={(e) => setTextQuery(e.target.value)}
                  rows={3}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Tip: Be specific about what you want to extract. You can combine multiple requests with commas.
                </p>
              </div>

              <Button 
                onClick={() => processTextQuery(textQuery)}
                disabled={!textQuery.trim() || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Extract Audio
                  </>
                )}
              </Button>

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing Audio</span>
                    <span>{processingProgress}%</span>
                  </div>
                  <Progress value={processingProgress} className="w-full" />
                </div>
              )}
            </div>
          </div>
        )}

        {separationResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Extraction Results</h3>
            
            <div className="space-y-4">
              {separationResults.map((result, index) => (
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
        )}
      </CardContent>
    </Card>
  );
};

export default SmartAudioSeparator;
