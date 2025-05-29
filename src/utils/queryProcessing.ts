
export const parseQuery = (query: string): string[] => {
  const cleanQuery = query.toLowerCase().trim();
  
  const queries = cleanQuery
    .split(/[,;]|\sand\s|\sor\s/)
    .map(q => q.trim())
    .filter(q => q.length > 0);

  const soundKeywords = [
    'speech', 'voice', 'talking', 'speaking', 'conversation',
    'music', 'song', 'melody', 'instrument', 'guitar', 'piano', 'drums',
    'noise', 'background', 'ambient',
    'clapping', 'applause', 'footsteps', 'walking',
    'dog', 'barking', 'animal', 'bird', 'chirping',
    'car', 'vehicle', 'engine', 'traffic',
    'phone', 'ringing', 'notification',
    'water', 'flowing', 'rain', 'wind',
    'door', 'closing', 'opening', 'knock'
  ];

  const extractedSounds: string[] = [];
  
  queries.forEach(query => {
    soundKeywords.forEach(keyword => {
      if (query.includes(keyword) && !extractedSounds.includes(keyword)) {
        extractedSounds.push(keyword);
      }
    });
    
    if (extractedSounds.length === 0) {
      extractedSounds.push(query);
    }
  });

  return extractedSounds.length > 0 ? extractedSounds : [cleanQuery];
};

export const matchQueryWithDetectedSounds = (targetSounds: string[], detected: string[]): string[] => {
  const matches: string[] = [];
  
  targetSounds.forEach(target => {
    detected.forEach(sound => {
      if (sound.toLowerCase().includes(target.toLowerCase()) ||
          target.toLowerCase().includes(sound.toLowerCase()) ||
          areSimilarSounds(target, sound)) {
        if (!matches.includes(sound)) {
          matches.push(sound);
        }
      }
    });
  });

  return matches;
};

export const areSimilarSounds = (sound1: string, sound2: string): boolean => {
  const synonyms = {
    'speech': ['voice', 'talking', 'speaking', 'conversation'],
    'music': ['song', 'melody', 'instrument'],
    'noise': ['background', 'ambient'],
    'dog': ['barking', 'animal'],
    'car': ['vehicle', 'engine'],
    'water': ['flowing', 'rain']
  };

  for (const [key, values] of Object.entries(synonyms)) {
    if ((sound1.includes(key) || values.some(v => sound1.includes(v))) &&
        (sound2.includes(key) || values.some(v => sound2.includes(v)))) {
      return true;
    }
  }

  return false;
};

export const calculateSeparationConfidence = (target: string, matchedSounds: string[]): number => {
  let confidence = 0.5;

  if (matchedSounds.some(sound => 
    sound.toLowerCase().includes(target.toLowerCase()) ||
    target.toLowerCase().includes(sound.toLowerCase())
  )) {
    confidence += 0.3;
  }

  if (target.length > 5) {
    confidence += 0.1;
  }

  return Math.min(0.95, confidence + Math.random() * 0.1);
};

export const generateDescription = (target: string, confidence: number): string => {
  const qualityDescriptor = confidence > 0.8 ? 'high-quality' :
                           confidence > 0.6 ? 'good-quality' : 'moderate-quality';
  
  return `${qualityDescriptor} extraction of ${target} from the mixed audio source`;
};
