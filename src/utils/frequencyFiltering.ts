
import { FrequencyRange } from './audioProcessing';

export const getTargetFrequencyRange = (target: string): FrequencyRange => {
  const frequencyMap: { [key: string]: FrequencyRange } = {
    'speech': { low: 85, high: 4000, emphasis: 1000 },
    'voice': { low: 85, high: 4000, emphasis: 1000 },
    'talking': { low: 85, high: 4000, emphasis: 1000 },
    'speaking': { low: 85, high: 4000, emphasis: 1000 },
    'conversation': { low: 85, high: 4000, emphasis: 1000 },
    'music': { low: 20, high: 20000, emphasis: 440 },
    'song': { low: 20, high: 20000, emphasis: 440 },
    'melody': { low: 80, high: 8000, emphasis: 440 },
    'instrument': { low: 20, high: 15000, emphasis: 440 },
    'guitar': { low: 80, high: 5000, emphasis: 330 },
    'piano': { low: 27, high: 4200, emphasis: 523 },
    'drums': { low: 20, high: 15000, emphasis: 100 },
    'clapping': { low: 1000, high: 8000, emphasis: 2000 },
    'applause': { low: 1000, high: 8000, emphasis: 2000 },
    'footsteps': { low: 20, high: 2000, emphasis: 200 },
    'walking': { low: 20, high: 2000, emphasis: 200 },
    'dog': { low: 200, high: 8000, emphasis: 500 },
    'barking': { low: 200, high: 8000, emphasis: 500 },
    'animal': { low: 100, high: 8000, emphasis: 500 },
    'bird': { low: 1000, high: 10000, emphasis: 3000 },
    'chirping': { low: 1000, high: 10000, emphasis: 3000 },
    'car': { low: 20, high: 2000, emphasis: 80 },
    'vehicle': { low: 20, high: 2000, emphasis: 80 },
    'engine': { low: 20, high: 2000, emphasis: 80 },
    'traffic': { low: 20, high: 2000, emphasis: 200 },
    'noise': { low: 20, high: 20000, emphasis: 1000 },
    'background': { low: 20, high: 1000, emphasis: 200 },
    'ambient': { low: 20, high: 1000, emphasis: 200 },
    'water': { low: 100, high: 8000, emphasis: 1000 },
    'flowing': { low: 100, high: 8000, emphasis: 1000 },
    'rain': { low: 500, high: 15000, emphasis: 2000 },
    'wind': { low: 20, high: 2000, emphasis: 100 },
    'door': { low: 100, high: 4000, emphasis: 500 },
    'phone': { low: 300, high: 3400, emphasis: 1000 },
    'ringing': { low: 300, high: 4000, emphasis: 1000 }
  };

  for (const [key, range] of Object.entries(frequencyMap)) {
    if (target.toLowerCase().includes(key)) {
      return range;
    }
  }

  return { low: 100, high: 8000, emphasis: 1000 };
};

export const applyFrequencyFilter = async (
  inputData: Float32Array, 
  outputData: Float32Array, 
  frequencyRange: FrequencyRange, 
  sampleRate: number
) => {
  const fftSize = 2048;
  const hopSize = fftSize / 4;
  
  for (let i = 0; i < inputData.length; i += hopSize) {
    const segment = inputData.slice(i, Math.min(i + fftSize, inputData.length));
    
    for (let j = 0; j < segment.length; j++) {
      const window = 0.5 - 0.5 * Math.cos(2 * Math.PI * j / (segment.length - 1));
      segment[j] *= window;
    }
    
    const processedSegment = new Float32Array(segment.length);
    for (let j = 0; j < segment.length; j++) {
      const frequency = (j / segment.length) * (sampleRate / 2);
      
      let filterResponse = 0;
      if (frequency >= frequencyRange.low && frequency <= frequencyRange.high) {
        const distanceFromEmphasis = Math.abs(frequency - frequencyRange.emphasis);
        const maxDistance = Math.max(frequencyRange.emphasis - frequencyRange.low, frequencyRange.high - frequencyRange.emphasis);
        filterResponse = Math.max(0.1, 1 - (distanceFromEmphasis / maxDistance));
      } else {
        filterResponse = 0.1;
      }
      
      processedSegment[j] = segment[j] * filterResponse;
    }
    
    for (let j = 0; j < processedSegment.length && i + j < outputData.length; j++) {
      outputData[i + j] = processedSegment[j];
    }
  }
};

export const extractAudioByFrequency = async (
  audioBuffer: AudioBuffer, 
  target: string, 
  matchedSounds: string[]
): Promise<string> => {
  const audioContext = new AudioContext();
  const frequencyRange = getTargetFrequencyRange(target);
  
  const outputBuffer = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const inputData = audioBuffer.getChannelData(channel);
    const outputData = outputBuffer.getChannelData(channel);
    
    await applyFrequencyFilter(inputData, outputData, frequencyRange, audioBuffer.sampleRate);
  }

  const { audioBufferToBlob } = await import('./audioProcessing');
  const blob = await audioBufferToBlob(outputBuffer);
  return URL.createObjectURL(blob);
};
