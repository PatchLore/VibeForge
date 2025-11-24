'use client';

import { motion } from 'framer-motion';
import { EMOTIONAL_PRESETS, EmotionPreset } from '@/data/emotionPresets';

interface PromptPresetsProps {
  onPresetSelect: (preset: EmotionPreset) => void;
}

export default function PromptPresets({ onPresetSelect }: PromptPresetsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {EMOTIONAL_PRESETS.map((preset, index) => (
        <motion.button
          key={preset.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onPresetSelect(preset)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl px-4 py-3 font-medium hover:opacity-90 transition"
        >
          {preset.label}
        </motion.button>
      ))}
    </div>
  );
}


