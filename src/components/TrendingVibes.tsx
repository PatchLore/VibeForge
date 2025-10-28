'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import TrackCard from './TrackCard';

interface TrendingVibesProps {
  onVibeSelect: (vibe: string) => void;
}

interface RealTrack {
  id: string;
  title: string;
  audioUrl: string;
  imageUrl?: string;
  mood: string;
  generatedAt: string;
  duration: number;
  likes: number;
  userId?: string;
}

export default function TrendingVibes({ onVibeSelect }: TrendingVibesProps) {
  const [realTracks, setRealTracks] = useState<RealTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTrendingVibes = async () => {
    try {
      const response = await fetch('/api/tracks/popular');
      const data = await response.json();
      
      if (data.tracks && data.tracks.length > 0) {
        console.log(`✅ [TrendingVibes] Found ${data.tracks.length} real tracks`);
        setRealTracks(data.tracks);
      } else {
        console.warn("⚠️ [TrendingVibes] No real tracks found.");
        setRealTracks([]);
      }
    } catch (error) {
      console.error('Failed to fetch trending vibes:', error);
      setRealTracks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingVibes();
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-light text-text mb-2">
          <span className="text-transparent bg-clip-text bg-gradient-primary glow-text">
            🔥 Live Trending Vibes
          </span>
        </h3>
        <p className="text-accent uppercase tracking-widest text-sm">Popular emotional soundscapes people are forging</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="bg-card backdrop-blur-lg rounded-xl p-4 border border-border animate-pulse">
              <div className="h-8 bg-border rounded mb-3"></div>
              <div className="h-4 bg-border rounded mb-2"></div>
              <div className="h-4 bg-border rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {realTracks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {realTracks.map((track, index) => (
                <motion.div
                  key={`track-${track.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group"
                >
                  <TrackCard 
                    track={{
                      id: track.id,
                      title: track.title,
                      audio_url: track.audioUrl,
                      image_url: track.imageUrl,
                      prompt: track.mood,
                      created_at: track.generatedAt,
                      duration: track.duration,
                      likes: track.likes
                    }}
                    onDelete={() => {}}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted">No trending tracks yet. Be the first to generate one!</p>
            </div>
          )}
        </>
      )}

      {/* Refresh Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="text-center"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setIsLoading(true);
            fetchTrendingVibes();
          }}
          disabled={isLoading}
          className="px-6 py-3 bg-card border border-primary rounded-full 
                     text-primary hover:bg-primary hover:text-white 
                     transition-all duration-300 font-medium disabled:opacity-50"
        >
          {isLoading ? '🔄 Refreshing...' : '🎲 Refresh Vibes'}
        </motion.button>
      </motion.div>
    </div>
  );
}

