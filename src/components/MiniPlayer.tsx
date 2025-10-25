'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MiniPlayerProps {
  audioUrl: string | null;
  trackTitle?: string;
}

export default function MiniPlayer({ audioUrl, trackTitle }: MiniPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!audioUrl) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900/95 via-pink-900/95 to-cyan-900/95 backdrop-blur-xl border-t border-white/20 p-4"
      >
        <audio ref={audioRef} src={audioUrl} loop />
        
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          {/* Play/Pause Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={togglePlayPause}
            className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 flex items-center justify-center text-white shadow-lg"
          >
            {isPlaying ? '⏸' : '▶'}
          </motion.button>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">
              {trackTitle || 'Generated Track'}
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>{formatTime(currentTime)}</span>
              <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-pink-500 to-cyan-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentTime / duration) * 100}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Waveform Indicator */}
          <div className="flex items-center gap-1 h-8">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-gradient-to-t from-pink-500 to-cyan-500 rounded-full"
                animate={{
                  height: isPlaying ? ['20%', '80%', '20%'] : '20%',
                }}
                transition={{
                  duration: 0.5,
                  repeat: isPlaying ? Infinity : 0,
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

