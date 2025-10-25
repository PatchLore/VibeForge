'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function LivePage() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubscribed(true);
      setIsLoading(false);
    }, 1000);
  };

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

        {/* Coming Soon Hero Section */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-4xl w-full text-center">
            {/* Main Title */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="mb-12"
            >
              <h1 className="text-6xl md:text-7xl font-light text-white mb-6">
                🎧 Soundswoop
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400">
                  Infinite Radio
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                A 24/7 AI-powered stream of community-generated vibes — launching soon once the first 100 tracks are ready.
              </p>
            </motion.div>

            {/* Coming Soon Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/20 mb-12"
            >
              <div className="max-w-2xl mx-auto">
                {/* Progress Indicator */}
                <div className="mb-8">
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                    <span>Community Tracks</span>
                    <span>0 / 100</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "0%" }}
                      transition={{ duration: 1, delay: 0.6 }}
                      className="h-3 bg-gradient-to-r from-pink-500 to-cyan-500 rounded-full"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Help us reach 100 community tracks to unlock the radio!
                  </p>
                </div>

                {/* Coming Soon Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled
                  className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-pink-500/20 to-cyan-500/20 border border-pink-500/30 text-pink-300 font-semibold text-lg cursor-not-allowed opacity-75"
                >
                  Coming Soon 🚀
                </motion.button>
              </div>
            </motion.div>

            {/* Email Signup */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="max-w-md mx-auto"
            >
              {!isSubscribed ? (
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="text-gray-300 mb-4">
                    <h3 className="text-lg font-semibold mb-2">Get notified when we launch</h3>
                    <p className="text-sm text-gray-400">Be the first to experience Infinite Radio</p>
                  </div>
                  
                  <div className="flex gap-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/50"
                      required
                    />
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={isLoading}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-semibold hover:from-pink-600 hover:to-cyan-600 transition-all disabled:opacity-50"
                    >
                      {isLoading ? '...' : 'Notify'}
                    </motion.button>
                  </div>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center p-6 bg-green-500/10 border border-green-500/30 rounded-xl"
                >
                  <div className="text-green-400 text-lg font-semibold mb-2">✅ You're on the list!</div>
                  <p className="text-gray-300 text-sm">We'll notify you as soon as Infinite Radio launches.</p>
                </motion.div>
              )}
            </motion.div>

            {/* Features Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/10">
                <div className="text-3xl mb-3">🎵</div>
                <h3 className="text-lg font-semibold text-white mb-2">Community Tracks</h3>
                <p className="text-gray-400 text-sm">AI-generated music from the Soundswoop community</p>
              </div>
              
              <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/10">
                <div className="text-3xl mb-3">🌊</div>
                <h3 className="text-lg font-semibold text-white mb-2">24/7 Stream</h3>
                <p className="text-gray-400 text-sm">Never-ending flow of emotional soundscapes</p>
              </div>
              
              <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/10">
                <div className="text-3xl mb-3">🎧</div>
                <h3 className="text-lg font-semibold text-white mb-2">Live Discovery</h3>
                <p className="text-gray-400 text-sm">Discover new vibes as they're created</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
