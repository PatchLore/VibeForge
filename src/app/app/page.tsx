'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import UnifiedPlayer from '@/components/UnifiedPlayer';
import Visualizer from '@/components/Visualizer';
import TrendingVibes from '@/components/TrendingVibes';
import TrackCard from '@/components/TrackCard';
import PromptPresets from '@/components/PromptPresets';
import GenerationProgress from '@/components/GenerationProgress';
import FeedbackButtons from '@/components/FeedbackButtons';
import { SavedTrack } from '@/types';
import { getRandomVibe } from '@/lib/promptExpansion';
import { track } from '@vercel/analytics';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AppPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [vibe, setVibe] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showTrending, setShowTrending] = useState(false);
  const [savedTracks, setSavedTracks] = useState<SavedTrack[]>([]);
  const [tracksLoading, setTracksLoading] = useState(true);
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

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchUserTracks();
    }
  }, [user]);

  const fetchUserTracks = async () => {
    try {
      setTracksLoading(true);
      const response = await fetch('/api/tracks/user');
      const data = await response.json();
      
      if (data.tracks) {
        // Convert Supabase tracks to SavedTrack format
        const convertedTracks: SavedTrack[] = data.tracks.map((track: any) => ({
          id: track.id,
          audioUrl: track.audio_url,
          imageUrl: track.image_url,
          mood: track.prompt || track.title,
          generatedAt: track.created_at,
          duration: track.duration || 600,
        }));
        setSavedTracks(convertedTracks);
      }
    } catch (error) {
      console.error('Error fetching user tracks:', error);
    } finally {
      setTracksLoading(false);
    }
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-pink-900 to-cyan-900 flex items-center justify-center">
        <div className="animate-pulse text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Don't render app content if user is not logged in (will redirect)
  if (!user) {
    return null;
  }

  const handleGenerate = async () => {
    if (!vibe.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    
    track('Track Generated', { vibe });
    
    try {
      if (!supabase) {
        setError('Authentication service unavailable');
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setError('Please sign in to generate music');
        return;
      }

      const response = await fetch('/api/music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ prompt: vibe, userId: user?.id }),
      });

      const data = await response.json();
      
      if (data.success === false) {
        if (response.status === 403 && data.message?.includes('credits')) {
          setError(`💎 ${data.message} Visit the pricing page to get more credits.`);
        } else {
          setError(data.message);
        }
        return;
      }

      if (data.remainingCredits !== undefined) {
        setRemainingCredits(data.remainingCredits);
      }

      if (data.title) {
        setCurrentTrackTitle(data.title);
      }
      
      if (!response.ok) {
        throw new Error('Failed to generate SoundPainting');
      }

      if (data.expandedPrompts) {
        setExpandedPrompts(data.expandedPrompts);
      }

      const taskId = data.taskId;
      if (taskId) {
        pollForCompletion(taskId);
      } else {
        if (data.audioUrl) {
          setAudioUrl(data.audioUrl);
          setVideoUrl(data.imageUrl || null);
          setAudioSource(data.provider === 'suno-api' ? 'generated' : 'fallback');
          
          // Refresh tracks list to include the new track
          fetchUserTracks();
        }
        setIsGenerating(false);
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError('Something went wrong. Please try again.');
      setIsGenerating(false);
    }
  };

  const pollForCompletion = async (taskId: string) => {
    const maxAttempts = 30; // Reduced from 60 to 30 (5 minutes total instead of 10)
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/status?taskId=${taskId}`);
        const json = await response.json();

        if (json.success && json.track) {
          setAudioUrl(json.track.audioUrl);
          setVideoUrl(json.track.imageUrl || null);
          setAudioSource('generated');
          
          // Refresh tracks list to include the new track
          fetchUserTracks();
          
          setIsGenerating(false);
          return;
        } else if (json.error) {
          setError(json.error);
          setIsGenerating(false);
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000);
        } else {
          setError('Generation is taking longer than expected. Please try again.');
          setIsGenerating(false);
        }
      } catch (err) {
        console.error('Polling error:', err);
        setError('Something went wrong while checking generation status.');
        setIsGenerating(false);
      }
    };

    setTimeout(poll, 5000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-pink-900 to-cyan-900">
      {/* Navigation - Full Width */}
      <div className="w-full">
        <Navigation
          showHistory={showHistory}
          showTrending={showTrending}
          savedTracksCount={savedTracks.length}
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
      </div>

      {/* Main Content - Wider Container */}
      <div className="max-w-5xl mx-auto px-6 py-8 md:py-12 mt-8 md:mt-12">
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
            {tracksLoading ? (
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 text-center">
                <div className="animate-pulse text-white text-lg">Loading your tracks...</div>
              </div>
            ) : savedTracks.length === 0 ? (
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
            >
              {isGenerating ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Composing your SoundPainting...</span>
                </div>
              ) : (
                '🎵 Forge My Vibe'
              )}
            </motion.button>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-center"
              >
                <div className="flex items-center justify-center space-x-2 text-red-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{error}</span>
                </div>
              </motion.div>
            )}

            {isGenerating && (
              <GenerationProgress />
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
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
            
            {!videoUrl && (
              <div className="h-64 bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 overflow-hidden">
                <Visualizer />
              </div>
            )}

            <FeedbackButtons 
              trackId={Date.now().toString()}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
