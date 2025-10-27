'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import UnifiedPlayer from '@/components/UnifiedPlayer';
import Hero from '@/components/Hero';
import BenefitsSection from '@/components/BenefitsSection';
import Footer from '@/components/Footer';
import Visualizer from '@/components/Visualizer';
import TrendingVibes from '@/components/TrendingVibes';
import TrackCard from '@/components/TrackCard';
import FAQ from '@/components/FAQ';
import FeatureHighlights from '@/components/FeatureHighlights';
import PromptPresets from '@/components/PromptPresets';
import GenerationProgress from '@/components/GenerationProgress';
import FeedbackButtons from '@/components/FeedbackButtons';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SavedTrack } from '@/types';
import { getRandomVibe } from '@/lib/promptExpansion';
import { track } from '@vercel/analytics';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';

const quickVibes = [
  { label: 'Heartbroken', value: 'heartbroken in the city' },
  { label: 'Infinite', value: 'feeling infinite and boundless' },
  { label: 'Nostalgic', value: 'nostalgic piano melody with warm strings and gentle reverb' },
  { label: 'Rebellious', value: 'rebellious and defiant' },
  { label: 'Euphoric', value: 'euphoric and ecstatic' },
  { label: 'Melancholy', value: 'melancholy and introspective' }
];

