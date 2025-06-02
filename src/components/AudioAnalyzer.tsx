import React, { useState, useRef, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import { loadGraphModel } from '@tensorflow/tfjs-converter';
import { CLASS_NAMES } from './yamnet_utils';

const AudioAnalyzer: React.FC = () => {
  const [model, setModel] = useState<tf.GraphModel | null>(null);
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load model
  useEffect(() => {
    const loadModel = async () => {
      setLoading(true);
      try {
        const model = await loadGraphModel(
          'https://tfhub.dev/google/tfjs-model/yamnet/tfjs/1',
          { fromTFHub: true }
        );
        setModel(model);
      } catch (err) {
        console.error('Model loading failed:', err);
      } finally {
        setLoading(false);
      }
    };
    loadModel();
  }, []);

  const analyzeAudio = async (audioBuffer: AudioBuffer) => {
    if (!model) return;
    
    // Resample to 16kHz
    const resampled = await resampleAudio(audioBuffer, 16000);
    const audioData = resampled.getChannelData(0);
    
    // Convert to tensor (YAMNet expects [-1, 1] range)
    const input = tf.tensor(audioData, [1, audioData.length], 'float32');
    
    // Run inference
    const [scores] = model.execute(input) as tf.Tensor[];
    const scoresData = await scores.data();
    
    // Calculate mean scores across frames (matches Python code)
    const meanScores = Array.from(scoresData)
      .reduce((acc: number[], val, idx) => {
        const classIdx = idx % 521;
        acc[classIdx] = (acc[classIdx] || 0) + val;
        return acc;
      }, new Array(521).fill(0))
      .map(score => score / (scoresData.length / 521));
    
    // Get top 3 classes
    const topClasses = meanScores
      .map((score, index) => ({ score, index }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => CLASS_NAMES[item.index]);
    
    setResults(topClasses);
    tf.dispose([input, scores]);
  };

  const resampleAudio = async (buffer: AudioBuffer, targetRate: number) => {
    const offlineCtx = new OfflineAudioContext(
      1, 
      buffer.length * targetRate / buffer.sampleRate,
      targetRate
    );
    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(offlineCtx.destination);
    source.start();
    return await offlineCtx.startRendering();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !model) return;
    
    setLoading(true);
    try {
      const file = e.target.files[0];
      const arrayBuffer = await file.arrayBuffer();
      const audioCtx = new AudioContext();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      
      await analyzeAudio(audioBuffer);
      
      if (audioRef.current) {
        audioRef.current.src = URL.createObjectURL(file);
        audioRef.current.play();
      }
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="audio/*"
        disabled={loading || !model}
      />
      
      {loading && <div>Processing...</div>}
      
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
