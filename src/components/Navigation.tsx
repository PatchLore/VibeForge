'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import CreditsDisplay from '@/components/CreditsDisplay';

interface NavigationProps {
  showHistory: boolean;
  showTrending: boolean;
  savedTracksCount: number;
  onShowHistory: () => void;
  onShowTrending: () => void;
  onShowGenerate: () => void;
}

export default function Navigation({
  showHistory,
  showTrending,
  savedTracksCount,
  onShowHistory,
  onShowTrending,
  onShowGenerate
}: NavigationProps) {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

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

  return (
    <div className="flex flex-wrap justify-center gap-3 mb-8">
      {/* Main Navigation Buttons */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onShowGenerate}
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
        onClick={onShowTrending}
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
        onClick={onShowHistory}
        className={`px-6 py-3 rounded-xl transition-all ${
          showHistory
            ? 'bg-gradient-to-r from-pink-500 to-cyan-500 text-white' 
            : 'bg-white/20 text-gray-300 hover:bg-white/30'
        }`}
      >
        My Tracks ({savedTracksCount})
      </motion.button>

      <motion.a
        href="/live"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-cyan-500 text-white hover:from-pink-600 hover:to-cyan-600 transition-all"
      >
        🎧 Infinite Vibes
      </motion.a>

      <motion.a
        href="/pricing"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="px-6 py-3 rounded-xl bg-white/20 text-gray-300 hover:bg-white/30 transition-all"
      >
        💎 Pricing
      </motion.a>

      {/* Auth-aware Navigation */}
      {loading ? (
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="px-6 py-3 rounded-xl bg-white/10 text-gray-300"
        >
          <div className="animate-pulse">Loading...</div>
        </motion.div>
      ) : user ? (
        <div className="flex items-center gap-3">
          <CreditsDisplay />
          <div className="text-sm text-gray-300 hidden sm:block">
            {user.email}
          </div>
          <motion.a
            href="/dashboard"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            Dashboard
          </motion.a>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="px-6 py-3 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all border border-red-400/30 disabled:opacity-50"
          >
            {isSigningOut ? 'Signing out...' : 'Logout'}
          </motion.button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <motion.a
            href="/auth/login"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 rounded-xl bg-white/20 text-gray-300 hover:bg-white/30 transition-all"
          >
            Login
          </motion.a>
          <motion.a
            href="/auth/signup"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-cyan-500 text-white hover:from-pink-600 hover:to-cyan-600 transition-all"
          >
            Sign Up
          </motion.a>
        </div>
      )}
    </div>
  );
}
