// 🚨 Used by Trending Vibes Page - Test any changes with /app page
// Last verified: 2025-01-27
// This component is used by:
// - /app/app/page.tsx (Trending Vibes)
// - /app/trending/page.tsx (Trending page)
// - TrendingVibes component
// Changes must maintain backward compatibility with existing track data structures
// 🖼️ Image Quality Fix (Feb 2025): uses /api/proxy-image for full-res delivery

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
// Using regular img instead of Next.js Image due to proxy URL
// Inline data URL fallback to avoid 403s and missing asset issues
const FALLBACK_IMG = "data:image/svg+xml;charset=UTF-8,"
  + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='900' viewBox='0 0 1600 900'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='#22003e'/>
          <stop offset='100%' stop-color='#4c007d'/>
        </linearGradient>
      </defs>
      <rect width='1600' height='900' fill='url(#g)'/>
      <g fill='none' stroke='rgba(255,255,255,0.25)'>
        <rect x='80' y='45' width='1440' height='810' rx='24'/>
      </g>
      <text x='50%' y='50%' fill='white' font-family='Arial, Helvetica, sans-serif' font-size='56' text-anchor='middle' dominant-baseline='middle'>Soundswoop Artwork</text>
      <text x='50%' y='58%' fill='rgba(255,255,255,0.75)' font-family='Arial, Helvetica, sans-serif' font-size='24' text-anchor='middle' dominant-baseline='middle'>16:9 Placeholder</text>
    </svg>`
  );
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
  const [isSharing, setIsSharing] = useState(false);

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

  const handleShareVibe = async () => {
    if (isSharing || !track.audio_url || !track.image_url) return;
    
    setIsSharing(true);
    try {
      // Use client-side video generation
      const videoBlob = await generateVideoSnippet(track.image_url, track.audio_url);
      
      if (videoBlob) {
        const url = window.URL.createObjectURL(videoBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `soundswoop-${track.title.replace(/\s+/g, '-').toLowerCase()}-15s.mp4`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to generate video snippet. Your browser may not support this feature.');
      }
    } catch (error) {
      console.error('Error sharing vibe:', error);
      alert('Failed to generate video snippet. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const generateVideoSnippet = async (imageUrl: string, audioUrl: string): Promise<Blob | null> => {
    return new Promise((resolve) => {
      try {
        // Create canvas for video frames
        const canvas = document.createElement('canvas');
        canvas.width = 1920;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        // Load and draw image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          // Draw image to fill canvas
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Add overlay text with track info
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.fillRect(0, canvas.height - 200, canvas.width, 200);
          ctx.fillStyle = 'white';
          ctx.font = 'bold 48px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(track.title || 'Soundswoop Vibe', canvas.width / 2, canvas.height - 120);
          ctx.font = '32px Arial';
          ctx.fillText(track.vibe || track.mood || track.prompt || '', canvas.width / 2, canvas.height - 60);

          // Load audio (use proxy endpoint if needed)
          const audio = new Audio();
          audio.crossOrigin = 'anonymous';
          const audioSrc = audioUrl.startsWith('http') ? `/api/proxy-audio?url=${encodeURIComponent(audioUrl)}` : audioUrl;
          audio.src = audioSrc;
          
          audio.onloadeddata = () => {
            // Set up MediaRecorder for video
            const stream = canvas.captureStream(30); // 30 FPS
            const audioContext = new AudioContext();
            const destination = audioContext.createMediaStreamDestination();
            
            // Create audio source and connect to destination
            const audioSource = audioContext.createMediaElementSource(audio);
            audioSource.connect(destination);
            audioSource.connect(audioContext.destination);

            // Combine video and audio streams
            const combinedStream = new MediaStream([
              ...stream.getVideoTracks(),
              ...destination.stream.getAudioTracks()
            ]);

            const mediaRecorder = new MediaRecorder(combinedStream, {
              mimeType: 'video/webm;codecs=vp8,opus'
            });

            const chunks: Blob[] = [];
            mediaRecorder.ondataavailable = (e) => {
              if (e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
              const blob = new Blob(chunks, { type: 'video/webm' });
              resolve(blob);
            };

            // Start recording
            mediaRecorder.start();
            audio.currentTime = 0;
            audio.play();

            // Stop after 15 seconds
            setTimeout(() => {
              mediaRecorder.stop();
              audio.pause();
              audio.currentTime = 0;
              stream.getTracks().forEach(track => track.stop());
            }, 15000);
          };

          audio.onerror = () => resolve(null);
        };

        img.onerror = () => resolve(null);
        img.src = imageUrl.startsWith('http') ? `/api/proxy-image?url=${encodeURIComponent(imageUrl)}` : imageUrl;
      } catch (error) {
        console.error('Video generation error:', error);
        resolve(null);
      }
    });
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

            {/* Full quality image display */}
            <div
              className="flex justify-center items-center overflow-visible p-6"
              style={{ maxWidth: "100%", width: "100%" }}
            >
              {/* Debug render log */}
              {(() => { try { console.log("🎨 Rendering:", track.title, track.image_url); } catch(_) {} return null; })()}
              <img
                src={track.image_url ? `/api/proxy-image?url=${encodeURIComponent(track.image_url)}` : FALLBACK_IMG}
                alt={track.title}
                className="w-auto h-auto max-w-none max-h-none object-contain rounded-xl shadow-2xl"
                style={{
                  imageRendering: "crisp-edges",
                }}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  if (img.dataset.fallbackApplied === '1') return;
                  img.src = FALLBACK_IMG;
                  img.dataset.fallbackApplied = '1';
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
                // Use raw image_url (base64 or direct URL) without proxy for download
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

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLike}
            disabled={isLiking}
            className="px-4 py-2 bg-card border border-primary rounded-full 
                       text-primary hover:bg-primary hover:text-white 
                       transition-all duration-300 font-medium text-sm"
          >
            <span className="text-lg">{isLiking ? '⏳' : '❤️'}</span>
            <span className="ml-2">
              {likes} {likes === 1 ? 'like' : 'likes'}
            </span>
          </motion.button>
          
          {track.audio_url && track.image_url && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShareVibe}
              disabled={isSharing}
              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-cyan-500 rounded-full 
                         text-white hover:opacity-90 
                         transition-all duration-300 font-medium text-sm"
            >
              <span className="text-lg">{isSharing ? '⏳' : '📤'}</span>
              <span className="ml-2">Share My Vibe</span>
            </motion.button>
          )}
        </div>
      </div>

    </motion.div>
  );
}

