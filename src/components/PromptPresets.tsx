'use client';

import { motion } from 'framer-motion';

interface PromptPresetsProps {
  onPresetSelect: (preset: string) => void;
}

const presets = [
  {
    label: '🌌 Ambient Chill',
    value: 'ambient chill atmosphere with ethereal pads and soft textures',
    gradient: 'from-cyan-500 to-blue-500'
  },
  {
    label: '🔥 Drum & Bass Energy',
    value: 'energetic drum and bass with driving rhythm and powerful bass',
    gradient: 'from-orange-500 to-red-500'
  },
  {
    label: '🎬 Cinematic Score',
    value: 'cinematic orchestral score with epic strings and dramatic atmosphere',
    gradient: 'from-purple-500 to-pink-500'
  }
];

export default function PromptPresets({ onPresetSelect }: PromptPresetsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {presets.map((preset, index) => (
        <motion.button
          key={preset.value}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onPresetSelect(preset.value)}
          className={`px-6 py-4 rounded-2xl bg-gradient-to-r ${preset.gradient} text-white font-medium hover:shadow-lg transition-all duration-200`}
        >
          {preset.label}
        </motion.button>
      ))}
    </div>
  );
}


