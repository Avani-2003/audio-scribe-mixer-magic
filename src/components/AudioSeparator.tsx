import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator as UISeparator } from '@/components/ui/separator';
import { Search, Download, Play, Pause, AudioLines } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SeparatedAudio {
  query: string;
  confidence: number;
  audioUrl: string;
  description: string;
}

const AudioSeparator = () => {
  const [mixedAudio, setMixedAudio] = useState<string | null>(null);
  const [textQuery, setTextQuery] = useState('');
  const [separatedAudios, setSeparatedAudios] = useState<SeparatedAudio[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);
  const { toast } = useToast();

  const handleMixedAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      const url = URL.createObjectURL(file);
      setMixedAudio(url);
      toast({
        title: "Mixed Audio Loaded",
        description: "Ready for source separation"
      });
    }
  };

  const simulateAudioSeparation = async (query: string) => {
    setIsProcessing(true);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate neural network processing
    const queries = query.toLowerCase().split(',').map(q => q.trim()).filter(q => q.length > 0);
    const separatedResults: SeparatedAudio[] = [];
    
    for (const q of queries) {
      // Simulate confidence based on query complexity
      const confidence = Math.random() * 0.4 + 0.6; // 60-100%
      
      // In a real implementation, this would be the actual separated audio
      // For demo, we'll generate different audio for each query
      const separatedUrl = await generateSimulatedAudio(q);
      
      separatedResults.push({
        query: q,
        confidence: confidence,
        audioUrl: separatedUrl,
        description: getAudioDescription(q)
      });
    }
    
    setSeparatedAudios(separatedResults);
    setIsProcessing(false);
    
    toast({
      title: "Separation Complete",
      description: `Successfully separated ${separatedResults.length} audio sources`
    });
  };

  const generateSimulatedAudio = async (query: string): Promise<string> => {
    // Generate different audio characteristics based on query
    const audioContext = new AudioContext();
    const duration = 5; // 5 seconds
    const sampleRate = audioContext.sampleRate;
    const length = duration * sampleRate;
    const buffer = audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate different waveforms based on query keywords
    const frequency = getFrequencyFromQuery(query);
    
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Generate a simple tone with some noise
      data[i] = Math.sin(2 * Math.PI * frequency * t) * 0.3 + (Math.random() - 0.5) * 0.1;
    }
    
    // Convert to blob
    const blob = await audioBufferToBlob(buffer);
    return URL.createObjectURL(blob);
  };

  const getFrequencyFromQuery = (query: string): number => {
    // Map different query types to different frequencies for demonstration
    const keywords = {
      'voice': 200,
      'speech': 200,
      'music': 440,
      'guitar': 330,
      'piano': 523,
      'drum': 100,
      'bass': 80,
      'high': 800,
      'low': 150
    };
    
    for (const [keyword, freq] of Object.entries(keywords)) {
      if (query.includes(keyword)) {
        return freq;
      }
    }
    
    return 220; // Default frequency
  };

  const getAudioDescription = (query: string): string => {
    const descriptions = {
      'voice': 'Human vocal content with speech patterns',
      'speech': 'Clear speech audio with vocal characteristics',
      'music': 'Musical content with harmonic structure',
      'guitar': 'String instrument with guitar-like timbre',
      'piano': 'Keyboard instrument with piano characteristics',
      'drum': 'Percussive elements with rhythmic patterns',
      'bass': 'Low-frequency content with bass characteristics'
    };
    
    for (const [keyword, desc] of Object.entries(descriptions)) {
      if (query.includes(keyword)) {
        return desc;
      }
    }
    
    return 'Audio content matching the specified query';
  };

  const audioBufferToBlob = async (buffer: AudioBuffer): Promise<Blob> => {
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
        // Pause any currently playing audio
        audioRefs.current.forEach(a => a?.pause());
        audio.play();
        setPlayingIndex(index);
      }
    }
  };

  const downloadSeparated = (audioUrl: string, query: string) => {
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `separated_${query.replace(/\s+/g, '_')}.wav`;
    a.click();
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AudioLines className="w-5 h-5" />
          Audio Source Separator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="mixedAudio">Upload Mixed Audio</Label>
            <Input
              id="mixedAudio"
              type="file"
              accept="audio/*"
              onChange={handleMixedAudioUpload}
              className="cursor-pointer"
            />
          </div>

          {mixedAudio && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="textQuery">Natural Language Query</Label>
                <Textarea
                  id="textQuery"
                  placeholder="Enter your query (e.g., 'extract the voice', 'separate the music', 'guitar sound', etc.)"
                  value={textQuery}
                  onChange={(e) => setTextQuery(e.target.value)}
                  rows={3}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Tip: You can separate multiple sources by using commas (e.g., "voice, music, drums")
                </p>
              </div>

              <Button 
                onClick={() => simulateAudioSeparation(textQuery)}
                disabled={!textQuery.trim() || isProcessing}
                className="w-full"
              >
                <Search className="w-4 h-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Separate Audio Sources'}
              </Button>
            </div>
          )}
        </div>

        {separatedAudios.length > 0 && (
          <div className="space-y-4">
            <UISeparator />
            <h3 className="font-semibold">Separated Audio Sources</h3>
            
            <div className="space-y-4">
              {separatedAudios.map((separated, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium capitalize">"{separated.query}"</h4>
                        <p className="text-sm text-gray-600">{separated.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          Confidence: {(separated.confidence * 100).toFixed(1)}%
                        </div>
                        <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${separated.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <audio 
                      ref={el => audioRefs.current[index] = el}
                      src={separated.audioUrl}
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
                        onClick={() => downloadSeparated(separated.audioUrl, separated.query)}
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

export default AudioSeparator;
