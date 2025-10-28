'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
// Using regular img instead of Next.js Image due to proxy URL

interface TrackCardProps {
  track: {
    id: string;
    title: string;
    prompt: string;
    audio_url: string;
    image_url?: string;
    mood?: string;
    likes?: number;
    duration: number;
    created_at: string;
  };
  onDelete?: (id: string) => void;
}

export default function TrackCard({ track, onDelete }: TrackCardProps) {
  const [likes, setLikes] = useState(track.likes || 0);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    try {
      const response = await fetch('/api/tracks/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: track.id })
      });
      
      if (response.ok) {
        const data = await response.json();
        setLikes(data.newLikes);
      }
    } catch (error) {
      console.error('Error liking track:', error);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900 rounded-2xl p-6 shadow-lg border border-white/10 hover:border-white/20 transition-all duration-300"
    >
      {/* Artwork */}
      {track.image_url && (
        <div className="relative mb-4">
          {/* Artwork Container with Neon Glow */}
          <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-pink-500/20 to-cyan-500/20 p-1 shadow-lg">
            {/* Neon Glow Border */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/30 to-cyan-500/30 blur-sm -z-10" />
            
            <img 
              src={`/api/proxy-audio?url=${encodeURIComponent(track.image_url)}`}
              alt={track.title}
              className="w-full h-64 object-cover rounded-lg transition-transform duration-300 hover:scale-105"
              onError={(e) => {
                console.error('❌ [TrackCard] Image failed to load:', track.image_url);
              }}
            />
          </div>
          
          {/* Download Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (track.image_url) {
                const link = document.createElement('a');
                link.href = track.image_url;
                link.download = `soundswoop-artwork-${track.id}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }
            }}
            className="mt-3 px-4 py-2 bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            📥 Download
          </motion.button>
          
          {/* Attribution */}
          <p className="text-xs text-gray-400 text-center mt-2">
            Generated with Soundswoop AI
          </p>
        </div>
      )}

      {/* Audio Player */}
      <div className="space-y-3">
        {/* Native HTML5 Audio Player */}
        {track.audio_url && (
          <audio
            controls
            preload="none"
            src={`/api/proxy-audio?url=${encodeURIComponent(track.audio_url)}`}
            className="w-full mt-2"
            onError={(e) => {
              console.error('❌ [TrackCard] Audio playback error:', track.audio_url);
            }}
          />
        )}

        {/* Track Info */}
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center space-x-2">
            <span>🎵🎨 Soundswoop</span>
            {track.mood && (
              <span className="px-2 py-1 bg-white/10 rounded-full text-xs">
                {track.mood}
              </span>
            )}
          </div>
          <span>{new Date(track.created_at).toLocaleDateString()}</span>
        </div>

        {/* Like Button */}
        <div className="flex items-center justify-center pt-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLike}
            disabled={isLiking}
            className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            <span className="text-lg">{isLiking ? '⏳' : '❤️'}</span>
            <span className="text-sm text-gray-300">
              {likes} {likes === 1 ? 'like' : 'likes'}
            </span>
          </motion.button>
        </div>
      </div>

    </motion.div>
  );
}

