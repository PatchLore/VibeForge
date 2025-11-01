"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const moodExamples = [
  "euphoric sunrise",
  "melancholic rain",
  "nostalgic memories",
  "energetic workout",
  "peaceful meditation",
  "mysterious midnight",
  "romantic sunset",
  "anxious cityscape",
];

export default function Hero() {
  const [currentMood, setCurrentMood] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMood((prev) => (prev + 1) % moodExamples.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-pink-900 to-cyan-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-600/30 via-transparent to-transparent animate-pulse"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-600/30 via-transparent to-transparent animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-cyan-600/20 animate-gradient-xy"></div>
      </div>

      {/* Painterly Background */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ duration: 2 }}
        className="absolute inset-0 bg-[url('/textures/painted-bg.jpg')] bg-cover bg-center opacity-20 mix-blend-lighten blur-[2px]"
      />

      {/* Floating Particles */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ duration: 3 }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]"
      />

      {/* Content */}
      <div className="relative z-10 px-6 max-w-3xl mx-auto">
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="hero-title font-bold tracking-tight text-white leading-tight mb-6"
        >
          AI Mood <span className="text-purple-400">Music</span>{" "}
          <span className="text-cyan-400">Studio</span>
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.9 }}
          className="text-lg text-white/70 mb-6"
        >
          Type how you feel — we'll turn your emotions into music and visuals.
        </motion.p>

        {/* Rotating Mood Examples */}
        <motion.div
          key={currentMood}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
          className="text-xl md:text-2xl font-semibold text-white/90 mb-8 min-h-[3rem] flex items-center justify-center"
        >
          <span className="text-purple-300">✨ </span>
          <span className="mx-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            {moodExamples[currentMood]}
          </span>
          <span className="text-cyan-300"> ✨</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.a
            href="/auth/signup"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 text-white font-semibold text-xl px-10 py-6 rounded-full hover:opacity-90 transition-opacity shadow-xl border-2 border-white/20"
          >
            🎵 Start Creating Free
          </motion.a>
          <motion.a
            href="/auth/login"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-white/70 hover:text-white transition-colors text-base px-6 py-3 rounded-full border border-white/30 hover:border-white/50 hover:bg-white/10"
          >
            Sign In →
          </motion.a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="mt-8 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 max-w-md mx-auto"
        >
          <p className="text-sm text-white/80">
            ✨ Get <span className="text-white font-semibold">36 free credits</span> when you sign up
          </p>
          <p className="text-xs text-white/60 mt-1">
            No credit card required • Start creating immediately
          </p>
        </motion.div>
      </div>

      {/* Subtle gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-[200px] bg-gradient-to-t from-[#0a0a15] to-transparent pointer-events-none" />
    </section>
  );
}
