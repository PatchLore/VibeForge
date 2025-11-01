'use client';

import { motion } from 'framer-motion';

interface GenerationProgressProps {
  expandedPrompts?: { music?: string; image?: string };
}

export default function GenerationProgress({ expandedPrompts }: GenerationProgressProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      {/* Animated waveform */}
      <div className="flex items-end gap-2 h-16">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="w-3 bg-gradient-to-t from-pink-500 via-purple-500 to-cyan-500 rounded-full"
            animate={{
              height: ['20%', '100%', '20%'],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.1,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Pulsing glow circle */}
      <motion.div
        className="relative"
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div className="w-24 h-24 rounded-full bg-gradient-to-r from-pink-500/20 to-cyan-500/20 blur-xl" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-cyan-500" />
        </div>
      </motion.div>

      {/* Loading text */}
      <motion.div
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="text-center"
      >
        <p className="text-white text-lg font-medium">
          🎵 Composing your SoundPainting...
        </p>
        <p className="text-gray-400 text-sm mt-2">
          This usually takes about 1–2 minutes
        </p>
      </motion.div>

      {/* Enriched Prompts Display */}
      {expandedPrompts && (expandedPrompts.music || expandedPrompts.image) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-8 w-full max-w-2xl"
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 space-y-4">
            {expandedPrompts.music && (
              <div>
                <p className="text-pink-400 text-sm font-semibold mb-2">🎵 Music Prompt:</p>
                <p className="text-white/90 text-sm">{expandedPrompts.music}</p>
              </div>
            )}
            {expandedPrompts.image && (
              <div>
                <p className="text-cyan-400 text-sm font-semibold mb-2">🖼️ Image Prompt:</p>
                <p className="text-white/90 text-sm">{expandedPrompts.image}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}


