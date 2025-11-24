'use client';

import React from 'react';
import { SelectedLoRA } from './LoraSelector';

export interface EmotionalPreset {
  name: string;
  prompt: string;
  loras: SelectedLoRA[];
  aspect: string;
}

export const PRESETS: EmotionalPreset[] = [
  {
    name: "Heartbreak 🌧",
    prompt: "Heartbroken in the city, neon reflections, emotional, cinematic mood",
    loras: [
      { id: "civitai:154918@173694", strength: 0.9 } // Inkdrawing
    ],
    aspect: "1:1"
  },
  {
    name: "Nostalgia 🌤",
    prompt: "Soft nostalgic memory, warm golden light, subtle watercolor texture",
    loras: [
      { id: "civitai:1200817@1352135", strength: 0.7 }
    ],
    aspect: "3:2"
  },
  {
    name: "Euphoria ✨",
    prompt: "Vibrant glowing surreal atmosphere, energetic swirling colours",
    loras: [],
    aspect: "16:9"
  },
  {
    name: "Calm 🌿",
    prompt: "Soft peaceful watercolor landscape, gentle brush strokes, serene",
    loras: [
      { id: "civitai:1200817@1352135", strength: 0.5 }
    ],
    aspect: "2:3"
  },
  {
    name: "Chaos 🔥",
    prompt: "Explosive chaotic emotional energy, aggressive colours, abstract shapes",
    loras: [
      { id: "civitai:122359@135867", strength: 1.3 }
    ],
    aspect: "1:1"
  },
  {
    name: "Melancholy 🌑",
    prompt: "A lonely figure in a rain-soaked night, muted palette, heavy emotion",
    loras: [
      { id: "civitai:154918@173694", strength: 1.0 }
    ],
    aspect: "9:16"
  }
];

interface EmotionalPresetsProps {
  onSelect: (preset: EmotionalPreset) => void;
}

export default function EmotionalPresets({ onSelect }: EmotionalPresetsProps) {
  return (
    <div>
      <label className="font-semibold text-white block mb-2">Emotional Presets</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => onSelect(preset)}
            className="px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-white/20 text-white hover:from-purple-600/50 hover:to-pink-600/50 transition-all text-sm font-medium"
          >
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  );
}


