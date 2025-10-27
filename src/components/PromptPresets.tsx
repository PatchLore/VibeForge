'use client';

import { motion } from 'framer-motion';

interface PromptPresetsProps {
  onPresetSelect: (preset: string) => void;
}

const presets = [
  {
    label: '🌌 Ambient Chill',
    value: 'soft atmospheric pads and floating textures',
    gradient: 'from-cyan-500 to-blue-500'
  },
  {
    label: '🔥 Drum & Bass Energy',
    value: 'fast-paced liquid drum and bass rhythm',
    gradient: 'from-orange-500 to-red-500'
  },
  {
    label: '🎬 Cinematic Score',
    value: 'epic orchestral soundtrack with emotional build',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    label: '💭 Lo-Fi Daydream',
    value: 'nostalgic lo-fi beats with warm vinyl textures',
    gradient: 'from-yellow-500 to-orange-500'
  },
  {
    label: '🌅 Sunrise Trance',
    value: 'melodic trance with euphoric sunrise energy',
    gradient: 'from-pink-500 to-purple-500'
  },
  {
    label: '🩶 Dark Synthwave',
    value: 'retro 80s synthwave with neon shadows',
    gradient: 'from-gray-600 to-purple-600'
  },
  {
    label: '🌿 Organic Flow',
    value: 'acoustic ambient with natural instruments',
    gradient: 'from-green-500 to-teal-500'
  },
  {
    label: '🌌 Space Odyssey',
    value: 'cosmic ambient exploration through starlight',
    gradient: 'from-indigo-500 to-purple-500'
  }
];

export default function PromptPresets({ onPresetSelect }: PromptPresetsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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


