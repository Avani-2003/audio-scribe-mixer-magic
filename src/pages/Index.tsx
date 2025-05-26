
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AudioMixer from '@/components/AudioMixer';
import AudioSeparator from '@/components/AudioSeparator';
import ProjectInfo from '@/components/ProjectInfo';
import { AudioLines, Music, Info } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Audio Source Separation System
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Advanced audio processing system for creating mixed datasets and separating audio sources 
            using natural language queries. Perfect for final year projects in audio processing and machine learning.
          </p>
        </div>

        <Tabs defaultValue="mixer" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="mixer" className="flex items-center gap-2">
              <Music className="w-4 h-4" />
              Mixer
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

          <TabsContent value="mixer" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-center">Step 1: Create Mixed Audio Dataset</CardTitle>
                <p className="text-center text-gray-600">
                  Upload multiple audio files and create mixed audio for training your separation model
                </p>
              </CardHeader>
              <CardContent>
                <AudioMixer />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="separator" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-center">Step 2: Separate Audio Sources</CardTitle>
                <p className="text-center text-gray-600">
                  Use natural language queries to separate specific audio sources from mixed audio
                </p>
              </CardHeader>
              <CardContent>
                <AudioSeparator />
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
              <h3 className="text-xl font-semibold mb-2">Ready to Build Your Final Year Project?</h3>
              <p>
                This system provides a solid foundation for audio source separation using modern web technologies 
                and machine learning concepts. Expand it with real ML models for production use!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
