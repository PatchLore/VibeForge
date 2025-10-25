'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import LivePlayer from '@/components/LivePlayer';

const channels = [
  { id: 'melancholy', label: 'Melancholy', description: 'Deep emotional soundscapes for introspection' },
  { id: 'euphoric', label: 'Euphoric', description: 'Uplifting beats for ecstatic moments' },
  { id: 'nostalgic', label: 'Nostalgic', description: 'Wistful sounds for reminiscing' }
];

export default function LivePage() {
  const [activeChannel, setActiveChannel] = useState('melancholy');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-pink-900 to-cyan-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <motion.div
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 40% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)'
            ]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute inset-0"
        />
        
        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => {
          // Use deterministic positioning based on index to avoid hydration mismatch
          const left = ((i * 7 + 13) % 100);
          const top = ((i * 11 + 17) % 100);
          
          return (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-blue-400/30 rounded-full"
              animate={{
                x: [0, 100, 0],
                y: [0, -100, 0],
                opacity: [0, 1, 0],
                scale: [0, 1, 0]
              }}
              transition={{
                duration: 15 + i * 2,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeInOut"
              }}
              style={{
                left: `${left}%`,
                top: `${top}%`
              }}
            />
          );
        })}
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="p-6"
        >
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <motion.a
              href="/"
              whileHover={{ scale: 1.05 }}
              className="text-2xl font-light text-white"
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400">
                Soundswoop
              </span>
            </motion.a>
            
            <motion.a
              href="/"
              whileHover={{ scale: 1.05 }}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
            >
              ← Back to Home
            </motion.a>
          </div>
        </motion.div>

        {/* Hero Section */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-4xl w-full text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="mb-12"
            >
              <h1 className="text-6xl md:text-7xl font-light text-white mb-6">
                Infinite
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400">
                  Vibes Stream
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto">
                Endless AI-Generated Emotional Soundscapes
              </p>
            </motion.div>

            {/* Channel Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mb-12"
            >
              <div className="flex flex-wrap justify-center gap-4">
                {channels.map((channel) => (
                  <motion.button
                    key={channel.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveChannel(channel.id)}
                    className={`px-6 py-3 rounded-2xl border transition-all ${
                      activeChannel === channel.id
                        ? 'bg-blue-500 border-blue-400 text-white'
                        : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-medium">{channel.label}</div>
                      <div className="text-sm opacity-80">{channel.description}</div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Live Player */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20"
            >
              <LivePlayer channel={activeChannel} />
            </motion.div>

            {/* Status */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="mt-8 flex items-center justify-center space-x-4 text-gray-400"
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Live</span>
              </div>
              <div className="w-px h-4 bg-gray-600"></div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>24/7 Streaming</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
