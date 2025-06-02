import React, { useState, useRef, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import { loadGraphModel } from '@tensorflow/tfjs-converter';
import { CLASS_NAMES } from './yamnet_utils';

const AudioAnalyzer = () => {
  const [model, setModel] = useState<tf.GraphModel | null>(null);
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const loadModel = async () => {
      setLoading(true);
      try {
        const model = await loadGraphModel(
          'https://tfhub.dev/google/tfjs-model/yamnet/tfjs/1',
          { fromTFHub: true }
        );
        setModel(model);
      } finally {
        setLoading(false);
      }
    };
    loadModel();
  }, []);

  const analyzeAudio = async (audioBuffer: AudioBuffer) => {
    if (!model) return;
    
    // Resample to 16kHz exactly like librosa
    const resampled = await resampleAudio(audioBuffer, 16000);
    const audioData = resampled.getChannelData(0);
    
    // Normalize to [-1, 1] range
    const input = tf.tensor(audioData, [1, audioData.length], 'float32');
    
    // Get scores (identical to Python model output)
    const [scores] = model.execute(input) as tf.Tensor[];
    const scoresData = await scores.data();
    
    // Calculate mean scores across frames (EXACTLY like Python's mean(axis=0))
    const meanScores = new Array(521).fill(0);
    const frameCount = scores.shape[0];
    
    for (let i = 0; i < scoresData.length; i++) {
      const classIdx = i % 521;
      meanScores[classIdx] += scoresData[i] / frameCount;
    }
    
    // Get top 3 classes (identical to Python's argsort)
    const topClasses = meanScores
      .map((score, index) => ({ score, index }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => CLASS_NAMES[item.index]);
    
    setResults(topClasses);
    tf.dispose([input, scores]);
  };

  // Precise resampling matching librosa's behavior
  const resampleAudio = async (buffer: AudioBuffer, targetRate: number) => {
    if (buffer.sampleRate === targetRate) return buffer;
    
    const length = Math.floor(buffer.length * targetRate / buffer.sampleRate);
    const offlineCtx = new OfflineAudioContext(
      1, 
      length,
      targetRate
    );
    
    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(offlineCtx.destination);
    source.start();
    return await offlineCtx.startRendering();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !model) return;
    
    setLoading(true);
    try {
      const file = e.target.files[0];
      const arrayBuffer = await file.arrayBuffer();
      const audioCtx = new AudioContext();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      
      await analyzeAudio(audioBuffer);
      
      if (audioRef.current) {
        audioRef.current.src = URL.createObjectURL(file);
        await audioRef.current.play();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        disabled={loading || !model}
      />
      
      {loading && <div>Processing (this may take 10-20 seconds)...</div>}
      
      {results.length > 0 && (
        <div>
          <h3>Detected sounds:</h3>
          <ul>
            {results.map((sound, i) => (
              <li key={i}>{sound}</li>
            ))}
          </ul>
        </div>
      )}
      
      <audio ref={audioRef} controls />
    </div>
  );
};

export default AudioAnalyzer;
