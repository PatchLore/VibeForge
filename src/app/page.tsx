'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/app');
    }
  }, [user, loading, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-pink-900 to-cyan-900 flex items-center justify-center">
        <div className="animate-pulse text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Don't render marketing content if user is logged in (will redirect)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-pink-900 to-cyan-900">
      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-md border-b border-white/10 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent">
            SoundSwoop
          </div>
          <div className="flex gap-4">
            <Link 
              href="/auth/login" 
              className="px-4 py-2 rounded-xl text-white hover:bg-white/10 transition-all"
            >
              Login
            </Link>
            <Link 
              href="/auth/signup" 
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-cyan-500 text-white hover:from-pink-600 hover:to-cyan-600 transition-all"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center text-center px-4">
        <div className="max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-5xl md:text-7xl font-bold text-white mb-6"
          >
            Transform Your Emotions into 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400"> Soundscapes</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-xl md:text-2xl text-white/80 mb-12 max-w-2xl mx-auto"
          >
            Create personalized music and visuals from your feelings with AI-powered generation
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link
              href="/auth/signup"
              className="inline-block bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 text-white font-semibold text-lg px-8 py-6 rounded-full hover:opacity-90 transition-opacity shadow-xl"
            >
              🎵 Start Creating Free
            </Link>
            
            <Link
              href="/auth/login"
              className="inline-block px-8 py-6 rounded-full border-2 border-white/30 text-white hover:border-white/50 hover:bg-white/10 transition-all"
            >
              Sign In
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="mt-8 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 max-w-md mx-auto"
          >
            <p className="text-sm text-white/80">
              ✨ <span className="text-white font-semibold">36 free credits</span> included with every new account
            </p>
            <p className="text-xs text-white/60 mt-1">
              No credit card required • Start creating immediately
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-white text-center mb-16"
          >
            What You Get
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
            >
              <div className="text-4xl mb-4">🎵</div>
              <h3 className="text-xl font-semibold text-white mb-3">AI Music Generation</h3>
              <p className="text-white/70">
                Create unique soundscapes inspired by your emotions using advanced AI
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
            >
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-xl font-semibold text-white mb-3">Visual Art</h3>
              <p className="text-white/70">
                Generate stunning visuals that match your music and mood
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
            >
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-white mb-3">Your Library</h3>
              <p className="text-white/70">
                Save and manage all your creations in your personal library
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true }}
        className="text-center py-20 px-4"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Create Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400">Soundscape</span>?
          </h2>
          <p className="text-xl text-white/70 mb-12 max-w-2xl mx-auto">
            Join thousands of creators who are already transforming their emotions into music and art. 
            Start with 36 free credits - no credit card required.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              href="/auth/signup"
              className="inline-block bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 text-white font-semibold text-lg px-8 py-6 rounded-full hover:opacity-90 transition-opacity shadow-xl"
            >
              🎵 Start Creating Free
            </Link>
            
            <Link
              href="/auth/login"
              className="inline-block px-8 py-6 rounded-full border-2 border-white/30 text-white hover:border-white/50 hover:bg-white/10 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-md border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white/60">
            <p>© 2024 SoundSwoop. Create emotional soundscapes with AI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
