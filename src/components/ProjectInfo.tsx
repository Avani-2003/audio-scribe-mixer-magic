
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

  const nextSteps = [
    'Implement actual neural network models (PyTorch/TensorFlow)',
    'Use real audio separation algorithms (STFT, ICA, Deep Learning)',
    'Connect to AudioCaps dataset API',
    'Add advanced audio preprocessing',
    'Implement real-time processing',
    'Add model training interface'
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

      <Card>
        <CardHeader>
          <CardTitle>Next Steps for Production</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {nextSteps.map((step, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-xs font-medium text-yellow-700 mt-0.5">
                  {index + 1}
                </div>
                <span className="text-gray-700">{step}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Important Note:</h4>
            <p className="text-blue-700 text-sm">
              This demo shows the UI and workflow. For a real implementation, you'll need to integrate 
              actual machine learning models for audio separation. Consider using libraries like 
              librosa (Python), TensorFlow.js, or connecting to a backend service with PyTorch models.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectInfo;
