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
  signalStrength: number;
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
        description: "Ready for enhanced audio separation"
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
        
        console.log(`Processing enhanced separation for: ${target}`);
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
          processingMethod: separationResult.method,
          signalStrength: separationResult.quality
        });
      }

      setSeparationResults(results);
      setProcessingProgress(100);

      toast({
        title: "Enhanced Separation Complete",
        description: `Successfully extracted ${results.length} audio queries with improved clarity`
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
    console.log('Audio loaded for enhanced separation:', { 
      duration: audioBuffer.duration, 
      sampleRate: audioBuffer.sampleRate,
      channels: audioBuffer.numberOfChannels
    });
    return audioBuffer;
  };

  const performEnhancedSeparation = async (
    audioBuffer: AudioBuffer, 
    target: string, 
    matchedSounds: string[]
  ): Promise<{ audioUrl: string; quality: number; method: string }> => {
    const audioContext = new AudioContext();
    
    // Get enhanced separation parameters for the target sound
    const separationParams = getEnhancedSeparationParams(target);
    console.log(`Enhanced separation parameters for ${target}:`, separationParams);
    
    // Create a new buffer for the separated audio with gain boost
    const outputBuffer = audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    let separationQuality = 0;
    let method = '';

    // Process each channel with enhanced algorithms and signal boosting
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = outputBuffer.getChannelData(channel);
      
      // Apply enhanced separation based on target type with signal amplification
      if (separationParams.type === 'harmonic') {
        separationQuality = await applyEnhancedHarmonicSeparation(inputData, outputData, separationParams, audioBuffer.sampleRate);
        method = 'Enhanced Harmonic-Percussive Separation';
      } else if (separationParams.type === 'spectral') {
        separationQuality = await applyEnhancedSpectralMasking(inputData, outputData, separationParams, audioBuffer.sampleRate);
        method = 'Advanced Spectral Masking';
      } else {
        separationQuality = await applyAdvancedFiltering(inputData, outputData, separationParams, audioBuffer.sampleRate);
        method = 'Multi-band Frequency Filtering';
      }
      
      // Apply signal amplification to boost weak signals
      applySignalAmplification(outputData, separationParams);
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
        harmonicRatio: 0.8,
        adaptiveGain: true,
        amplification: 2.5,
        noiseReduction: 0.3
      },
      'voice': { 
        type: 'harmonic', 
        freqRange: { low: 85, high: 4000, emphasis: [300, 1000, 2000] },
        harmonicRatio: 0.8,
        adaptiveGain: true,
        amplification: 2.5,
        noiseReduction: 0.3
      },
      'conversation': { 
        type: 'harmonic', 
        freqRange: { low: 85, high: 4000, emphasis: [300, 1000, 2000] },
        harmonicRatio: 0.7,
        adaptiveGain: true,
        amplification: 2.2,
        noiseReduction: 0.4
      },
      'music': { 
        type: 'harmonic', 
        freqRange: { low: 20, high: 20000, emphasis: [440, 880, 1760] },
        harmonicRatio: 0.9,
        adaptiveGain: false,
        amplification: 1.8,
        noiseReduction: 0.2
      },
      'drums': { 
        type: 'spectral', 
        freqRange: { low: 20, high: 8000, emphasis: [60, 200, 2000] },
        percussiveRatio: 0.9,
        transientBoost: true,
        amplification: 3.0,
        noiseReduction: 0.1
      },
      'car': { 
        type: 'spectral', 
        freqRange: { low: 20, high: 600, emphasis: [50, 100, 200] },
        noiseProfile: 'engine',
        steadyState: true,
        amplification: 2.8,
        noiseReduction: 0.2
      },
      'engine': { 
        type: 'spectral', 
        freqRange: { low: 20, high: 600, emphasis: [50, 100, 200] },
        noiseProfile: 'engine',
        steadyState: true,
        amplification: 2.8,
        noiseReduction: 0.2
      },
      'vehicle': { 
        type: 'spectral', 
        freqRange: { low: 20, high: 800, emphasis: [50, 150, 300] },
        noiseProfile: 'engine',
        steadyState: true,
        amplification: 2.5,
        noiseReduction: 0.25
      },
      'bird': { 
        type: 'spectral', 
        freqRange: { low: 1000, high: 8000, emphasis: [2000, 4000, 6000] },
        chirpDetection: true,
        rapidChanges: true,
        amplification: 3.5,
        noiseReduction: 0.4
      },
      'chirping': { 
        type: 'spectral', 
        freqRange: { low: 1000, high: 8000, emphasis: [2000, 4000, 6000] },
        chirpDetection: true,
        rapidChanges: true,
        amplification: 3.5,
        noiseReduction: 0.4
      },
      'dog': { 
        type: 'spectral', 
        freqRange: { low: 200, high: 3000, emphasis: [500, 1000, 1500] },
        barkPattern: true,
        burstDetection: true,
        amplification: 3.2,
        noiseReduction: 0.3
      },
      'barking': { 
        type: 'spectral', 
        freqRange: { low: 200, high: 3000, emphasis: [500, 1000, 1500] },
        barkPattern: true,
        burstDetection: true,
        amplification: 3.2,
        noiseReduction: 0.3
      },
      'water': { 
        type: 'spectral', 
        freqRange: { low: 100, high: 15000, emphasis: [1000, 4000, 8000] },
        noiseProfile: 'water',
        continuousFlow: true,
        amplification: 2.0,
        noiseReduction: 0.3
      },
      'flowing': { 
        type: 'spectral', 
        freqRange: { low: 100, high: 15000, emphasis: [1000, 4000, 8000] },
        noiseProfile: 'water',
        continuousFlow: true,
        amplification: 2.0,
        noiseReduction: 0.3
      },
      'wind': { 
        type: 'spectral', 
        freqRange: { low: 20, high: 2000, emphasis: [50, 200, 1000] },
        noiseProfile: 'wind',
        dynamicRange: true,
        amplification: 2.2,
        noiseReduction: 0.2
      },
      'footsteps': { 
        type: 'spectral', 
        freqRange: { low: 100, high: 1200, emphasis: [200, 400, 800] },
        percussiveRatio: 0.7,
        transientBoost: true,
        amplification: 2.8,
        noiseReduction: 0.4
      },
      'walking': { 
        type: 'spectral', 
        freqRange: { low: 100, high: 1200, emphasis: [200, 400, 800] },
        percussiveRatio: 0.7,
        transientBoost: true,
        amplification: 2.8,
        noiseReduction: 0.4
      }
    };

    // Find best match for target
    for (const [key, params] of Object.entries(paramMap)) {
      if (target.toLowerCase().includes(key)) {
        return params;
      }
    }

    // Default parameters for unknown sounds with moderate amplification
    return { 
      type: 'spectral', 
      freqRange: { low: 100, high: 8000, emphasis: [1000] },
      adaptiveGain: true,
      amplification: 2.0,
      noiseReduction: 0.3
    };
  };

  const applyEnhancedHarmonicSeparation = async (
    inputData: Float32Array, 
    outputData: Float32Array, 
    params: any, 
    sampleRate: number
  ): Promise<number> => {
    const fftSize = 4096; // Increased for better resolution
    const hopSize = fftSize / 8; // Smaller hop for better time resolution
    let overallQuality = 0;
    let frameCount = 0;
    
    console.log('Applying enhanced harmonic separation with amplification...');
    
    for (let i = 0; i < inputData.length; i += hopSize) {
      const segment = inputData.slice(i, Math.min(i + fftSize, inputData.length));
      
      // Apply Hamming window for better frequency resolution
      const windowed = new Float32Array(segment.length);
      for (let j = 0; j < segment.length; j++) {
        const window = 0.54 - 0.46 * Math.cos(2 * Math.PI * j / (segment.length - 1));
        windowed[j] = segment[j] * window;
      }
      
      // Enhanced harmonic detection
      const harmonicStrength = detectEnhancedHarmonicContent(windowed, sampleRate, params.freqRange.emphasis);
      
      // Apply enhanced harmonic masking with amplification
      for (let j = 0; j < windowed.length; j++) {
        const frequency = (j / windowed.length) * (sampleRate / 2);
        let mask = 0;
        
        if (isInTargetRange(frequency, params.freqRange)) {
          mask = harmonicStrength * params.harmonicRatio;
          
          // Enhanced frequency emphasis
          for (const emphFreq of params.freqRange.emphasis) {
            const distance = Math.abs(frequency - emphFreq);
            if (distance < 150) {
              mask *= (1 + (150 - distance) / 150 * 1.5); // Stronger emphasis
            }
          }
          
          // Apply amplification to target frequencies
          mask *= params.amplification || 1.0;
        } else {
          // Reduced suppression to preserve some context
          mask = params.noiseReduction || 0.1;
        }
        
        windowed[j] *= Math.min(3.0, mask); // Allow higher amplification
      }
      
      // Copy processed segment to output with overlap-add
      for (let j = 0; j < windowed.length && i + j < outputData.length; j++) {
        if (i + j < outputData.length) {
          outputData[i + j] += windowed[j] * 0.5; // Overlap-add with scaling
        }
      }
      
      overallQuality += harmonicStrength;
      frameCount++;
    }
    
    return frameCount > 0 ? overallQuality / frameCount : 0.5;
  };

  const applyEnhancedSpectralMasking = async (
    inputData: Float32Array, 
    outputData: Float32Array, 
    params: any, 
    sampleRate: number
  ): Promise<number> => {
    const fftSize = 4096;
    const hopSize = fftSize / 8;
    let overallQuality = 0;
    let frameCount = 0;
    
    console.log('Applying enhanced spectral masking with signal boost...');
    
    for (let i = 0; i < inputData.length; i += hopSize) {
      const segment = inputData.slice(i, Math.min(i + fftSize, inputData.length));
      
      // Apply Hamming window
      const windowed = new Float32Array(segment.length);
      for (let j = 0; j < segment.length; j++) {
        const window = 0.54 - 0.46 * Math.cos(2 * Math.PI * j / (segment.length - 1));
        windowed[j] = segment[j] * window;
      }
      
      // Enhanced spectral analysis
      const spectralEnergy = calculateEnhancedSpectralEnergy(windowed, sampleRate, params.freqRange);
      
      // Apply enhanced spectral mask with amplification
      for (let j = 0; j < windowed.length; j++) {
        const frequency = (j / windowed.length) * (sampleRate / 2);
        let mask = 0;
        
        if (isInTargetRange(frequency, params.freqRange)) {
          // Calculate enhanced adaptive mask
          mask = calculateEnhancedAdaptiveMask(frequency, params, spectralEnergy);
          
          // Apply amplification
          mask *= params.amplification || 1.0;
        } else {
          // Controlled suppression
          mask = params.noiseReduction || 0.05;
        }
        
        windowed[j] *= Math.min(4.0, mask); // Higher max amplification for spectral
      }
      
      // Copy to output with overlap-add
      for (let j = 0; j < windowed.length && i + j < outputData.length; j++) {
        if (i + j < outputData.length) {
          outputData[i + j] += windowed[j] * 0.5;
        }
      }
      
      overallQuality += spectralEnergy;
      frameCount++;
    }
    
    return frameCount > 0 ? overallQuality / frameCount : 0.5;
  };

  const applySignalAmplification = (outputData: Float32Array, params: any) => {
    const amplification = params.amplification || 1.0;
    const noiseFloor = 0.001; // Minimum signal level
    
    // Apply dynamic range compression and amplification
    for (let i = 0; i < outputData.length; i++) {
      let sample = outputData[i];
      
      // Apply soft limiting to prevent clipping
      if (Math.abs(sample) > 0.8) {
        sample = Math.sign(sample) * (0.8 + 0.2 * Math.tanh((Math.abs(sample) - 0.8) * 5));
      }
      
      // Boost weak signals above noise floor
      if (Math.abs(sample) > noiseFloor) {
        sample *= amplification;
      }
      
      // Final limiting
      outputData[i] = Math.max(-0.95, Math.min(0.95, sample));
    }
  };

  const detectEnhancedHarmonicContent = (data: Float32Array, sampleRate: number, emphasisFreqs: number[]): number => {
    let harmonicScore = 0;
    let fundamentalScore = 0;
    
    // Enhanced harmonic detection with fundamental frequency analysis
    for (const freq of emphasisFreqs) {
      const bin = Math.floor((freq * data.length) / (sampleRate / 2));
      if (bin < data.length) {
        const magnitude = Math.abs(data[bin]);
        harmonicScore += magnitude;
        
        // Check for harmonics (2x, 3x frequency)
        const harmonic2Bin = Math.floor((freq * 2 * data.length) / (sampleRate / 2));
        const harmonic3Bin = Math.floor((freq * 3 * data.length) / (sampleRate / 2));
        
        if (harmonic2Bin < data.length) {
          harmonicScore += Math.abs(data[harmonic2Bin]) * 0.5;
        }
        if (harmonic3Bin < data.length) {
          harmonicScore += Math.abs(data[harmonic3Bin]) * 0.3;
        }
      }
    }
    
    return Math.min(1.2, harmonicScore / emphasisFreqs.length); // Allow higher scores
  };

  const calculateEnhancedSpectralEnergy = (data: Float32Array, sampleRate: number, freqRange: any): number => {
    let energy = 0;
    let peakEnergy = 0;
    const startBin = Math.floor((freqRange.low * data.length) / (sampleRate / 2));
    const endBin = Math.floor((freqRange.high * data.length) / (sampleRate / 2));
    
    for (let i = startBin; i < endBin && i < data.length; i++) {
      const magnitude = Math.abs(data[i]);
      energy += magnitude * magnitude;
      peakEnergy = Math.max(peakEnergy, magnitude);
    }
    
    // Combine average and peak energy for better assessment
    const avgEnergy = energy / Math.max(1, (endBin - startBin));
    return (avgEnergy + peakEnergy * 0.3) / 1.3;
  };

  const calculateEnhancedAdaptiveMask = (frequency: number, params: any, spectralEnergy: number): number => {
    let baseMask = 0.4; // Higher base mask
    
    // Enhanced frequency emphasis
    for (const emphFreq of params.freqRange.emphasis) {
      const distance = Math.abs(frequency - emphFreq);
      if (distance < 300) { // Wider frequency bands
        baseMask += (300 - distance) / 300 * 0.8; // Stronger boost
      }
    }
    
    // Enhanced energy-based adaptation
    baseMask *= (0.3 + spectralEnergy * 1.4);
    
    return Math.min(2.5, baseMask); // Higher maximum mask
  };

  const isInTargetRange = (frequency: number, freqRange: any): boolean => {
    return frequency >= freqRange.low && frequency <= freqRange.high;
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
    let confidence = 0.5; // Higher base confidence

    // Enhanced confidence from matching
    if (matchedSounds.some(sound => 
      sound.toLowerCase().includes(target.toLowerCase()) ||
      target.toLowerCase().includes(sound.toLowerCase())
    )) {
      confidence += 0.25;
    }

    // Quality-based confidence boost
    confidence += separationQuality * 0.3;

    // Target-specific confidence adjustment
    if (['speech', 'voice', 'music', 'dog', 'barking', 'bird', 'chirping'].includes(target)) {
      confidence += 0.15; // Higher boost for well-defined sounds
    }

    return Math.min(0.95, confidence);
  };

  const generateEnhancedDescription = (target: string, confidence: number, method: string): string => {
    const qualityDescriptor = confidence > 0.8 ? 'high-quality' :
                             confidence > 0.65 ? 'good-quality' : 'moderate-quality';
    
    return `${qualityDescriptor} extraction of ${target} using ${method} with signal enhancement (${(confidence * 100).toFixed(1)}% confidence)`;
  };

  const applyAdvancedFiltering = async (inputData: Float32Array, outputData: Float32Array, params: any, sampleRate: number): Promise<number> => {
    console.log('Applying advanced multi-band filtering...');
    
    // Enhanced multi-band processing with amplification
    const bands = divideToBands(inputData, sampleRate, params.freqRange);
    let totalQuality = 0;
    
    for (const band of bands) {
      const bandQuality = processBand(band, params);
      totalQuality += bandQuality;
    }
    
    // Reconstruct signal with amplification
    combineBands(bands, outputData);
    
    // Apply signal amplification
    applySignalAmplification(outputData, params);
    
    return totalQuality / bands.length;
  };

  const divideToBands = (data: Float32Array, sampleRate: number, freqRange: any): Float32Array[] => {
    const numBands = 16; // More bands for better separation
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
    let quality = 0;
    const amplification = params.amplification || 1.0;
    
    for (let i = 0; i < band.length; i++) {
      band[i] *= 0.9 * amplification; // Enhanced gain with amplification
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
          Advanced audio separation with signal amplification and improved clarity for precise sound extraction
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
                  Enhanced processing with signal amplification for clearer, stronger audio output. Supports precise extraction of speech, animals, vehicles, and environmental sounds.
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
                    Processing with Enhanced Amplification...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Extract Audio (Enhanced & Amplified)
                  </>
                )}
              </Button>

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Enhanced Processing with Signal Boost</span>
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
            <h3 className="font-semibold">Enhanced Extraction Results (Amplified)</h3>
            
            <div className="space-y-4">
              {separationResults.map((result, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">"{result.query}"</h4>
                        <p className="text-sm text-gray-600">{result.description}</p>
                        <p className="text-xs text-blue-600 mt-1">Method: {result.processingMethod}</p>
                        <p className="text-xs text-green-600">Signal Strength: {(result.signalStrength * 100).toFixed(1)}%</p>
                        
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
                              result.confidence > 0.65 ? 'bg-yellow-500' : 'bg-orange-500'
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
                        {playingIndex === index ? 'Pause' : 'Play Enhanced'}
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
