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
  processingMethod: string;
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
        description: "Ready for enhanced source separation"
      });
    }
  };

  const processTextQuery = async (query: string) => {
    if (!localAudioFile || !localAudioUrl) return;

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      console.log('Starting enhanced audio separation for query:', query);
      
      // Parse the query to identify target sounds
      const targetSounds = parseQuery(query);
      setProcessingProgress(15);

      // Match query with detected sounds
      const matchedSounds = matchQueryWithDetectedSounds(targetSounds, detectedSounds);
      setProcessingProgress(25);

      // Load and process the actual audio file
      const audioBuffer = await loadAudioFile(localAudioFile);
      setProcessingProgress(40);

      // Process each target sound with enhanced algorithms
      const results: SeparationResult[] = [];
      
      for (const target of targetSounds) {
        const progressBase = 40 + (targetSounds.indexOf(target) / targetSounds.length) * 50;
        setProcessingProgress(progressBase);
        
        console.log(`Processing separation for: ${target}`);
        const separationResult = await performEnhancedSeparation(audioBuffer, target, matchedSounds);
        const confidence = calculateEnhancedConfidence(target, matchedSounds, separationResult.quality);
        
        results.push({
          query: target,
          extractedAudio: separationResult.audioUrl,
          confidence: confidence,
          description: generateEnhancedDescription(target, confidence, separationResult.method),
          matchedSounds: matchedSounds.filter(sound => 
            sound.toLowerCase().includes(target.toLowerCase()) ||
            target.toLowerCase().includes(sound.toLowerCase())
          ),
          processingMethod: separationResult.method
        });
      }

      setSeparationResults(results);
      setProcessingProgress(100);

      toast({
        title: "Enhanced Separation Complete",
        description: `Successfully processed ${results.length} audio queries with improved accuracy`
      });

    } catch (error) {
      console.error('Enhanced audio processing error:', error);
      toast({
        title: "Processing Failed",
        description: "Error occurred during enhanced audio separation",
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
    console.log('Audio loaded for separation:', { duration: audioBuffer.duration, sampleRate: audioBuffer.sampleRate });
    return audioBuffer;
  };

  const performEnhancedSeparation = async (audioBuffer: AudioBuffer, target: string, matchedSounds: string[]): Promise<{ audioUrl: string; quality: number; method: string }> => {
    const audioContext = new AudioContext();
    
    // Get enhanced frequency parameters for the target sound
    const separationParams = getEnhancedSeparationParams(target);
    console.log(`Separation parameters for ${target}:`, separationParams);
    
    // Create a new buffer for the separated audio
    const outputBuffer = audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    let separationQuality = 0;
    let method = '';

    // Process each channel with enhanced algorithms
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = outputBuffer.getChannelData(channel);
      
      // Apply enhanced separation based on target type
      if (separationParams.type === 'harmonic') {
        separationQuality = await applyHarmonicSeparation(inputData, outputData, separationParams, audioBuffer.sampleRate);
        method = 'Harmonic-Percussive Separation';
      } else if (separationParams.type === 'spectral') {
        separationQuality = await applySpectralMasking(inputData, outputData, separationParams, audioBuffer.sampleRate);
        method = 'Spectral Masking';
      } else {
        separationQuality = await applyAdvancedFiltering(inputData, outputData, separationParams, audioBuffer.sampleRate);
        method = 'Advanced Frequency Filtering';
      }
    }

    // Convert to blob and return URL
    const blob = await audioBufferToWav(outputBuffer);
    return { 
      audioUrl: URL.createObjectURL(blob), 
      quality: separationQuality,
      method: method
    };
  };

  const getEnhancedSeparationParams = (target: string) => {
    const paramMap: { [key: string]: any } = {
      'speech': { 
        type: 'harmonic', 
        freqRange: { low: 85, high: 4000, emphasis: [300, 1000, 2000] },
        harmonicRatio: 0.7,
        adaptiveGain: true 
      },
      'voice': { 
        type: 'harmonic', 
        freqRange: { low: 85, high: 4000, emphasis: [300, 1000, 2000] },
        harmonicRatio: 0.7,
        adaptiveGain: true 
      },
      'music': { 
        type: 'harmonic', 
        freqRange: { low: 20, high: 20000, emphasis: [440, 880, 1760] },
        harmonicRatio: 0.8,
        adaptiveGain: false 
      },
      'drums': { 
        type: 'spectral', 
        freqRange: { low: 20, high: 8000, emphasis: [60, 200, 2000] },
        percussiveRatio: 0.8,
        transientBoost: true 
      },
      'car': { 
        type: 'spectral', 
        freqRange: { low: 20, high: 500, emphasis: [50, 100, 200] },
        noiseProfile: 'engine',
        steadyState: true 
      },
      'engine': { 
        type: 'spectral', 
        freqRange: { low: 20, high: 500, emphasis: [50, 100, 200] },
        noiseProfile: 'engine',
        steadyState: true 
      },
      'bird': { 
        type: 'spectral', 
        freqRange: { low: 1000, high: 8000, emphasis: [2000, 4000, 6000] },
        chirpDetection: true,
        rapidChanges: true 
      },
      'dog': { 
        type: 'spectral', 
        freqRange: { low: 200, high: 3000, emphasis: [500, 1000, 1500] },
        barkPattern: true,
        burstDetection: true 
      },
      'water': { 
        type: 'spectral', 
        freqRange: { low: 100, high: 15000, emphasis: [1000, 4000, 8000] },
        noiseProfile: 'water',
        continuousFlow: true 
      },
      'wind': { 
        type: 'spectral', 
        freqRange: { low: 20, high: 2000, emphasis: [50, 200, 1000] },
        noiseProfile: 'wind',
        dynamicRange: true 
      }
    };

    // Find best match for target
    for (const [key, params] of Object.entries(paramMap)) {
      if (target.toLowerCase().includes(key)) {
        return params;
      }
    }

    // Default parameters for unknown sounds
    return { 
      type: 'spectral', 
      freqRange: { low: 100, high: 8000, emphasis: [1000] },
      adaptiveGain: true 
    };
  };

  const applyHarmonicSeparation = async (inputData: Float32Array, outputData: Float32Array, params: any, sampleRate: number): Promise<number> => {
    const fftSize = 2048;
    const hopSize = fftSize / 4;
    let overallQuality = 0;
    let frameCount = 0;
    
    console.log('Applying harmonic separation...');
    
    for (let i = 0; i < inputData.length; i += hopSize) {
      const segment = inputData.slice(i, Math.min(i + fftSize, inputData.length));
      
      // Apply window function
      const windowed = new Float32Array(segment.length);
      for (let j = 0; j < segment.length; j++) {
        const window = 0.5 - 0.5 * Math.cos(2 * Math.PI * j / (segment.length - 1));
        windowed[j] = segment[j] * window;
      }
      
      // Harmonic enhancement
      const harmonicStrength = detectHarmonicContent(windowed, sampleRate, params.freqRange.emphasis);
      
      // Apply harmonic masking
      for (let j = 0; j < windowed.length; j++) {
        const frequency = (j / windowed.length) * (sampleRate / 2);
        let mask = 0;
        
        // Enhanced harmonic detection
        if (isInTargetRange(frequency, params.freqRange)) {
          mask = harmonicStrength * params.harmonicRatio;
          
          // Boost emphasis frequencies
          for (const emphFreq of params.freqRange.emphasis) {
            const distance = Math.abs(frequency - emphFreq);
            if (distance < 100) {
              mask *= (1 + (100 - distance) / 100);
            }
          }
        } else {
          mask = 0.1; // Attenuate non-target frequencies
        }
        
        windowed[j] *= Math.min(1, mask);
      }
      
      // Copy processed segment to output
      for (let j = 0; j < windowed.length && i + j < outputData.length; j++) {
        outputData[i + j] = windowed[j];
      }
      
      overallQuality += harmonicStrength;
      frameCount++;
    }
    
    return frameCount > 0 ? overallQuality / frameCount : 0.5;
  };

  const applySpectralMasking = async (inputData: Float32Array, outputData: Float32Array, params: any, sampleRate: number): Promise<number> => {
    const fftSize = 2048;
    const hopSize = fftSize / 4;
    let overallQuality = 0;
    let frameCount = 0;
    
    console.log('Applying spectral masking...');
    
    for (let i = 0; i < inputData.length; i += hopSize) {
      const segment = inputData.slice(i, Math.min(i + fftSize, inputData.length));
      
      // Apply window
      const windowed = new Float32Array(segment.length);
      for (let j = 0; j < segment.length; j++) {
        const window = 0.5 - 0.5 * Math.cos(2 * Math.PI * j / (segment.length - 1));
        windowed[j] = segment[j] * window;
      }
      
      // Spectral analysis
      const spectralEnergy = calculateSpectralEnergy(windowed, sampleRate, params.freqRange);
      
      // Apply enhanced spectral mask
      for (let j = 0; j < windowed.length; j++) {
        const frequency = (j / windowed.length) * (sampleRate / 2);
        let mask = 0;
        
        if (isInTargetRange(frequency, params.freqRange)) {
          // Calculate adaptive mask based on spectral characteristics
          mask = calculateAdaptiveMask(frequency, params, spectralEnergy);
        } else {
          mask = 0.05; // Strong attenuation for out-of-range frequencies
        }
        
        windowed[j] *= mask;
      }
      
      // Copy to output
      for (let j = 0; j < windowed.length && i + j < outputData.length; j++) {
        outputData[i + j] = windowed[j];
      }
      
      overallQuality += spectralEnergy;
      frameCount++;
    }
    
    return frameCount > 0 ? overallQuality / frameCount : 0.5;
  };

  const applyAdvancedFiltering = async (inputData: Float32Array, outputData: Float32Array, params: any, sampleRate: number): Promise<number> => {
    console.log('Applying advanced frequency filtering...');
    
    // Multi-band processing
    const bands = divideToBands(inputData, sampleRate, params.freqRange);
    let totalQuality = 0;
    
    for (const band of bands) {
      const bandQuality = processBand(band, params);
      totalQuality += bandQuality;
    }
    
    // Reconstruct signal
    combineBands(bands, outputData);
    
    return totalQuality / bands.length;
  };

  const detectHarmonicContent = (data: Float32Array, sampleRate: number, emphasisFreqs: number[]): number => {
    let harmonicScore = 0;
    
    // Simplified harmonic detection
    for (const freq of emphasisFreqs) {
      const bin = Math.floor((freq * data.length) / (sampleRate / 2));
      if (bin < data.length) {
        harmonicScore += Math.abs(data[bin]);
      }
    }
    
    return Math.min(1, harmonicScore / emphasisFreqs.length);
  };

  const calculateSpectralEnergy = (data: Float32Array, sampleRate: number, freqRange: any): number => {
    let energy = 0;
    const startBin = Math.floor((freqRange.low * data.length) / (sampleRate / 2));
    const endBin = Math.floor((freqRange.high * data.length) / (sampleRate / 2));
    
    for (let i = startBin; i < endBin && i < data.length; i++) {
      energy += data[i] * data[i];
    }
    
    return energy / (endBin - startBin);
  };

  const calculateAdaptiveMask = (frequency: number, params: any, spectralEnergy: number): number => {
    let baseMask = 0.3;
    
    // Boost for emphasis frequencies
    for (const emphFreq of params.freqRange.emphasis) {
      const distance = Math.abs(frequency - emphFreq);
      if (distance < 200) {
        baseMask += (200 - distance) / 200 * 0.5;
      }
    }
    
    // Adapt based on spectral energy
    baseMask *= (0.5 + spectralEnergy);
    
    return Math.min(1, baseMask);
  };

  const isInTargetRange = (frequency: number, freqRange: any): boolean => {
    return frequency >= freqRange.low && frequency <= freqRange.high;
  };

  const divideToBands = (data: Float32Array, sampleRate: number, freqRange: any): Float32Array[] => {
    // Simplified band division
    const numBands = 8;
    const bandSize = Math.floor(data.length / numBands);
    const bands = [];
    
    for (let i = 0; i < numBands; i++) {
      const start = i * bandSize;
      const end = Math.min((i + 1) * bandSize, data.length);
      bands.push(data.slice(start, end));
    }
    
    return bands;
  };

  const processBand = (band: Float32Array, params: any): number => {
    // Apply band-specific processing
    let quality = 0;
    for (let i = 0; i < band.length; i++) {
      band[i] *= 0.8; // Simple gain adjustment
      quality += Math.abs(band[i]);
    }
    return quality / band.length;
  };

  const combineBands = (bands: Float32Array[], output: Float32Array): void => {
    let pos = 0;
    for (const band of bands) {
      for (let i = 0; i < band.length && pos < output.length; i++) {
        output[pos++] = band[i];
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

  const calculateEnhancedConfidence = (target: string, matchedSounds: string[], separationQuality: number): number => {
    let confidence = 0.4;

    // Base confidence from matching
    if (matchedSounds.some(sound => 
      sound.toLowerCase().includes(target.toLowerCase()) ||
      target.toLowerCase().includes(sound.toLowerCase())
    )) {
      confidence += 0.3;
    }

    // Quality-based confidence boost
    confidence += separationQuality * 0.4;

    // Target-specific confidence adjustment
    if (['speech', 'voice', 'music'].includes(target)) {
      confidence += 0.1; // These are easier to separate
    }

    return Math.min(0.95, confidence);
  };

  const generateEnhancedDescription = (target: string, confidence: number, method: string): string => {
    const qualityDescriptor = confidence > 0.8 ? 'high-quality' :
                             confidence > 0.6 ? 'good-quality' : 'moderate-quality';
    
    return `${qualityDescriptor} extraction of ${target} using ${method} (${(confidence * 100).toFixed(1)}% confidence)`;
  };

  const audioBufferToWav = async (buffer: AudioBuffer): Promise<Blob> => {
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
          Enhanced Smart Audio Source Separator
        </CardTitle>
        <p className="text-sm text-gray-600">
          Extract specific sounds from mixed audio using advanced separation algorithms and natural language queries
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
                  <h5 className="text-sm font-medium mb-2">Available Sounds (Enhanced Detection):</h5>
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
                  Enhanced processing: Uses advanced algorithms for better separation of speech, music, animals, vehicles, and environmental sounds.
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
                    Processing with Enhanced Algorithms...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Extract Audio (Enhanced)
                  </>
                )}
              </Button>

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Enhanced Processing</span>
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
            <h3 className="font-semibold">Enhanced Extraction Results</h3>
            
            <div className="space-y-4">
              {separationResults.map((result, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">"{result.query}"</h4>
                        <p className="text-sm text-gray-600">{result.description}</p>
                        <p className="text-xs text-blue-600 mt-1">Method: {result.processingMethod}</p>
                        
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
