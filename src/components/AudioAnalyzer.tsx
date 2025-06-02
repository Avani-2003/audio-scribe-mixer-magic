import React, { useState, useRef, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import { loadGraphModel } from '@tensorflow/tfjs-converter';
import * as yamnet from './yamnet_utils'; // You'll need to create this utility file

interface AudioAnalysisResult {
  detectedSounds: string[];
  probabilities: number[];
  spectrogram: Float32Array[];
}

const AudioAnalyzer: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [model, setModel] = useState<tf.GraphModel | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AudioAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load YAMnet model on component mount
  useEffect(() => {
    const loadModel = async () => {
      setIsLoading(true);
      try {
        const MODEL_URL = 'https://tfhub.dev/google/tfjs-model/yamnet/tfjs/1';
        const model = await loadGraphModel(MODEL_URL);
        setModel(model);
        setError(null);
      } catch (err) {
        console.error('Failed to load model:', err);
        setError('Failed to load the YAMnet model. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadModel();
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !model) return;

    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    try {
      // Process audio file
      const audioBuffer = await processAudioFile(file);
      
      // Run inference
      const result = await analyzeAudio(audioBuffer);
      setAnalysisResult(result);
      setError(null);

      // Play the audio
      if (audioRef.current) {
        audioRef.current.src = URL.createObjectURL(file);
        audioRef.current.play().catch(e => console.error('Audio play failed:', e));
      }
    } catch (err) {
      console.error('Audio analysis failed:', err);
      setError('Failed to analyze the audio file. Please try another file.');
    } finally {
      setIsLoading(false);
    }
  };

  const processAudioFile = async (file: File): Promise<AudioBuffer> => {
    return new Promise((resolve, reject) => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          resolve(audioBuffer);
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const analyzeAudio = async (audioBuffer: AudioBuffer): Promise<AudioAnalysisResult> => {
    if (!model) throw new Error('Model not loaded');

    // Resample to 16kHz (YAMnet's expected sample rate)
    const resampledAudio = await resampleAudio(audioBuffer, 16000);
    
    // Convert to mono and normalize between -1 and 1
    const audioData = convertToMono(resampledAudio.getChannelData(0));
    
    // The model expects a specific input shape
    const input = tf.tensor(audioData, [1, audioData.length], 'float32');
    
    // Run inference
    const outputs = model.execute(input) as tf.Tensor[];
    const [scores, embeddings, spectrogram] = outputs;
    
    // Process results
    const scoresData = await scores.data();
    const classScores = Array.from(scoresData);
    
    // Get top 3 detected sounds
    const topClasses = getTopKClasses(classScores, 3);
    
    // Clean up tensors to avoid memory leaks
    tf.dispose([input, ...outputs]);
    
    return {
      detectedSounds: topClasses.map(c => c.className),
      probabilities: topClasses.map(c => c.probability),
      spectrogram: spectrogram.arraySync() as Float32Array[]
    };
  };

  const resampleAudio = async (audioBuffer: AudioBuffer, targetSampleRate: number): Promise<AudioBuffer> => {
    const offlineCtx = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.duration * targetSampleRate,
      targetSampleRate
    );
    
    const bufferSource = offlineCtx.createBufferSource();
    bufferSource.buffer = audioBuffer;
    bufferSource.connect(offlineCtx.destination);
    bufferSource.start();
    
    return await offlineCtx.startRendering();
  };

  const convertToMono = (audioData: Float32Array): Float32Array => {
    // Normalize between -1 and 1
    const maxVal = Math.max(...audioData.map(Math.abs));
    return audioData.map(val => val / maxVal);
  };

  const getTopKClasses = (scores: number[], k: number): {className: string; probability: number}[] => {
    // This should use the actual YAMnet class names (you'll need to import them)
    // For now, we'll use placeholder names
    const classNames = yamnet.CLASS_NAMES; // You'll need to define this
    
    return scores
      .map((score, index) => ({
        className: classNames[index] || `Class ${index}`,
        probability: score
      }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, k);
  };

  return (
    <div className="audio-analyzer">
      <h2>Audio Analysis with YAMnet</h2>
      
      {isLoading && <div className="loading">Loading model or analyzing audio...</div>}
      {error && <div className="error">{error}</div>}
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="audio/*"
        disabled={isLoading || !model}
      />
      
      {analysisResult && (
        <div className="results">
          <h3>Analysis Results:</h3>
          <ul>
            {analysisResult.detectedSounds.map((sound, index) => (
              <li key={index}>
                {sound}: {(analysisResult.probabilities[index] * 100).toFixed(1)}% confidence
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <audio ref={audioRef} controls />
    </div>
  );
};

export default AudioAnalyzer;
