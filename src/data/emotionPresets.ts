export interface EmotionPreset {
  label: string;
  prompt: string;
}

export const EMOTIONAL_PRESETS: EmotionPreset[] = [
  { 
    label: "🌧 Heartbreak", 
    prompt: "a deep emotional heartbreak, soft rain, muted colours, vulnerable atmosphere" 
  },
  { 
    label: "🌤 Nostalgia", 
    prompt: "nostalgic warm memories, dreamy haze, soft vintage tones, calm atmosphere" 
  },
  { 
    label: "✨ Euphoria", 
    prompt: "bright euphoric energy, glowing lights, uplifting mood, vibrant atmosphere" 
  },
  { 
    label: "🌿 Calm", 
    prompt: "peaceful calm moment, soft natural light, tranquil minimal atmosphere" 
  },
  { 
    label: "🔥 Chaos", 
    prompt: "intense chaotic energy, dramatic contrast, dynamic motion, expressive atmosphere" 
  },
  { 
    label: "🌑 Melancholy", 
    prompt: "deep melancholy mood, dim lighting, emotional solitude, quiet sadness" 
  },
];

