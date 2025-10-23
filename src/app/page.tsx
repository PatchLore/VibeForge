'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Player from '@/components/Player';
import Visualizer from '@/components/Visualizer';
import TrendingVibes from '@/components/TrendingVibes';
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
      // Generate both audio and video simultaneously
      const [audioResponse, videoResponse] = await Promise.all([
        fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ vibe }),
        }),
        fetch('/api/visual', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ vibe }),
        })
      ]);

      if (!audioResponse.ok) {
        throw new Error('Failed to generate audio');
      }

      const audioData = await audioResponse.json();
      const videoData = await videoResponse.json();
      
      setAudioUrl(audioData.audioUrl);
      setVideoUrl(videoData.visualUrl);
      setAudioSource(audioData.source || 'fallback');
      
      // Save to local storage
      const newTrack: SavedTrack = {
        id: Date.now().toString(),
        audioUrl: audioData.audioUrl,
        mood: vibe,
        generatedAt: new Date().toISOString(),
        duration: audioData.duration || 600,
        isFavorite: false
      };
      setSavedTracks(prev => [newTrack, ...prev.slice(0, 9)]); // Keep only last 10 tracks
    } catch (error) {
      console.error('Error generating vibe:', error);
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
              <div className="grid gap-4">
                {savedTracks.map((track, index) => (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-white font-medium mb-2">{track.mood}</h3>
                        <p className="text-gray-300 text-sm">
                          {new Date(track.generatedAt).toLocaleDateString()} • {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
          </p>
        </div>
                      <div className="flex space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setAudioUrl(track.audioUrl);
                            setShowHistory(false);
                          }}
                          className="p-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setSavedTracks(prev => prev.filter(t => t.id !== track.id));
                          }}
                          className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </motion.button>
                      </div>
                    </div>
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