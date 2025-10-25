interface ExpandedPrompts {
  musicPrompt: string;
  artPrompt: string;
}

// Lookup table for vibe adjectives and their musical/visual styles
const vibeStyles: Record<string, { musical: string[]; visual: string[] }> = {
  // Mood-based styles
  calm: {
    musical: ['ambient', 'soft pads', 'minimal percussion', 'gentle strings', 'warm tones'],
    visual: ['soft lighting', 'muted colors', 'peaceful scene', 'serene atmosphere', 'pastel tones']
  },
  energetic: {
    musical: ['electronic', 'driving rhythm', 'synth bass', 'dynamic beats', 'uplifting melody'],
    visual: ['vibrant colors', 'bold contrasts', 'dynamic motion', 'electric energy', 'high saturation']
  },
  dark: {
    musical: ['cinematic', 'minor tonality', 'deep bass', 'atmospheric pads', 'mysterious'],
    visual: ['low lighting', 'deep shadows', 'moody atmosphere', 'dramatic contrast', 'dark palette']
  },
  dreamy: {
    musical: ['ethereal pads', 'floating melody', 'reverb-soaked', 'ambient textures', 'synth layers'],
    visual: ['soft focus', 'glowing elements', 'pastel hues', 'dreamlike quality', 'luminous']
  },
  serene: {
    musical: ['meditative', 'nature sounds', 'acoustic', 'peaceful', 'zen-like'],
    visual: ['natural landscape', 'soft colors', 'calm water', 'gentle sky', 'harmonious composition']
  },
  nostalgic: {
    musical: ['warm analog', 'vintage synths', 'tape saturation', 'retro vibes', 'memory-evoking'],
    visual: ['vintage aesthetic', 'warm tones', 'nostalgic mood', 'retro colors', 'soft focus']
  },
  futuristic: {
    musical: ['digital textures', 'modern synths', 'tech-forward', 'evolving sounds', 'cutting-edge'],
    visual: ['cyber aesthetic', 'neon accents', 'digital landscape', 'high-tech', 'metallic tones']
  },
  romantic: {
    musical: ['expressive melody', 'strings', 'emotional', 'tender', 'sweeping'],
    visual: ['warm lighting', 'intimate scene', 'soft focus', 'romantic colors', 'captivating']
  },
  mysterious: {
    musical: ['atmospheric', 'cryptic', 'unsettling', 'layered textures', 'hidden meanings'],
    visual: ['shadow play', 'enigmatic', 'mysterious atmosphere', 'hidden details', 'intriguing']
  },
  euphoric: {
    musical: ['uplifting', 'celebratory', 'energetic', 'radiant melody', 'triumphant'],
    visual: ['bright colors', 'vibrant energy', 'joyful atmosphere', 'positive vibes', 'radiant']
  },
  melancholy: {
    musical: ['introspective', 'minor harmony', 'expressive', 'emotional depth', 'reflective'],
    visual: ['muted tones', 'contemplative mood', 'soft shadows', 'gentle colors', 'thoughtful']
  },
  cosmic: {
    musical: ['spacey textures', 'infinite pads', 'stellar sounds', 'expansive', 'galactic'],
    visual: ['nebula', 'starfield', 'cosmic colors', 'galactic scene', 'otherworldly']
  },
  urban: {
    musical: ['city sounds', 'rhythmic pulse', 'metropolitan vibe', 'street energy', 'contemporary'],
    visual: ['cityscape', 'urban landscape', 'architectural', 'street scene', 'metropolitan']
  },
  nature: {
    musical: ['organic textures', 'natural sounds', 'earthly', 'woodland', 'wildlife-inspired'],
    visual: ['natural landscape', 'forest scene', 'wilderness', 'earth tones', 'organic']
  },
  neon: {
    musical: ['cyberpunk', 'electric', '80s synth', 'retro-futuristic', 'vibrant'],
    visual: ['neon lighting', 'electric colors', 'cyber aesthetic', 'neon glow', 'night city']
  },
  cinematic: {
    musical: ['orchestral', 'epic', 'grand', 'movie-like', 'score-quality'],
    visual: ['film aesthetic', 'cinematic framing', 'dramatic lighting', 'epic scope', 'movie-quality']
  }
};

/**
 * Analyzes a vibe string and expands it into detailed music and art prompts
 */
export function generateExpandedPrompt(vibe: string): ExpandedPrompts {
  const lowerVibe = vibe.toLowerCase();
  
  // Detect keywords in the vibe
  const detectedStyles: { musical: string[]; visual: string[] } = {
    musical: [],
    visual: []
  };
  
  // Check against vibe styles lookup table
  for (const [keyword, styles] of Object.entries(vibeStyles)) {
    if (lowerVibe.includes(keyword)) {
      detectedStyles.musical.push(...styles.musical);
      detectedStyles.visual.push(...styles.visual);
    }
  }
  
  // If no specific styles detected, use general AI music generation
  if (detectedStyles.musical.length === 0) {
    detectedStyles.musical = ['AI-generated', 'creative', 'unique', 'innovative'];
    detectedStyles.visual = ['AI-generated', 'artistic', 'unique', 'stylized'];
  }
  
  // Generate music prompt
  const musicElements = detectedStyles.musical.slice(0, 4).join(', ');
  const musicPrompt = `ambient generative soundscape inspired by "${vibe}", featuring ${musicElements}, instrumental composition with evolving textures, professional production quality, immersive atmosphere, emotional depth, no vocals, designed for focus and relaxation`;
  
  // Generate art prompt
  const visualElements = detectedStyles.visual.slice(0, 4).join(', ');
  const artPrompt = `abstract digital art inspired by "${vibe}", featuring ${visualElements}, dynamic composition, vibrant yet harmonious colors, atmospheric lighting, ethereal mood, cinematic quality, high detail, evocative and immersive visual narrative`;
  
  return {
    musicPrompt,
    artPrompt
  };
}

/**
 * Get a random inspirational vibe suggestion
 */
export function getRandomVibe(): string {
  const inspirations = [
    'Luminous Serenity',
    'Digital Dystopia',
    'Ethereal Dawn',
    'Futuristic City Pulse',
    'Solar Drift',
    'Neon Dreams',
    'Cosmic Tranquility',
    'Urban Nightfall',
    'Mystical Forest',
    'Desert Mirage',
    'Ocean Depths',
    'Northern Lights',
    'Blade Runner Streets',
    'Meditation Chamber',
    'Starlight Symphony',
    'Electric Sunset',
    'Void Traveler',
    'Golden Hour Reverie',
    'Midnight Drive',
    'Quantum Flux'
  ];
  
  return inspirations[Math.floor(Math.random() * inspirations.length)];
}

