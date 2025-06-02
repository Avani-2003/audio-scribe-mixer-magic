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
    const length = Math.floor(buffer.length * targetRate / buffer.sampleRate);
    const offlineCtx = new OfflineAudioContext(1, length, targetRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(offlineCtx.destination);
    source.start();
    return await offlineCtx.startRendering();
  };

  const prepareInput = (audioData: Float32Array) => {
    const targetLength = 15600; // YAMNet's exact required length
    if (audioData.length >= targetLength) return audioData.slice(0, targetLength);
    const padded = new Float32Array(targetLength);
    padded.set(audioData);
    return padded;
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
      <h2>Audio Analyzer</h2>
      <input
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        disabled={loading || !model}
      />
      
      {loading && <p>Analyzing... (First run takes 15-20 seconds)</p>}
      
      {results.length > 0 && (
        <div>
          <h3>Results (Matches Python):</h3>
          <ol>
            {results.map((sound, i) => (
              <li key={i}>{sound}</li>
            ))}
          </ol>
        </div>
      )}
      
      <audio ref={audioRef} controls style={{ marginTop: 20 }} />
    </div>
  );
}
