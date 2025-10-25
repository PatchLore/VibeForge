'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';

interface OptimizedLivePlayerProps {
  channel: string;
}

// Simplified fallback playlists
const fallbackPlaylists = {
  melancholy: [],
  euphoric: [],
  nostalgic: []
};

export default function OptimizedLivePlayer({ channel }: OptimizedLivePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [amplitude, setAmplitude] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [storedTracks, setStoredTracks] = useState<any[]>([]);
  const [currentTrackInfo, setCurrentTrackInfo] = useState<any>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const isSwitchingRef = useRef<boolean>(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Memoize playlist to prevent unnecessary recalculations
  const playlist = useMemo(() => {
    return storedTracks.length > 0 
      ? storedTracks.map(track => track.audio_url) 
      : fallbackPlaylists[channel as keyof typeof fallbackPlaylists] || fallbackPlaylists.melancholy;
  }, [storedTracks, channel]);

  // Debounced track switching
  const debouncedPlayNextTrack = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      playNextTrack();
    }, 300); // 300ms debounce
  }, []);

  // Fetch stored tracks from database (only once on mount)
  const fetchStoredTracks = useCallback(async () => {
    try {
      const response = await fetch('/api/tracks/random');
      const { track } = await response.json();
      
      if (track) {
        setStoredTracks([track]);
        setCurrentTrackInfo(track);
        console.log('🎵 Using community track:', track.title);
      } else {
        console.log('🎵 No community tracks available');
      }
    } catch (error) {
      console.error('Error fetching stored tracks:', error);
    }
  }, []);

  // Initialize with community tracks
  useEffect(() => {
    fetchStoredTracks();
  }, [fetchStoredTracks]);

  // Optimized track switching with debouncing
  const playNextTrack = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || isSwitchingRef.current) return;

    // Check if we have any tracks to play
    if (storedTracks.length === 0 && playlist.length === 0) {
      console.log('No tracks available to play');
      return;
    }

    isSwitchingRef.current = true;
    
    try {
      // If we have stored tracks, cycle through them
      if (storedTracks.length > 0) {
        const nextTrack = (currentTrack + 1) % storedTracks.length;
        setCurrentTrack(nextTrack);
        setCurrentTrackInfo(storedTracks[nextTrack]);
      } else {
        // If no stored tracks, just cycle through fallback playlist
        const nextTrack = (currentTrack + 1) % playlist.length;
        setCurrentTrack(nextTrack);
      }

      // Wait for track to load, then play
      setTimeout(async () => {
        try {
          if (audioContextRef.current?.state === 'suspended') {
            await audioContextRef.current.resume();
          }
          await audio.play();
          setIsPlaying(true);
        } catch (error) {
          console.error('Error playing next track:', error);
          setIsPlaying(false);
        } finally {
          isSwitchingRef.current = false;
        }
      }, 500);
    } catch (error) {
      console.error('Error switching tracks:', error);
      isSwitchingRef.current = false;
    }
  }, [currentTrack, storedTracks.length, playlist.length]);

  // Optimized audio context setup (only once)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setupAudioContext = async () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContext.createMediaElementSource(audio);
        const analyser = audioContext.createAnalyser();
        
        analyser.fftSize = 256;
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
      } catch (error) {
        console.error('Error setting up audio context:', error);
      }
    };

    setupAudioContext();
  }, []);

  // Optimized amplitude monitoring (throttled)
  useEffect(() => {
    if (!isPlaying || !analyserRef.current) return;

    const monitorAmplitude = () => {
      if (!analyserRef.current || !isPlaying) return;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);

      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      const normalizedAmplitude = Math.min(average / 128, 1);
      
      setAmplitude(normalizedAmplitude);

      if (isPlaying) {
        animationRef.current = requestAnimationFrame(monitorAmplitude);
      }
    };

    monitorAmplitude();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  // Track change effect (throttled)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.src = playlist[currentTrack];
    audio.load();
  }, [currentTrack, playlist]);

  // Optimized play/pause toggle
  const togglePlayPause = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        if (audioContextRef.current?.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error toggling audio:', error);
      setIsPlaying(false);
    }
  }, [isPlaying]);

  // Optimized volume change
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);

  // Memoized channel title
  const getChannelTitle = useCallback(() => {
    switch (channel) {
      case 'melancholy': return 'Melancholy';
      case 'euphoric': return 'Euphoric';
      case 'nostalgic': return 'Nostalgic';
      default: return 'Introspective';
    }
  }, [channel]);

  // Memoized channel description
  const getChannelDescription = useCallback(() => {
    switch (channel) {
      case 'melancholy': return 'Deep emotional soundscapes for introspection';
      case 'euphoric': return 'Uplifting beats for ecstatic moments';
      case 'nostalgic': return 'Wistful sounds for reminiscing';
      default: return 'Introspective soundscapes for deep feelings';
    }
  }, [channel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-8">
      <audio 
        ref={audioRef} 
        preload="metadata" 
        onEnded={debouncedPlayNextTrack}
        onLoadStart={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
      />
      
      {/* Now Playing Overlay - Only show when track info is available */}
      {currentTrackInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-4 bg-black/50 rounded-xl p-4 border border-white/20 z-10"
        >
          <div className="text-white">
            <div className="text-sm text-gray-300 mb-1">Now Playing:</div>
            <div className="font-semibold text-lg">{currentTrackInfo.title}</div>
            <div className="text-sm text-gray-400">
              Vibe: {currentTrackInfo.mood || channel}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              🎧 Generated by Soundswoop Community
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Now Playing */}
      <div className="text-center">
        <h2 className="text-3xl font-light text-white mb-2">
          Now Playing: {getChannelTitle()}
        </h2>
        <p className="text-gray-300">{getChannelDescription()}</p>
      </div>

      {/* Simplified Player Controls */}
      <div className="flex flex-col items-center space-y-6">
        {/* Main Play Button */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={togglePlayPause}
            disabled={isLoading}
            className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all shadow-2xl ${
              isPlaying 
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-blue-500/50' 
                : 'bg-white/20 hover:bg-white/30'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{
              boxShadow: isPlaying 
                ? `0 0 ${20 + amplitude * 40}px rgba(59, 130, 246, ${0.5 + amplitude * 0.5})`
                : '0 0 20px rgba(255, 255, 255, 0.1)'
            }}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            ) : isPlaying ? (
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </motion.button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center space-x-4">
          <span className="text-gray-400 text-sm">Volume</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-gray-400 text-sm">{Math.round(volume * 100)}%</span>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="flex justify-center space-x-6 text-sm text-gray-400">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
          <span>{isPlaying ? 'Live' : 'Paused'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <span>24/7 Stream</span>
        </div>
      </div>
    </div>
  );
}
