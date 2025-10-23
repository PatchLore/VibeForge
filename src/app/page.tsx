'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Player from '@/components/Player';
import Visualizer from '@/components/Visualizer';
import TrendingVibes from '@/components/TrendingVibes';
import TrackCard from '@/components/TrackCard';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SavedTrack } from '@/types';

const quickVibes = [
  { label: 'Heartbroken', value: 'heartbroken in the city' },
  { label: 'Infinite', value: 'feeling infinite and boundless' },
  { label: 'Nostalgic', value: 'nostalgic piano melody with warm strings and gentle reverb' },
  { label: 'Rebellious', value: 'rebellious and defiant' },
  { label: 'Euphoric', value: 'euphoric and ecstatic' },
  { label: 'Melancholy', value: 'melancholy and introspective' }
];

export default function Home() {
  const [vibe, setVibe] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTrending, setShowTrending] = useState(false);
  const [savedTracks, setSavedTracks] = useLocalStorage<SavedTrack[]>('vibe-forge-tracks', []);
  const [isClient, setIsClient] = useState(false);
  const [audioSource, setAudioSource] = useState<'riffusion' | 'fallback' | null>(null);

  const handleVibeSelect = (vibeValue: string) => {
    setVibe(vibeValue);
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleGenerate = async () => {
    if (!vibe.trim()) return;
    
    setIsGenerating(true);
    try {
      // Generate SoundPainting (music + image) via the new API
      const response = await fetch('/api/music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: vibe }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate SoundPainting');
      }

      const data = await response.json();
      
      setAudioUrl(data.audioUrl);
      setVideoUrl(data.imageUrl); // Use imageUrl as videoUrl for display
      setAudioSource(data.provider === 'suno-api' ? 'riffusion' : 'fallback');
      
      // Save to local storage with SoundPainting data
      const newTrack: SavedTrack = {
        id: Date.now().toString(),
        audioUrl: data.audioUrl,
        imageUrl: data.imageUrl,
        mood: vibe,
        generatedAt: new Date().toISOString(),
        duration: data.duration || 600,
        isFavorite: false
      };
      setSavedTracks(prev => [newTrack, ...prev.slice(0, 9)]); // Keep only last 10 tracks
    } catch (error) {
      console.error('Error generating SoundPainting:', error);
      // For demo purposes, we'll use placeholder URLs
      const placeholderAudioUrl = '/audio/fallback/ambient-a.wav';
      const placeholderVideoUrl = '/videos/placeholder.html';
      
      setAudioUrl(placeholderAudioUrl);
      setVideoUrl(placeholderVideoUrl);
      setAudioSource('fallback');
      
      // Save placeholder to local storage
      const newTrack: SavedTrack = {
        id: Date.now().toString(),
        audioUrl: placeholderAudioUrl,
        mood: vibe,
        generatedAt: new Date().toISOString(),
        duration: 600,
        isFavorite: false
      };
      setSavedTracks(prev => [newTrack, ...prev.slice(0, 9)]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-pink-900 to-cyan-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-light text-white mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400">
              VibeForge
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Emotional Soundscape Generator
          </p>
          
          {/* Navigation */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setShowHistory(false);
                setShowTrending(false);
              }}
              className={`px-6 py-3 rounded-xl transition-all ${
                !showHistory && !showTrending
                  ? 'bg-gradient-to-r from-pink-500 to-cyan-500 text-white' 
                  : 'bg-white/20 text-gray-300 hover:bg-white/30'
              }`}
            >
              Generate New
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setShowTrending(true);
                setShowHistory(false);
              }}
              className={`px-6 py-3 rounded-xl transition-all ${
                showTrending
                  ? 'bg-gradient-to-r from-pink-500 to-cyan-500 text-white' 
                  : 'bg-white/20 text-gray-300 hover:bg-white/30'
              }`}
            >
              🔥 Trending Vibes
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setShowHistory(true);
                setShowTrending(false);
              }}
              className={`px-6 py-3 rounded-xl transition-all ${
                showHistory
                  ? 'bg-gradient-to-r from-pink-500 to-cyan-500 text-white' 
                  : 'bg-white/20 text-gray-300 hover:bg-white/30'
              }`}
            >
              My Tracks {isClient ? `(${savedTracks.length})` : '(0)'}
            </motion.button>
            <motion.a
              href="/live"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-cyan-500 text-white hover:from-pink-600 hover:to-cyan-600 transition-all"
            >
              🎧 Infinite Vibes
            </motion.a>
          </div>
        </motion.div>

        {/* Trending Vibes Section */}
        {showTrending && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <TrendingVibes onVibeSelect={handleVibeSelect} />
          </motion.div>
        )}

        {showHistory ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            {!isClient || savedTracks.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 text-center">
                <p className="text-gray-300 text-lg">No vibes yet. Forge your first emotional soundscape!</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {savedTracks.map((track, index) => (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <TrackCard
                      track={{
                        id: track.id,
                        title: track.mood,
                        prompt: track.mood,
                        audio_url: track.audioUrl,
                        image_url: track.imageUrl,
                        duration: track.duration,
                        created_at: track.generatedAt,
                      }}
                      onDelete={(id) => {
                        setSavedTracks(prev => prev.filter(t => t.id !== id));
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : !showTrending && !audioUrl ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20"
          >
            <div className="mb-8">
              <label className="block text-white text-lg mb-4">
                Describe your current vibe or feeling…
              </label>
              <textarea
                value={vibe}
                onChange={(e) => setVibe(e.target.value)}
                placeholder="Express your emotional state... (e.g., 'heartbroken in the city', 'feeling infinite and boundless')"
                className="w-full p-4 rounded-2xl bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
                rows={3}
              />
            </div>

            <div className="mb-8">
              <p className="text-white text-lg mb-4">Or choose a quick vibe:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {quickVibes.map((vibeOption) => (
                  <motion.button
                    key={vibeOption.value}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleVibeSelect(vibeOption.value)}
                    className={`p-3 rounded-xl border transition-all duration-200 ${
                      vibe === vibeOption.value
                        ? 'bg-gradient-to-r from-pink-500 to-cyan-500 border-pink-400 text-white'
                        : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                    }`}
                  >
                    {vibeOption.label}
                  </motion.button>
                ))}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerate}
              disabled={!vibe.trim() || isGenerating}
              className={`w-full py-4 px-8 rounded-2xl font-semibold text-lg transition-all duration-200 ${
                !vibe.trim() || isGenerating
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600'
              } text-white ${isGenerating ? 'animate-pulse-glow' : ''}`}
              animate={isGenerating ? {
                boxShadow: [
                  '0 0 20px rgba(236, 72, 153, 0.3)',
                  '0 0 40px rgba(236, 72, 153, 0.6)',
                  '0 0 20px rgba(236, 72, 153, 0.3)'
                ]
              } : {}}
              transition={{
                duration: 2,
                repeat: isGenerating ? Infinity : 0,
                ease: "easeInOut"
              }}
            >
              {isGenerating ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  Forging your vibe...
                </div>
              ) : (
                'Generate My Vibe'
              )}
            </motion.button>
          </motion.div>
        ) : showTrending ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <TrendingVibes onVibeSelect={handleVibeSelect} />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
              {audioUrl && (
                <Player
                  audioUrl={audioUrl}
                  videoUrl={videoUrl}
                  vibe={vibe}
                  isPlaying={isPlaying}
                  setIsPlaying={setIsPlaying}
                  onNewGeneration={() => {
                    setAudioUrl(null);
                    setVideoUrl(null);
                    setVibe('');
                    setAudioSource(null);
                  }}
                  source={audioSource}
                />
              )}
            </div>
            
            <div className="h-64 bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 overflow-hidden">
              <Visualizer isPlaying={isPlaying} />
            </div>
          </motion.div>
        )}
        </div>
    </div>
  );
}