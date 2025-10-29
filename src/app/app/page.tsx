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
import { expandPrompt, getRandomVibe } from '@/lib/prompt';
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
  const [expandedPrompts, setExpandedPrompts] = useState<{ music: string; art?: string; image?: string } | null>(null);
  const [currentTrackTitle, setCurrentTrackTitle] = useState<string>('');
  const [vocals, setVocals] = useState<'instrumental' | 'vocals'>('instrumental');
  const [imageInspiration, setImageInspiration] = useState<string | null>(null);
  const [dreamify, setDreamify] = useState<boolean>(false);

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
          console.log('🎧 [AppPage] Track converted:', { title: converted.title, hasAudio: !!converted.audioUrl, hasImage: !!converted.imageUrl });
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
        body: JSON.stringify({ prompt: vibe, userPrompt: vibe, vocals, imageInspiration, dreamify }),
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
        
        // Check if response is ok
        if (!response.ok) {
          console.error('Status check failed:', response.status, response.statusText);
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, 10000);
          } else {
            setError(`Generation check failed (${response.status}). Please try again.`);
            setIsGenerating(false);
          }
          return;
        }
        
        const json = await response.json();
        console.log('Poll response:', json);

        if (json.status === 'SUCCESS' && json.track) {
          setAudioUrl(json.track.audioUrl);
          setVideoUrl(json.track.imageUrl || null);
          setAudioSource('generated');
          
          // Refresh tracks list to include the new track
          fetchUserTracks();
          
          setIsGenerating(false);
          return;
        } else if (json.error) {
          console.error('Status error:', json.error);
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
              <p className="text-text text-lg mb-4">Or choose a preset:</p>
              <PromptPresets onPresetSelect={handleVibeSelect} />
            </div>

            {/* New options: Vocals + Image Inspiration */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div>
                <label className="block text-sm text-muted mb-2">Vocals</label>
                <select
                  value={vocals}
                  onChange={(e) => setVocals(e.target.value as 'instrumental' | 'vocals')}
                  className="w-full bg-[#1A002E] text-white rounded-xl p-2 border border-border focus:outline-none"
                >
                  <option value="instrumental">Instrumental</option>
                  <option value="vocals">AI Vocals</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted mb-2">Optional: Add Image to Produce Music</label>
                <input
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-primary file:text-white hover:file:opacity-90"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return setImageInspiration(null);
                    try {
                      const buf = await file.arrayBuffer();
                      const base64 = Buffer.from(buf).toString('base64');
                      const dataUrl = `data:${file.type || 'image/jpeg'};base64,${base64}`;
                      setImageInspiration(dataUrl);
                    } catch (err) {
                      console.error('Image upload error:', err);
                      setImageInspiration(null);
                    }
                  }}
                />
                {imageInspiration && (
                  <p className="mt-2 text-xs text-muted">Image attached ✓</p>
                )}
              </div>
            </div>

            {/* Dreamify Mode */}
            <div className="mb-6">
              <label className="flex items-center gap-2 text-sm text-text">
                <input
                  type="checkbox"
                  checked={dreamify}
                  onChange={(e) => setDreamify(e.target.checked)}
                />
                <span>Dreamify Mode ✨ (Interpret your dream into sound and visuals)</span>
              </label>
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
