'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import TrackCard from '@/components/TrackCard';
import { useAuth } from '@/hooks/useAuth';

interface Track {
  id: string;
  title: string;
  prompt: string;
  extended_prompt?: string;
  extended_prompt_image?: string;
  audio_url: string;
  image_url?: string;
  vibe?: string;
  mood?: string;
  summary?: string;
  likes?: number;
  duration: number;
  created_at: string;
  resolution?: string;
}

export default function TrendingPage() {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrendingTracks();
  }, []);

  const fetchTrendingTracks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tracks/trending');
      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setTracks(data.tracks || []);
      }
    } catch (err) {
      console.error('Error fetching trending tracks:', err);
      setError('Failed to load trending tracks');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-pink-900 to-cyan-900">
      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-md border-b border-white/10 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent">
            SoundSwoop
          </Link>
          <div className="flex gap-4">
            <Link 
              href="/" 
              className="px-4 py-2 rounded-xl text-white hover:bg-white/10 transition-all"
            >
              Home
            </Link>
            {user ? (
              <Link 
                href="/app" 
                className="px-4 py-2 rounded-xl text-white hover:bg-white/10 transition-all"
              >
                Studio
              </Link>
            ) : (
              <Link 
                href="/auth/login" 
                className="px-4 py-2 rounded-xl text-white hover:bg-white/10 transition-all"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            🔥 Trending <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400">Vibes</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Discover the most loved tracks from our community. Each vibe is crafted with emotion and passion.
          </p>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 animate-pulse"
              >
                <div className="aspect-video bg-white/10 rounded-xl mb-4"></div>
                <div className="h-4 bg-white/10 rounded mb-2"></div>
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 max-w-md mx-auto">
              <p className="text-red-400 font-medium">{error}</p>
              <button
                onClick={fetchTrendingTracks}
                className="mt-4 px-6 py-2 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 hover:bg-red-500/30 transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Tracks Grid */}
        {!loading && !error && (
          <>
            {tracks.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 max-w-md mx-auto">
                  <p className="text-gray-300 text-lg">No trending tracks yet.</p>
                  <p className="text-gray-400 text-sm mt-2">Be the first to create something amazing!</p>
                  {!user && (
                    <Link
                      href="/auth/signup"
                      className="inline-block mt-6 px-6 py-3 bg-gradient-to-r from-pink-500 to-cyan-500 text-white rounded-xl hover:opacity-90 transition-opacity"
                    >
                      Get Started
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tracks.map((track, index) => (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <TrackCard track={track} />
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-md border-t border-white/10 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white/60">
            <p>© 2025 SoundSwoop. Create emotional soundscapes with AI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

