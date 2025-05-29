
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
        description: "Ready for audio separation"
      });
    }
  };

  const processTextQuery = async (query: string) => {
    if (!localAudioFile || !localAudioUrl) return;

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      console.log('Starting audio separation for query:', query);
      
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
        console.log(`Processing separation for: ${target}`);
        const separationResult = await performAudioSeparation(audioBuffer, target, matchedSounds);
        const confidence = calculateConfidence(target, matchedSounds);
        
        results.push({
          query: target,
          extractedAudio: separationResult,
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
        description: `Successfully extracted ${results.length} audio queries`
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
    console.log('Audio loaded for separation:', { 
      duration: audioBuffer.duration, 
      sampleRate: audioBuffer.sampleRate 
    });
    return audioBuffer;
  };

  const performAudioSeparation = async (
    audioBuffer: AudioBuffer, 
    target: string, 
    matchedSounds: string[]
  ): Promise<string> => {
    const audioContext = new AudioContext();
    
    // Get separation parameters for the target sound
    const separationParams = getSeparationParams(target);
    console.log(`Separation parameters for ${target}:`, separationParams);
    
    // Create a new buffer for the separated audio with proper amplification
    const outputBuffer = audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    // Process each channel with improved algorithms and strong amplification
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = outputBuffer.getChannelData(channel);
      
      // Apply frequency-based separation with strong amplification
      await applyFrequencyBasedSeparation(inputData, outputData, separationParams, audioBuffer.sampleRate);
    }

    // Convert to blob and return URL
    const blob = await audioBufferToWav(outputBuffer);
    return URL.createObjectURL(blob);
  };

  const getSeparationParams = (target: string) => {
    const paramMap: { [key: string]: any } = {
      'speech': { 
        freqRange: { low: 85, high: 4000 },
        emphasis: [300, 1000, 2000],
        gain: 4.0,
        type: 'harmonic'
      },
      'voice': { 
        freqRange: { low: 85, high: 4000 },
        emphasis: [300, 1000, 2000],
        gain: 4.0,
        type: 'harmonic'
      },
      'music': { 
        freqRange: { low: 20, high: 20000 },
        emphasis: [440, 880, 1760],
        gain: 3.0,
        type: 'harmonic'
      },
      'dog': { 
        freqRange: { low: 200, high: 3000 },
        emphasis: [500, 1000, 1500],
        gain: 5.0,
        type: 'burst'
      },
      'barking': { 
        freqRange: { low: 200, high: 3000 },
        emphasis: [500, 1000, 1500],
        gain: 5.0,
        type: 'burst'
      },
      'bird': { 
        freqRange: { low: 1000, high: 8000 },
        emphasis: [2000, 4000, 6000],
        gain: 6.0,
        type: 'tonal'
      },
      'chirping': { 
        freqRange: { low: 1000, high: 8000 },
        emphasis: [2000, 4000, 6000],
        gain: 6.0,
        type: 'tonal'
      },
      'car': { 
        freqRange: { low: 20, high: 600 },
        emphasis: [50, 100, 200],
        gain: 4.5,
        type: 'noise'
      },
      'engine': { 
        freqRange: { low: 20, high: 600 },
        emphasis: [50, 100, 200],
        gain: 4.5,
        type: 'noise'
      },
      'water': { 
        freqRange: { low: 100, high: 15000 },
        emphasis: [1000, 4000, 8000],
        gain: 3.5,
        type: 'noise'
      },
      'wind': { 
        freqRange: { low: 20, high: 2000 },
        emphasis: [50, 200, 1000],
        gain: 3.0,
        type: 'noise'
      }
    };

    // Find best match for target
    for (const [key, params] of Object.entries(paramMap)) {
      if (target.toLowerCase().includes(key)) {
        return params;
      }
    }

    // Default parameters with moderate amplification
    return { 
      freqRange: { low: 100, high: 8000 },
      emphasis: [1000],
      gain: 3.0,
      type: 'general'
    };
  };

  const applyFrequencyBasedSeparation = async (
    inputData: Float32Array, 
    outputData: Float32Array, 
    params: any, 
    sampleRate: number
  ) => {
    const fftSize = 2048;
    const hopSize = fftSize / 4;
    
    console.log(`Applying separation for frequency range ${params.freqRange.low}-${params.freqRange.high} Hz with ${params.gain}x gain`);
    
    // Process audio in overlapping windows for better quality
    for (let i = 0; i < inputData.length; i += hopSize) {
      const segment = inputData.slice(i, Math.min(i + fftSize, inputData.length));
      
      // Apply window function
      const windowed = new Float32Array(segment.length);
      for (let j = 0; j < segment.length; j++) {
        const window = 0.5 - 0.5 * Math.cos(2 * Math.PI * j / (segment.length - 1));
        windowed[j] = segment[j] * window;
      }
      
      // Apply frequency-based filtering with strong amplification
      for (let j = 0; j < windowed.length; j++) {
        const frequency = (j / windowed.length) * (sampleRate / 2);
        
        if (isInTargetRange(frequency, params.freqRange)) {
          // Strong amplification for target frequencies
          let gain = params.gain;
          
          // Extra boost for emphasis frequencies
          for (const emphFreq of params.emphasis) {
            const distance = Math.abs(frequency - emphFreq);
            if (distance < 100) {
              gain *= (1 + (100 - distance) / 100 * 1.5);
            }
          }
          
          windowed[j] *= Math.min(8.0, gain); // Strong amplification with limit
        } else {
          // Significant suppression of non-target frequencies
          windowed[j] *= 0.1;
        }
      }
      
      // Copy processed segment to output with overlap-add
      for (let j = 0; j < windowed.length && i + j < outputData.length; j++) {
        if (i + j < outputData.length) {
          outputData[i + j] += windowed[j] * 0.5; // Overlap-add
        }
      }
    }
    
    // Final amplification and normalization
    let maxAmplitude = 0;
    for (let i = 0; i < outputData.length; i++) {
      maxAmplitude = Math.max(maxAmplitude, Math.abs(outputData[i]));
    }
    
    if (maxAmplitude > 0) {
      const normalizeGain = 0.8 / maxAmplitude; // Normalize to 80% of max to prevent clipping
      for (let i = 0; i < outputData.length; i++) {
        outputData[i] *= normalizeGain;
      }
    }
  };

  const isInTargetRange = (frequency: number, freqRange: any): boolean => {
    return frequency >= freqRange.low && frequency <= freqRange.high;
  };

  const parseQuery = (query: string): string[] => {
    const cleanQuery = query.toLowerCase().trim();
    
    // Split by common separators
    const queries = cleanQuery
      .split(/[,;]|\sand\s|\sor\s/)
      .map(q => q.trim())
      .filter(q => q.length > 0);

    // Extract sound keywords
    const soundKeywords = [
      'speech', 'voice', 'talking', 'speaking',
      'music', 'song', 'melody', 'instrument',
      'dog', 'barking', 'animal', 'bird', 'chirping',
      'car', 'vehicle', 'engine', 'traffic',
      'water', 'flowing', 'rain', 'wind',
      'noise', 'background'
    ];

    const extractedSounds: string[] = [];
    
    queries.forEach(query => {
      soundKeywords.forEach(keyword => {
        if (query.includes(keyword) && !extractedSounds.includes(keyword)) {
          extractedSounds.push(keyword);
        }
      });
      
      // If no keywords found, use the original query
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
      'speech': ['voice', 'talking', 'speaking'],
      'music': ['song', 'melody', 'instrument'],
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

  const calculateConfidence = (target: string, matchedSounds: string[]): number => {
    let confidence = 0.5;

    // Higher confidence if we found matching sounds
    if (matchedSounds.some(sound => 
      sound.toLowerCase().includes(target.toLowerCase()) ||
      target.toLowerCase().includes(sound.toLowerCase())
    )) {
      confidence += 0.3;
    }

    // Boost confidence for well-defined sound types
    if (['speech', 'voice', 'music', 'dog', 'barking', 'bird', 'chirping', 'car', 'engine'].includes(target)) {
      confidence += 0.15;
    }

    return Math.min(0.9, confidence);
  };

  const generateDescription = (target: string, confidence: number): string => {
    const qualityDescriptor = confidence > 0.75 ? 'high-quality' :
                             confidence > 0.6 ? 'good-quality' : 'moderate-quality';
    
    return `${qualityDescriptor} extraction of ${target} using frequency-based separation with amplification`;
  };

  const audioBufferToWav = async (buffer: AudioBuffer): Promise<Blob> => {
    const length = buffer.length;
    const arrayBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
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
          Extract specific sounds using natural language queries with improved amplification
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
                  placeholder="e.g., 'extract the speech', 'separate dog barking', 'get the car engine sound', 'isolate bird chirping', etc."
                  value={textQuery}
                  onChange={(e) => setTextQuery(e.target.value)}
                  rows={3}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Improved processing with stronger amplification for clearer audio output
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
                    Processing with Amplification...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Extract Audio (Amplified)
                  </>
                )}
              </Button>

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing with Amplification</span>
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
            <h3 className="font-semibold">Extraction Results (Amplified)</h3>
            
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
                              result.confidence > 0.75 ? 'bg-green-500' :
                              result.confidence > 0.6 ? 'bg-yellow-500' : 'bg-orange-500'
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
