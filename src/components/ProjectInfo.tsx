
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Music, Mic, Code, Database } from 'lucide-react';

const ProjectInfo = () => {
  const technologies = [
    { name: 'Web Audio API', icon: <Music className="w-4 h-4" /> },
    { name: 'Machine Learning', icon: <Brain className="w-4 h-4" /> },
    { name: 'Audio Processing', icon: <Mic className="w-4 h-4" /> },
    { name: 'React/TypeScript', icon: <Code className="w-4 h-4" /> },
    { name: 'AudioCaps Dataset', icon: <Database className="w-4 h-4" /> }
  ];

  const features = [
    'Audio dataset creation with duration filtering',
    'Multi-audio mixing capabilities',
    'Natural language query processing',
    'Audio source separation simulation',
    'Real-time audio visualization',
    'Download and playback functionality'
  ];



  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Project Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            This is a comprehensive audio source separation system that allows users to:
          </p>
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                {feature}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Technologies Used</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {technologies.map((tech, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {tech.icon}
                {tech.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>


    </div>
  );
};

export default ProjectInfo;
