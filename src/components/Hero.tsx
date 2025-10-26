"use client";

import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center overflow-hidden bg-gradient-to-b from-[#060510] via-[#0b0a18] to-[#100f24]">
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
          Turn Your <span className="text-purple-400">Vibe</span> Into{" "}
          <span className="text-cyan-400">Sound & Vision</span>
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.9 }}
          className="text-lg text-white/70 mb-8"
        >
          Describe a feeling or mood — Soundswoop transforms it into
          immersive music and artistic visuals within minutes.
        </motion.p>

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
            className="bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 text-white font-semibold text-lg px-8 py-6 rounded-full hover:opacity-90 transition-opacity shadow-xl"
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
