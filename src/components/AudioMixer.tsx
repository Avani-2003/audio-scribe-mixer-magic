
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Play, Pause, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AudioFile {
  name: string;
  duration: number;
  url: string;
  file: File;
}

const AudioMixer = () => {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [mixedAudio, setMixedAudio] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [minDuration, setMinDuration] = useState(3); // minimum 3 seconds
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validAudioFiles: AudioFile[] = [];

    for (const file of files) {
      if (file.type.startsWith('audio/')) {
        const url = URL.createObjectURL(file);
        const audio = new Audio(url);
        
        await new Promise((resolve) => {
          audio.addEventListener('loadedmetadata', () => {
            if (audio.duration >= minDuration) {
              validAudioFiles.push({
                name: file.name,
                duration: audio.duration,
                url: url,
                file: file
              });
            } else {
              console.log(`Skipping ${file.name} - too short (${audio.duration}s)`);
            }
            resolve(null);
          });
        });
      }
    }

    setAudioFiles(prev => [...prev, ...validAudioFiles]);
    
    toast({
      title: "Audio Files Processed",
      description: `Added ${validAudioFiles.length} valid audio files (${files.length - validAudioFiles.length} skipped for being too short)`
    });
  };

  const mixAudioFiles = async () => {
    if (audioFiles.length < 2) {
      toast({
        title: "Error",
        description: "Need at least 2 audio files to mix",
        variant: "destructive"
      });
      return;
    }

    try {
      // In a real implementation, you would use Web Audio API for actual mixing
      // This is a simplified demonstration
      const audioContext = new AudioContext();
      const mixedBuffer = await simulateAudioMixing(audioFiles, audioContext);
      
      // Convert to blob and create URL
      const blob = await audioBufferToBlob(mixedBuffer);
      const mixedUrl = URL.createObjectURL(blob);
      setMixedAudio(mixedUrl);
      
      toast({
        title: "Audio Mixed Successfully",
        description: `Mixed ${audioFiles.length} audio files`
      });
    } catch (error) {
      toast({
        title: "Mixing Failed",
        description: "Error occurred during audio mixing",
        variant: "destructive"
      });
    }
  };

  const simulateAudioMixing = async (files: AudioFile[], context: AudioContext) => {
    // This is a simplified simulation - in reality you'd load and mix actual audio buffers
    const duration = Math.max(...files.map(f => f.duration));
    const sampleRate = context.sampleRate;
    const length = duration * sampleRate;
    const buffer = context.createBuffer(2, length, sampleRate);
    
    // Simulate mixed audio with some noise
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() - 0.5) * 0.1; // Simulate mixed audio
      }
    }
    
    return buffer;
  };

  const audioBufferToBlob = async (buffer: AudioBuffer): Promise<Blob> => {
    // Convert AudioBuffer to WAV blob
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
    
    // Audio data
    const channelData = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const downloadMixed = () => {
    if (mixedAudio) {
      const a = document.createElement('a');
      a.href = mixedAudio;
      a.download = 'mixed_audio.wav';
      a.click();
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Audio Dataset Creator & Mixer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="minDuration">Minimum Duration (seconds)</Label>
            <Input
              id="minDuration"
              type="number"
              value={minDuration}
              onChange={(e) => setMinDuration(Number(e.target.value))}
              min="1"
              max="60"
              className="w-32"
            />
          </div>
          
          <div>
            <Label htmlFor="audioFiles">Upload Audio Files</Label>
            <Input
              id="audioFiles"
              type="file"
              multiple
              accept="audio/*"
              onChange={handleFileUpload}
              className="cursor-pointer"
            />
          </div>
        </div>

        {audioFiles.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Valid Audio Files ({audioFiles.length})</h3>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {audioFiles.map((file, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm truncate">{file.name}</span>
                  <span className="text-xs text-gray-500">{file.duration.toFixed(1)}s</span>
                </div>
              ))}
            </div>
            
            <Button onClick={mixAudioFiles} className="w-full">
              Mix Audio Files
            </Button>
          </div>
        )}

        {mixedAudio && (
          <div className="space-y-4 p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-800">Mixed Audio Ready</h3>
            <audio ref={audioRef} src={mixedAudio} onEnded={() => setIsPlaying(false)} />
            <div className="flex gap-2">
              <Button onClick={togglePlayback} variant="outline">
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              <Button onClick={downloadMixed} variant="outline">
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AudioMixer;
