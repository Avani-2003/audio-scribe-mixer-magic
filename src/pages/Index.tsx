
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AudioAnalyzer from '@/components/AudioAnalyzer';
import SmartAudioSeparator from '@/components/SmartAudioSeparator';
import ProjectInfo from '@/components/ProjectInfo';
import { Brain, AudioLines, Info } from 'lucide-react';

const Index = () => {
  const [analyzedAudio, setAnalyzedAudio] = useState<{
    file: File | null;
    url: string | null;
    detectedSounds: string[];
  }>({
    file: null,
    url: null,
    detectedSounds: []
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI-Powered Audio Source Separation System
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Upload mixed audio, analyze its content using AI, then extract specific sounds 
            using natural language queries. 
          </p>
        </div>

        <Tabs defaultValue="analyzer" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="analyzer" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Analyzer
            </TabsTrigger>
            <TabsTrigger value="separator" className="flex items-center gap-2">
              <AudioLines className="w-4 h-4" />
              Separator
            </TabsTrigger>
            <TabsTrigger value="info" className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              Info
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analyzer" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-center">Step 1: Analyze Mixed Audio Content</CardTitle>
                <p className="text-center text-gray-600">
                  Upload your mixed audio file to identify what sounds it contains using AI analysis
                </p>
              </CardHeader>
              <CardContent>
                <AudioAnalyzer />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="separator" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-center">Step 2: Extract Audio Using Natural Language</CardTitle>
                <p className="text-center text-gray-600">
                  Use natural language queries to extract specific sounds from your mixed audio
                </p>
              </CardHeader>
              <CardContent>
                <SmartAudioSeparator 
                  audioFile={analyzedAudio.file}
                  audioUrl={analyzedAudio.url}
                  detectedSounds={analyzedAudio.detectedSounds}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="info" className="space-y-6">
            <ProjectInfo />
          </TabsContent>
        </Tabs>

        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-2">Advanced Audio Processing System</h3>
              <p>
                This system demonstrates modern audio processing technique.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
