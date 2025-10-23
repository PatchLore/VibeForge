'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface LivePlayerProps {
  channel: string;
}

// No fallback audio - use empty playlists
const fallbackPlaylists = {
  melancholy: [],
  euphoric: [],
  nostalgic: []
};

export default function LivePlayer({ channel }: LivePlayerProps) {
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
  const fadeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const fallbackPlaylist = fallbackPlaylists[channel as keyof typeof fallbackPlaylists] || fallbackPlaylists.melancholy;
  const playlist = storedTracks.length > 0 ? storedTracks.map(track => track.audio_url) : fallbackPlaylist;

  // Fetch stored tracks from database
  const fetchStoredTracks = async () => {
    try {
      const response = await fetch('/api/tracks/random');
      const { track } = await response.json();
      
      if (track) {
        setStoredTracks([track]);
        setCurrentTrackInfo(track);
        console.log('Using stored track:', track.title);
      } else {
        console.log('No stored tracks, will generate new one');
      }
    } catch (error) {
      console.error('Error fetching stored tracks:', error);
    }
  };

  // Generate new track if no stored tracks
  const generateNewTrack = async () => {
    try {
      const channelPrompts = {
        melancholy: "deep emotional ambient soundscape for introspection and melancholy feelings",
        euphoric: "uplifting ambient music for ecstatic and euphoric moments",
        nostalgic: "nostalgic ambient soundscape with wistful and sentimental tones"
      };
      
      const prompt = channelPrompts[channel as keyof typeof channelPrompts] || channelPrompts.melancholy;
      
      const response = await fetch('/api/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      
      const data = await response.json();
      
      if (data.audioUrl) {
        const newTrack = {
          audio_url: data.audioUrl,
          title: data.title || 'Generated Track',
          prompt: data.prompt || prompt
        };
        setStoredTracks([newTrack]);
        setCurrentTrackInfo(newTrack);
        console.log('Generated new track:', newTrack.title);
      }
    } catch (error) {
      console.error('Error generating new track:', error);
    }
  };

  // Initialize track loading
  useEffect(() => {
    const initializeTracks = async () => {
      await fetchStoredTracks();
    };
    
    initializeTracks();
  }, [channel]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Set up Web Audio API for amplitude detection
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

    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleEnded = () => playNextTrack();
    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Monitor amplitude when playing
  useEffect(() => {
    if (isPlaying) {
      monitorAmplitude();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.src = playlist[currentTrack];
    audio.load();
  }, [currentTrack, playlist]);

  const monitorAmplitude = () => {
    if (!analyserRef.current || !isPlaying) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateAmplitude = () => {
      if (!analyserRef.current || !isPlaying) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      setAmplitude(average / 255);
      
      if (isPlaying) {
        animationRef.current = requestAnimationFrame(updateAmplitude);
      }
    };

    updateAmplitude();
  };

  const playNextTrack = () => {
    // If we have stored tracks, cycle through them
    if (storedTracks.length > 0) {
      const nextTrack = (currentTrack + 1) % storedTracks.length;
      setCurrentTrack(nextTrack);
      setCurrentTrackInfo(storedTracks[nextTrack]);
    } else {
      // If no stored tracks, just cycle through fallback playlist
      const nextTrack = (currentTrack + 1) % fallbackPlaylist.length;
      setCurrentTrack(nextTrack);
    }
  };

  const togglePlayPause = async () => {
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
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const getChannelTitle = () => {
    switch (channel) {
      case 'melancholy': return 'Deep Emotions';
      case 'euphoric': return 'Ecstatic Vibes';
      case 'nostalgic': return 'Wistful Memories';
      default: return 'Deep Emotions';
    }
  };

  const getChannelDescription = () => {
    switch (channel) {
      case 'melancholy': return 'Introspective soundscapes for deep feelings';
      case 'euphoric': return 'Uplifting beats for ecstatic moments';
      case 'nostalgic': return 'Wistful sounds for reminiscing';
      default: return 'Introspective soundscapes for deep feelings';
    }
  };

  return (
    <div className="space-y-8">
      <audio ref={audioRef} preload="metadata" />
      
      {/* Now Playing */}
      <div className="text-center">
        <h2 className="text-3xl font-light text-white mb-2">
          Now Playing: {getChannelTitle()}
        </h2>
        <p className="text-gray-300">{getChannelDescription()}</p>
      </div>

      {/* Visual Player */}
      <div className="flex justify-center">
        <div className="relative">
          {/* Outer Glow Ring */}
          <motion.div
            animate={{
              scale: isPlaying ? [1, 1.2, 1] : 1,
              opacity: isPlaying ? [0.4, 0.8, 0.4] : 0.2
            }}
            transition={{
              duration: 3,
              repeat: isPlaying ? Infinity : 0,
              ease: "easeInOut"
            }}
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, rgba(59, 130, 246, ${0.2 + amplitude * 0.5}) 0%, transparent 70%)`,
              filter: `blur(${15 + amplitude * 25}px)`,
              transform: 'scale(1.5)'
            }}
          />
          
          {/* Inner Glow Ring */}
          <motion.div
            animate={{
              scale: isPlaying ? [1, 1.1, 1] : 1,
              opacity: isPlaying ? [0.6, 1, 0.6] : 0.3
            }}
            transition={{
              duration: 2,
              repeat: isPlaying ? Infinity : 0,
              ease: "easeInOut"
            }}
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, rgba(139, 92, 246, ${0.4 + amplitude * 0.6}) 0%, transparent 60%)`,
              filter: `blur(${8 + amplitude * 15}px)`,
              transform: 'scale(1.2)'
            }}
          />
          
          {/* Main Player Button */}
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
          
          {/* Audio Wave Visualization */}
          {isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 bg-white/60 rounded-full"
                  animate={{
                    height: [10, 30 + amplitude * 40, 10],
                    opacity: [0.3, 0.8, 0.3]
                  }}
                  transition={{
                    duration: 1 + i * 0.1,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: "easeInOut"
                  }}
                  style={{
                    left: `${50 + Math.cos(i * Math.PI / 4) * 40}%`,
                    top: `${50 + Math.sin(i * Math.PI / 4) * 40}%`,
                    transform: `rotate(${i * 45}deg)`
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Track Info */}
      <div className="text-center space-y-2">
        <div className="text-white font-medium">
          {currentTrackInfo?.title || `Track ${currentTrack + 1} of ${playlist.length}`}
        </div>
        <div className="text-gray-400 text-sm">
          {currentTrackInfo?.prompt || `${channel.charAt(0).toUpperCase() + channel.slice(1)} Channel`}
        </div>
        {storedTracks.length > 0 && (
          <div className="text-blue-400 text-xs">
            🎵 AI Generated Track
          </div>
        )}
      </div>

      {/* Volume Control */}
      <div className="flex items-center justify-center space-x-4">
        <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.808L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-3.808a1 1 0 011.617.808zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
        </svg>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={handleVolumeChange}
          className="w-32 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
        />
        <span className="text-sm text-gray-300 w-8">{Math.round(volume * 100)}%</span>
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
