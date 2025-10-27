'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import CreditsDisplay from '@/components/CreditsDisplay';
import { supabase } from '@/lib/supabaseClient';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [userTracks, setUserTracks] = useState<any[]>([]);
  const [tracksLoading, setTracksLoading] = useState(true);

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
      if (!user?.id || !supabase) return;
      
      setTracksLoading(true);
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching tracks:', error);
      } else {
        setUserTracks(data || []);
      }
    } catch (error) {
      console.error('Error in fetchUserTracks:', error);
    } finally {
      setTracksLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-pink-900 to-cyan-900 flex items-center justify-center p-4">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-pink-900 to-cyan-900 p-4">
      {/* Animated gradient orb backgrounds */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-4">
            <CreditsDisplay />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400">
              Welcome to your Dashboard
            </span>
          </h1>
          <p className="text-xl text-gray-400">
            Hello, {user.email}! Manage your account and creations.
          </p>
        </motion.div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Account Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="auth-form-container"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Account Info</h3>
            <div className="space-y-3">
              <div>
                <label className="text-gray-300 text-sm">Email</label>
                <p className="text-white">{user.email}</p>
              </div>
              <div>
                <label className="text-gray-300 text-sm">Member Since</label>
                <p className="text-white">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="auth-form-container"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href="/app"
                className="block w-full py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-cyan-500 text-white text-center hover:from-pink-600 hover:to-cyan-600 transition-all"
              >
                🎵 Generate New Music
              </Link>
              <Link
                href="/pricing"
                className="block w-full py-3 px-4 rounded-xl bg-white/20 text-white text-center hover:bg-white/30 transition-all"
              >
                💎 Top Up Credits
              </Link>
              <Link
                href="/live"
                className="block w-full py-3 px-4 rounded-xl bg-white/20 text-white text-center hover:bg-white/30 transition-all"
              >
                🎧 Infinite Vibes
              </Link>
            </div>
          </motion.div>

          {/* Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="auth-form-container"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Your Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Tracks Created</span>
                <span className="text-white">{userTracks.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Latest Track</span>
                <span className="text-white">
                  {userTracks.length > 0 
                    ? new Date(userTracks[0].created_at).toLocaleDateString()
                    : 'None'
                  }
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Tracks */}
        {userTracks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Your Recent Tracks</h2>
            <div className="grid gap-4">
              {userTracks.map((track, index) => (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="auth-form-container"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-white font-medium">{track.title || 'Untitled Track'}</h4>
                      <p className="text-gray-400 text-sm">
                        {new Date(track.created_at).toLocaleString()}
                      </p>
                    </div>
                    {track.audio_url && (
                      <audio controls className="max-w-xs">
                        <source src={track.audio_url} type="audio/mpeg" />
                      </audio>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Back to Home */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <Link
            href="/"
            className="inline-block px-8 py-4 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-all"
          >
            ← Back to Home
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
