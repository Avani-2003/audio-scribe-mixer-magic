import React, { useState, useRef, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import { loadGraphModel } from '@tensorflow/tfjs-converter';
import { CLASS_NAMES } from './yamnet_utils';

// 1. Audio normalization (EXACTLY like librosa)
const normalizeAudio = (audioData: Float32Array) => {
  const maxVal = Math.max(...audioData.map(Math.abs));
  return maxVal > 0 ? audioData.map(val => val / maxVal) : audioData;
};

// 2. Python-equivalent frame processing
const calculateMeanScores = (scoresData: Float32Array, frameCount: number) => {
  const meanScores = new Array(521).fill(0);
  for (let frame = 0; frame < frameCount; frame++) {
    for (let classIdx = 0; classIdx < 521; classIdx++) {
      meanScores[classIdx] += scoresData[frame * 521 + classIdx] / frameCount;
    }
  }
  return meanScores;
};

export default function AudioAnalyzer() {
  const [model, setModel] = useState<tf.GraphModel | null>(null);
  const [results, setResults] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    loadGraphModel(
      'https://tfhub.dev/google/tfjs-model/yamnet/tfjs/1',
      { fromTFHub: true }
    ).then(setModel);
  }, []);

  const analyzeAudio = async (audioBuffer: AudioBuffer) => {
    if (!model) return;

    // A. Resample to 16kHz + normalize + pad/trim
    const resampled = await resampleAudio(audioBuffer, 16000);
    let audioData = normalizeAudio(resampled.getChannelData(0));
    audioData = prepareInput(audioData); // Exact 15600 samples

    // B. Create tensor with Python-identical shape
    const input = tf.tensor(audioData, [1, audioData.length], 'float32');

    // C. Get scores
    const [scores] = model.execute(input) as tf.Tensor[];
    const scoresData = await scores.data();

    // D. Python-identical aggregation
    const frameCount = scores.shape[0];
    const meanScores = calculateMeanScores(scoresData as Float32Array, frameCount);

    // E. Get top 3 (same as Python's argsort)
    const topClasses = meanScores
      .map((score, idx) => ({ score, idx }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => CLASS_NAMES[item.idx]);

    setResults(topClasses);
    tf.dispose([input, scores]);
  };

  // Helper functions
  const resampleAudio = async (buffer: AudioBuffer, targetRate: number) => {
    // ... (keep same resampling code from earlier)
  };

  const prepareInput = (audioData: Float32Array) => {
    const targetLength = 15600; // YAMNet's exact required length
    if (audioData.length >= targetLength) return audioData.slice(0, targetLength);
    const padded = new Float32Array(targetLength);
    padded.set(audioData);
    return padded;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // ... (keep same file handling)
  };

  return (
    <div>
      {/* ... (keep same UI) */}
    </div>
  );
}
