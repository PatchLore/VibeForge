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
    resolution?: string;
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
      className="relative bg-card backdrop-blur-lg border border-border rounded-2xl p-6 
                 transition-all duration-300 ease-out hover:border-primary 
                 hover:shadow-glow-lg hover:-translate-y-2 cursor-pointer 
                 overflow-hidden card-shine"
    >
      {/* Artwork */}
      {track.image_url ? (
        <div className="relative mb-4">
          {/* Artwork Container with Neon Glow */}
          <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-pink-500/20 to-cyan-500/20 p-1 shadow-lg">
            {/* Neon Glow Border */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/30 to-cyan-500/30 blur-sm -z-10" />
            
            <div className="relative">
              <img 
                src={track.image_url}
                alt={track.title}
                className="w-full h-auto rounded-xl object-cover aspect-video"
                loading="lazy"
                onError={(e) => {
                  console.error('❌ [TrackCard] Image failed to load:', track.image_url);
                }}
              />
              {track?.resolution === "2048x1152" && (
                <span className="absolute bottom-2 right-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                  🎨 2K Rendered
                </span>
              )}
            </div>
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
            className="mt-3 px-8 py-3 bg-gradient-primary text-white rounded-full 
                       shadow-glow hover:opacity-90 hover:shadow-glow-hover 
                       transition-all duration-300 font-semibold uppercase 
                       tracking-wider text-sm"
          >
            📥 Download
          </motion.button>
          
          {/* Attribution */}
          <p className="text-xs text-muted text-center mt-2">
            Generated with Soundswoop AI
          </p>
        </div>
      ) : (
        <div className="h-64 w-full rounded-xl bg-gradient-to-tr from-accent/20 to-primary/20
                        flex items-center justify-center text-muted text-sm italic mb-4">
          No Image
        </div>
      )}

      {/* Audio Player */}
      <div className="space-y-3">
        {/* Native HTML5 Audio Player */}
        {track.audio_url && (
          <div className="bg-card backdrop-blur-lg border-2 border-border rounded-xl p-2 mt-3">
            <audio
              controls
              preload="none"
              src={`/api/proxy-audio?url=${encodeURIComponent(track.audio_url)}`}
              className="w-full bg-card rounded-xl shadow-glow accent-primary
                         [&::-webkit-media-controls-panel]:bg-card
                         [&::-webkit-media-controls-play-button]:text-primary"
              onError={(e) => {
                console.error('❌ [TrackCard] Audio playback error:', track.audio_url);
              }}
            />
          </div>
        )}

        {/* Track Info */}
        <div className="flex items-center justify-between text-sm text-muted">
          <div className="flex items-center space-x-2">
            <span>🎵🎨 Soundswoop</span>
            {track.mood && (
              <span className="px-2 py-1 bg-card rounded-full text-xs">
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
            className="px-6 py-2 bg-card border border-primary rounded-full 
                       text-primary hover:bg-primary hover:text-white 
                       transition-all duration-300 font-medium"
          >
            <span className="text-lg">{isLiking ? '⏳' : '❤️'}</span>
            <span className="text-sm ml-2">
              {likes} {likes === 1 ? 'like' : 'likes'}
            </span>
          </motion.button>
        </div>
      </div>

    </motion.div>
  );
}