export default function Home() {
  const { user } = useAuth();
  const [vibe, setVibe] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showTrending, setShowTrending] = useState(false);
  const [savedTracks, setSavedTracks] = useLocalStorage<SavedTrack[]>('vibe-forge-tracks', []);
  const [isClient, setIsClient] = useState(false);
  const [audioSource, setAudioSource] = useState<'generated' | 'fallback' | null>(null);
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedPrompts, setExpandedPrompts] = useState<{ music: string; art: string } | null>(null);
  const [currentTrackTitle, setCurrentTrackTitle] = useState<string>('');

  const handleVibeSelect = (vibeValue: string) => {
    setVibe(vibeValue);
    track('Preset Used', { preset: vibeValue });
  };

  const handleInspireMe = () => {
    const randomVibe = getRandomVibe();
    setVibe(randomVibe);
    track('Inspire Me Clicked');
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleGenerate = async () => {
    if (!vibe.trim()) return;
    
    setIsGenerating(true);
    setError(null); // Clear any previous errors
    
    // Track analytics event
    track('Track Generated', { vibe });
    
    try {
      // Get the current session token for server-side authentication
      if (!supabase) {
        setError('Authentication service unavailable');
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setError('Please sign in to generate music');
        return;
      }

      // Generate SoundPainting (music + image) via the new API
      const response = await fetch('/api/music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ prompt: vibe, userId: user?.id }),
      });

      const data = await response.json();
      
      // Handle professional error messages
      if (data.success === false) {
        // Handle credit errors specifically
        if (response.status === 403 && data.message?.includes('credits')) {
          setError(`💎 ${data.message} Visit the pricing page to get more credits.`);
        } else {
          // Show error message in UI instead of alert
          setError(data.message);
        }
        return;
      }

      // Update credits if provided
      if (data.remainingCredits !== undefined) {
        setRemainingCredits(data.remainingCredits);
      }

      // Set the generated title
      if (data.title) {
        setCurrentTrackTitle(data.title);
      }
      
      if (!response.ok) {
        throw new Error('Failed to generate SoundPainting');
      }

      // Handle the new response format with taskId
      if (data.taskId) {
        // Store expanded prompts for display
        if (data.expandedPrompts) {
          setExpandedPrompts(data.expandedPrompts);
          console.log('🎵 Music Prompt:', data.expandedPrompts.music);
          console.log('🎨 Art Prompt:', data.expandedPrompts.art);
        }
        
        // Show message that generation has started
        setError(`🎶 Composing your SoundPainting… this usually takes about 1–2 minutes.`);
        
        // Start polling for completion
        pollForCompletion(data.taskId);
        return;
      }
      
      setAudioUrl(data.audioUrl);
      setVideoUrl(data.imageUrl); // Use imageUrl as videoUrl for display
      setAudioSource(data.provider === 'suno-api' ? 'generated' : 'fallback');
      
      // Save to local storage with SoundPainting data
      const newTrack: SavedTrack = {
        id: Date.now().toString(),
        title: data.title || 'Generated Track',
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
      // Don't set any audio URLs or sources on error
      setAudioUrl(null);
      setVideoUrl(null);
      setAudioSource(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const pollForCompletion = async (taskId: string) => {
    const maxAttempts = 30; // Poll for up to 5 minutes (30 * 10 seconds)
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/status?taskId=${taskId}`);
        const json = await res.json();

        if (json.status === "SUCCESS") {
          // Generation completed successfully!
          setError("✅ Your SoundPainting is ready — press play to experience your vibe.");
          setAudioUrl(json.track.audioUrl);
          setVideoUrl(json.track.imageUrl);
          setAudioSource('generated');
          
          // Save to local storage
          const newTrack: SavedTrack = {
            id: Date.now().toString(),
            title: json.track.title || 'Generated Track',
            audioUrl: json.track.audioUrl,
            imageUrl: json.track.imageUrl,
            mood: vibe,
            generatedAt: new Date().toISOString(),
            duration: json.track.duration || 600,
            isFavorite: false
          };
          setSavedTracks(prev => [newTrack, ...prev.slice(0, 9)]);
          setIsGenerating(false);
          return;
        } else if (json.status === "PENDING") {
          console.log("⏳ Track still pending...");
        } else {
          setError('❌ Generation failed. Please try again.');
          setIsGenerating(false);
          return;
        }

        // Continue polling if still processing
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000); // Poll every 10 seconds
        } else {
          setError('⏰ Generation is taking longer than expected. Please try again.');
          setIsGenerating(false);
        }
      } catch (err) {
        console.error("💥 Error checking status:", err);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000);
        } else {
          setError('❌ Unable to check generation status. Please try again.');
          setIsGenerating(false);
        }
      }
    };

    // Start polling after 30 seconds
    setTimeout(checkStatus, 30000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-pink-900 to-cyan-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated gradient orb backgrounds */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="max-w-4xl w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-6xl font-bold text-white mb-4"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400">
              Create art that matches your music.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-2xl text-gray-400 mt-4"
          >
            Describe a vibe, and let AI compose your soundtrack.
          </motion.p>
          
          {/* Navigation */}
          <Navigation
            showHistory={showHistory}
            showTrending={showTrending}
            savedTracksCount={isClient ? savedTracks.length : 0}
            onShowHistory={() => {
              setShowHistory(true);
              setShowTrending(false);
            }}
            onShowTrending={() => {
              setShowTrending(true);
              setShowHistory(false);
            }}
            onShowGenerate={() => {
              setShowHistory(false);
              setShowTrending(false);
            }}
            externalCredits={remainingCredits}
          />
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
              <div className="flex items-center justify-between mb-4">
                <label className="block text-white text-lg">
                  Describe your current vibe or feeling…
                </label>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleInspireMe}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  🎲 Inspire Me
                </motion.button>
              </div>
              <textarea
                value={vibe}
                onChange={(e) => setVibe(e.target.value)}
                placeholder="Express your emotional state... (e.g., 'heartbroken in the city', 'feeling infinite and boundless')"
                className="w-full p-4 rounded-2xl bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
                rows={3}
              />
              
              {/* Display expanded prompts when generating */}
              {isGenerating && expandedPrompts && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 space-y-2 text-sm"
                >
                  <div className="bg-white/10 rounded-xl p-3 border border-white/20">
                    <div className="text-pink-400 font-medium mb-1">🎵 Generating:</div>
                    <div className="text-gray-300 italic">{expandedPrompts.music}</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 border border-white/20">
                    <div className="text-cyan-400 font-medium mb-1">🎨 Creating:</div>
                    <div className="text-gray-300 italic">{expandedPrompts.art}</div>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="mb-8">
              <p className="text-white text-lg mb-4">Or choose a preset:</p>
              <PromptPresets onPresetSelect={handleVibeSelect} />
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

            {/* V5 Model Note */}
            <p className="text-xs text-zinc-400 mt-2 text-center">
              Uses advanced AI for faster, high-quality generation.
            </p>

            {/* Error Message Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-red-500/20 border border-red-400/30 rounded-xl text-center"
              >
                <p className="text-red-200 text-sm mb-2">{error}</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGenerate}
                  className="px-4 py-2 bg-red-500/30 hover:bg-red-500/40 rounded-lg text-red-100 text-sm transition-colors"
                >
                  🔁 Try Again
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        ) : isGenerating ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-12"
          >
            <GenerationProgress />
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
                <UnifiedPlayer
                  audioUrl={audioUrl}
                  videoUrl={videoUrl}
                  vibe={vibe}
                  onNewGeneration={() => {
                    setAudioUrl(null);
                    setVideoUrl(null);
                    setVibe('');
                    setAudioSource(null);
                    setCurrentTrackTitle('');
                  }}
                  source={audioSource}
                  onCreditsUpdate={(credits) => setRemainingCredits(credits)}
                  trackTitle={currentTrackTitle}
                />
              )}
            </div>
            
            {/* Only show Visualizer if no image was generated */}
            {!videoUrl && (
              <div className="h-64 bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 overflow-hidden">
                <Visualizer />
              </div>
            )}
          </motion.div>
        )}
        
        {/* SEO Content - Only show when not generating or playing */}
        {!isGenerating && !audioUrl && !showHistory && !showTrending && (
          <>
            <FeatureHighlights />
            <FAQ />
          </>
        )}
        
        {/* No MiniPlayer needed - using UnifiedPlayer */}
      </div>
    </div>
  );
}