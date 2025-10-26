'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  const [credits, setCredits] = useState<number | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCredits();
    }
  }, [user]);

  const fetchCredits = async () => {
    try {
      // Query profiles table directly instead of using get_credits RPC
      const { data, error } = await supabase
        ?.from('profiles')
        .select('credits')
        .eq('user_id', user?.id)
        .single() || {};
      
      if (error) {
        console.error('Error fetching credits:', error);
        setCredits(0);
      } else {
        setCredits(data?.credits || 0);
      }
    } catch (err) {
      console.error('Unexpected error fetching credits:', err);
      setCredits(0);
    } finally {
      setCreditsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-pink-900 to-cyan-900 flex items-center justify-center">
        <div className="animate-pulse text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-pink-900 to-cyan-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.a
              href="/"
              whileHover={{ scale: 1.05 }}
              className="text-xl font-bold text-white"
            >
              Soundswoop
            </motion.a>
            <div className="flex items-center gap-4">
              <motion.a
                href="/"
                whileHover={{ scale: 1.05 }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
              >
                ← Back to Home
              </motion.a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20"
          >
            <h1 className="text-3xl font-bold text-white mb-8 text-center">
              Dashboard
            </h1>

            {/* User Info */}
            <div className="space-y-6">
              <div className="bg-white/5 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Account Information</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Email
                    </label>
                    <div className="text-white">{user.email}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      User ID
                    </label>
                    <div className="text-gray-400 text-sm font-mono break-all">
                      {user.id}
                    </div>
                  </div>
                </div>
              </div>

              {/* Credits */}
              <div className="bg-white/5 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Credits</h2>
                <div className="flex items-center gap-4">
                  <div className="text-3xl">💎</div>
                  <div>
                    {creditsLoading ? (
                      <div className="animate-pulse text-white text-2xl">Loading...</div>
                    ) : (
                      <div className="text-white text-2xl font-bold">
                        {credits ?? 0} Credits
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-gray-300 text-sm mt-2">
                  Each music generation costs 12 credits.
                </p>
              </div>

              {/* Actions */}
              <div className="bg-white/5 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Actions</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.a
                    href="/pricing"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-cyan-500 text-white hover:from-pink-600 hover:to-cyan-600 transition-all text-center"
                  >
                    💎 Get More Credits
                  </motion.a>
                  <motion.a
                    href="/"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 rounded-xl bg-white/20 text-gray-300 hover:bg-white/30 transition-all text-center"
                  >
                    🎵 Generate Music
                  </motion.a>
                </div>
              </div>

              {/* Sign Out */}
              <div className="pt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="w-full px-6 py-3 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all border border-red-400/30 disabled:opacity-50"
                >
                  {isSigningOut ? 'Signing out...' : 'Sign Out'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}