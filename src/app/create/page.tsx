// 🚨 Protected: Trending Vibes Page — DO NOT MODIFY WITHOUT BACKUP
// Last verified working: 2025-01-27
// This page handles:
// - Trending Vibes display (via TrendingVibes component)
// - User track history
// - Music generation interface
// - Track playback (via UnifiedPlayer)
//
// IMPORTANT: Any changes to this file or its dependencies (TrackCard, TrendingVibes, etc.)
// must be thoroughly tested before committing to ensure trending page functionality remains intact.

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import UnifiedPlayer from '@/components/UnifiedPlayer';
import TrendingVibes from '@/components/TrendingVibes';
import TrackCard from '@/components/TrackCard';
import PromptPresets from '@/components/PromptPresets';
import GenerationProgress from '@/components/GenerationProgress';
import FeedbackButtons from '@/components/FeedbackButtons';
import { SavedTrack } from '@/types';
import { expandPrompt, getRandomVibe } from '@/lib/prompt';
import { track } from '@vercel/analytics';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { EmotionPreset } from '@/data/emotionPresets';

export default function CreatePage() {
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
  const [expandedPrompts, setExpandedPrompts] = useState<{ music: string; art?: string; image?: string } | null>(null);
  const [currentTrackTitle, setCurrentTrackTitle] = useState<string>('');

  // Handler for emotion presets (from PromptPresets component)
  const handlePresetSelect = (preset: EmotionPreset) => {
    // Set the prompt directly to the vibe input
    setVibe(preset.prompt);
    track('Preset Used', { preset: preset.label });
  };

  // Handler for trending vibes (string-based)
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
      router.push('/');
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
        const convertedTracks: SavedTrack[] = data.tracks.map((track: any) => {
          const converted = {
            id: track.id,
            title: track.title || 'Generated Track',
            audioUrl: track.audio_url,
            imageUrl: track.image_url,
            mood: track.vibe || track.prompt || track.title,
            generatedAt: track.created_at,
            duration: track.duration || 600,
            // @ts-ignore store extra for TrackCard rendering
            summary: track.summary || '',
            // @ts-ignore propagate extended prompts
            extended_prompt: track.extended_prompt || '',
            // @ts-ignore propagate extended image prompt
            extended_prompt_image: track.extended_prompt_image || '',
          };
          console.log('🎧 [CreatePage] Track converted:', { title: converted.title, hasAudio: !!converted.audioUrl, hasImage: !!converted.imageUrl });
          return converted;
        });
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
        body: JSON.stringify({ prompt: vibe }),
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

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const pollForCompletion = async (taskId: string) => {
    if (!taskId) return;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const fetchStatus = async () => {
      if (!taskId) return;

      try {
        const res = await fetch(`/api/status?taskId=${taskId}`);
        const json = await res.json();

        console.log("[STATUS] Poll result:", json);

        // --- STOP POLLING WHEN COMPLETED ---
        if (json?.status === "completed") {
          console.log("[STATUS] Completed. Clearing interval.");
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          // Update UI state
          if (json.track) {
            setAudioUrl(json.track.audio_url || json.track.audioUrl);
            setVideoUrl(json.track.image_url || json.track.imageUrl || null);
            setAudioSource('generated');
            
            // Refresh tracks list to include the new track
            fetchUserTracks();
          }
          
          setIsGenerating(false);
          return;
        }

        // --- STOP POLLING WHEN NOT_FOUND ---
        if (res.status === 404) {
          console.warn("[STATUS] No track found. Stopping polling.");
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setError('Track not found. Please try generating again.');
          setIsGenerating(false);
          return;
        }

        // --- STOP POLLING WHEN FAILED ---
        if (json?.status === "failed") {
          console.warn("[STATUS] Track failed. Stopping polling.");
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setError('Generation failed. Please try again.');
          setIsGenerating(false);
          return;
        }

        // Continue polling if still processing
        if (json?.status === "processing" || json?.status === "PENDING") {
          // Keep polling, interval will continue
          return;
        }

      } catch (err) {
        console.error("[STATUS] Error:", err);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setError('Something went wrong while checking generation status.');
        setIsGenerating(false);
      }
    };

    // Start polling after 5 seconds, then every 2 seconds
    setTimeout(() => {
      fetchStatus(); // Initial call
      intervalRef.current = setInterval(fetchStatus, 2000);
    }, 5000);
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-bg text-text">
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
                        title: track.title,
                        prompt: track.mood,
                        vibe: track.mood,
                        summary: (track as any).summary,
                        extended_prompt: (track as any).extended_prompt,
                        extended_prompt_image: (track as any).extended_prompt_image,
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
            className="bg-card backdrop-blur-lg border-2 border-border rounded-2xl p-8 
                       transition-all duration-300 ease-out hover:border-primary 
                       hover:shadow-glow-lg"
          >
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-text text-lg">
                  Describe your current vibe or feeling…
                </label>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleInspireMe}
                  className="px-6 py-2 bg-card border border-primary rounded-full 
                             text-primary hover:bg-primary hover:text-white 
                             transition-all duration-300 font-medium"
                >
                  🎲 Inspire Me
                </motion.button>
              </div>
              <textarea
                value={vibe}
                onChange={(e) => setVibe(e.target.value)}
                placeholder="Express your emotional state... (e.g., 'heartbroken in the city', 'feeling infinite and boundless')"
                className="w-full p-4 rounded-xl bg-card backdrop-blur-lg border-2 border-border 
                           text-text placeholder:text-muted focus:border-primary focus:shadow-glow 
                           focus:outline-none transition-all duration-300 resize-none"
                rows={3}
              />
            </div>

            <div className="mb-8">
              <p className="text-text text-lg mb-4">Or choose a preset:</p>
              <PromptPresets onPresetSelect={handlePresetSelect} />
            </div>

            {/* Image → Music Feature */}
            {/* TODO: Implement image → music API hook + sentiment extraction */}
            <div className="border border-white/10 rounded-2xl p-4 mt-4 mb-8 text-center">
              <p className="text-white/80 text-sm font-semibold mb-2">🎨 Add Image to Inspire Music</p>
              <p className="text-white/60 text-xs">Upload an image and Soundswoop will generate music that matches the mood.</p>
            </div>


            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerate}
              disabled={!vibe.trim() || isGenerating}
              className={`w-full py-4 px-8 rounded-full font-semibold text-lg transition-all duration-300 ${
                !vibe.trim() || isGenerating
                  ? 'bg-card border border-border cursor-not-allowed text-muted'
                  : 'bg-gradient-primary text-white shadow-glow hover:opacity-90 hover:shadow-glow-hover'
              } ${isGenerating ? 'animate-pulse-glow' : ''}`}
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

            {isGenerating && (
              <div className="mt-3 text-xs text-white/60">
                🎨 Generating artwork… this may take up to 60 seconds.
              </div>
            )}

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
              <GenerationProgress expandedPrompts={expandedPrompts || undefined} />
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
                    setExpandedPrompts(null);
                    setIsGenerating(false);
                  }}
                  source={audioSource}
                  onCreditsUpdate={(credits) => setRemainingCredits(credits)}
                  trackTitle={currentTrackTitle}
                />
              )}
            </div>
            

            <FeedbackButtons 
              trackId={Date.now().toString()}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}

