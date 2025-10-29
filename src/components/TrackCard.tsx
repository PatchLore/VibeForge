'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
// Using regular img instead of Next.js Image due to proxy URL
const FALLBACK_IMG = "/images/placeholders/track-fallback-16x9.jpg";
import PromptReveal from './PromptReveal';

interface TrackCardProps {
  track: {
    id: string;
    title: string;
    prompt: string;
    extended_prompt?: string;
    extended_prompt_image?: string;
    audio_url: string;
    image_url?: string;
    vibe?: string; // preferred field name
    mood?: string; // legacy fallback
    summary?: string;
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

  const handlePlay = (id: string) => {
    try {
      const audios = document.querySelectorAll<HTMLAudioElement>('audio[data-id]');
      audios.forEach(a => {
        if (a.dataset.id !== id) a.pause();
      });
    } catch (e) {
      // no-op
    }
  };

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
      className="relative rounded-2xl p-4 border border-pink-500/10 bg-gradient-to-br from-[#22003e] to-[#4c007d] shadow-lg hover:scale-[1.02] hover:shadow-pink-500/20 transition-all duration-300 min-h-[380px]"
    >
      {/* Title */}
      <h3 className="text-base font-semibold text-white mb-1 truncate">{track.title}</h3>
      {/* Mood/Vibe */}
      <p className="text-xs italic text-pink-300 mb-2 truncate">Mood: {track.vibe || track.mood || track.prompt || '—'}</p>
      {/* Artwork */}
      <div className="relative mb-4">
          {/* Artwork Container with Neon Glow */}
          <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-pink-500/20 to-cyan-500/20 p-1 shadow-lg">
            {/* Neon Glow Border */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/30 to-cyan-500/30 blur-sm -z-10" />

            {/* Maintain true 16:9 ratio and full quality */}
            <div className="relative aspect-video overflow-hidden rounded-xl">
              <img
                src={track.image_url ? `/api/proxy-audio?url=${encodeURIComponent(track.image_url)}` : FALLBACK_IMG}
                alt={track.title}
                className="w-full h-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  console.error('❌ [TrackCard] Image failed to load:', track.image_url);
                  (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
                }}
              />
              {track?.resolution === "2048x1152" && (
                <span className="absolute bottom-2 right-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                  🎨 2K Rendered
                </span>
              )}
            </div>
          </div>
          {!track.image_url && (
            <span className="absolute top-2 left-2 text-[11px] text-pink-300 bg-black/30 rounded px-2 py-0.5">Image processing…</span>
          )}

          {/* Download Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (track.image_url) {
                const link = document.createElement('a');
                link.href = `/api/proxy-audio?url=${encodeURIComponent(track.image_url)}`;
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

      {/* Audio Player */}
      <div className="space-y-3">
        {/* Native HTML5 Audio Player */}
        {track.audio_url && (
          <div className="bg-card backdrop-blur-lg border-2 border-border rounded-xl p-2 mt-3">
            <audio
              controls
              data-id={track.id}
              preload="none"
              src={`/api/proxy-audio?url=${encodeURIComponent(track.audio_url)}`}
              className="w-full bg-card rounded-xl shadow-glow accent-primary
                         [&::-webkit-media-controls-panel]:bg-card
                         [&::-webkit-media-controls-play-button]:text-primary"
              onPlay={() => handlePlay(track.id)}
              onError={(e) => {
                console.error('❌ [TrackCard] Audio playback error:', track.audio_url);
              }}
            />
          </div>
        )}

        {/* Summary */}
        <p className="text-sm text-gray-300 line-clamp-2 min-h-[2.5rem]">{track.summary || 'Generated with Soundswoop AI'}</p>

        {/* Prompts toggle */}
        <PromptReveal musicPrompt={track.extended_prompt} imagePrompt={track.extended_prompt_image} />

        {/* Track Info */}
        <div className="flex items-center justify-between text-sm text-muted">
          <div className="flex items-center space-x-2">
            <span>🎵🎨 Soundswoop</span>
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

