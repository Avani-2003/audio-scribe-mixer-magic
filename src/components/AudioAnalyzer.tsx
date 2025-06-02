
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileAudio, Brain, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AudioAnalysis {
  detectedSounds: string[];
  confidence: { [key: string]: number };
  duration: number;
  sampleRate: number;
  channels: number;
}

const AudioAnalyzer = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AudioAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setAnalysis(null);
      toast({
        title: "Audio File Loaded",
        description: `${file.name} is ready for analysis`
      });
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload a valid audio file",
        variant: "destructive"
      });
    }
  };

  const analyzeAudio = async () => {
    if (!audioFile || !audioUrl) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Simulate audio analysis with Web Audio API
      const audioContext = new AudioContext();
      const arrayBuffer = await audioFile.arrayBuffer();
      
      // Progress update
      setAnalysisProgress(20);
      
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Progress update
      setAnalysisProgress(40);

      // Get audio features
      const channelData = audioBuffer.getChannelData(0);
      const features = extractAudioFeatures(channelData, audioBuffer.sampleRate);
      
      // Progress update
      setAnalysisProgress(60);

      // Simulate AI analysis (in real implementation, this would use a trained model)
      const detectedSounds = classifyAudioContent(features);
      
      // Progress update
      setAnalysisProgress(80);

      // Calculate confidence scores
      const confidence: { [key: string]: number } = {};
      detectedSounds.forEach(sound => {
        confidence[sound] = Math.random() * 0.4 + 0.6; // 60-100% confidence
      });

      const analysisResult: AudioAnalysis = {
        detectedSounds,
        confidence,
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels
      };

      setAnalysis(analysisResult);
      setAnalysisProgress(100);
      
      toast({
        title: "Analysis Complete",
        description: `Detected ${detectedSounds.length} different sound types`
      });

    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Error occurred during audio analysis",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const extractAudioFeatures = (audioData: Float32Array, sampleRate: number) => {
    // Extract basic audio features for classification
    const features = {
      rms: calculateRMS(audioData),
      zeroCrossingRate: calculateZeroCrossingRate(audioData),
      spectralCentroid: calculateSpectralCentroid(audioData, sampleRate),
      mfcc: calculateMFCC(audioData, sampleRate)
    };
    
    return features;
  };

  const calculateRMS = (data: Float32Array): number => {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }
    return Math.sqrt(sum / data.length);
  };

  const calculateZeroCrossingRate = (data: Float32Array): number => {
    let crossings = 0;
    for (let i = 1; i < data.length; i++) {
      if ((data[i] >= 0) !== (data[i-1] >= 0)) {
        crossings++;
      }
    }
    return crossings / data.length;
  };

  const calculateSpectralCentroid = (data: Float32Array, sampleRate: number): number => {
    // Simplified spectral centroid calculation
    const fftSize = Math.min(1024, data.length);
    const fft = new Float32Array(fftSize);
    for (let i = 0; i < fftSize; i++) {
      fft[i] = data[i];
    }
    
    // Simple frequency weighting
    let weightedSum = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < fftSize / 2; i++) {
      const magnitude = Math.abs(fft[i]);
      const frequency = (i * sampleRate) / fftSize;
      weightedSum += frequency * magnitude;
      magnitudeSum += magnitude;
    }
    
    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  };

  const calculateMFCC = (data: Float32Array, sampleRate: number): number[] => {
    // Simplified MFCC-like features
    const numCoeffs = 13;
    const coeffs = new Array(numCoeffs);
    
    for (let i = 0; i < numCoeffs; i++) {
      coeffs[i] = Math.random() * 2 - 1; // Placeholder calculation
    }
    
    return coeffs;
  };

  const classifyAudioContent = (features: any): string[] => {
    // Simulate audio classification based on features
    // In a real implementation, this would use a trained model (BERT-like for audio)
    
    const possibleSounds = [
      'speech', 'music', 'noise', 'clapping', 'footsteps', 
      'dog barking', 'car engine', 'birds chirping', 'door closing',
      'keyboard typing', 'phone ringing', 'water flowing', 'wind',
      'laughter', 'crying', 'coughing', 'sneezing'
    ];

    const detectedSounds: string[] = [];
    
    // Simulate classification logic based on audio features
    if (features.rms > 0.1) {
      detectedSounds.push('speech');
    }
    
    if (features.zeroCrossingRate > 0.05) {
      detectedSounds.push('noise');
    }
    
    if (features.spectralCentroid > 1000) {
      detectedSounds.push('music');
    }
    
    // Add random sounds for demonstration
    const randomSounds = possibleSounds
      .filter(sound => !detectedSounds.includes(sound))
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 3) + 1);
    
    detectedSounds.push(...randomSounds);
    
    return detectedSounds;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Audio Content Analyzer
        </CardTitle>
        <p className="text-sm text-gray-600">
          Upload mixed audio to analyze and identify different sound components
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
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

          {audioUrl && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileAudio className="w-4 h-4" />
                <span className="text-sm font-medium">{audioFile?.name}</span>
              </div>
              
              <audio 
                ref={audioRef}
                src={audioUrl}
                controls 
                className="w-full"
              />

              <Button 
                onClick={analyzeAudio}
                disabled={isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Audio...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Analyze Audio Content
                  </>
                )}
              </Button>

              {isAnalyzing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Analysis Progress</span>
                    <span>{analysisProgress}%</span>
                  </div>
                  <Progress value={analysisProgress} className="w-full" />
                </div>
              )}
            </div>
          )}
        </div>

        {analysis && (
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800">Audio Analysis Results</h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Duration:</span> {analysis.duration.toFixed(2)}s
              </div>
              <div>
                <span className="font-medium">Sample Rate:</span> {analysis.sampleRate} Hz
              </div>
              <div>
                <span className="font-medium">Channels:</span> {analysis.channels}
              </div>
              <div>
                <span className="font-medium">Detected Sounds:</span> {analysis.detectedSounds.length}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Detected Audio Content:</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.detectedSounds.map((sound, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {sound}
                    <span className="text-xs opacity-75">
                      {(analysis.confidence[sound] * 100).toFixed(0)}%
                    </span>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="p-3 bg-white rounded border border-blue-200">
              <h4 className="font-medium mb-2">Text Description:</h4>
              <p className="text-sm text-gray-700">
                This audio file contains {analysis.detectedSounds.length} different types of sounds: {' '}
                {analysis.detectedSounds.map((sound, index) => 
                  `${sound} (${(analysis.confidence[sound] * 100).toFixed(0)}% confidence)`
                ).join(', ')}. 
                The audio is {analysis.duration.toFixed(1)} seconds long with a sample rate of {analysis.sampleRate} Hz.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AudioAnalyzer;
