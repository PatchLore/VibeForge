'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import CreditsDisplay from '@/components/CreditsDisplay';

export default function MarketingNavigation() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-4">
        <div className="animate-pulse text-white/50">Loading...</div>
      </div>
    );
  }

  return (
    <nav className="bg-black/20 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center"
          >
            <Link href="/" className="text-2xl font-bold text-white">
              <span className="text-purple-400">Sound</span>
              <span className="text-cyan-400">swoop</span>
            </Link>
          </motion.div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/pricing" className="text-white/70 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/live" className="text-white/70 hover:text-white transition-colors">
              Live Stream
            </Link>
            <Link href="#faq" className="text-white/70 hover:text-white transition-colors">
              FAQ
            </Link>
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <CreditsDisplay />
                <div className="text-sm text-gray-300 hidden sm:block">
                  {user.email}
                </div>
                <motion.a
                  href="/app"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  🎵 Create Music
                </motion.a>
                <motion.a
                  href="/dashboard"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                >
                  Dashboard
                </motion.a>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <motion.a
                  href="/auth/login"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                >
                  Sign In
                </motion.a>
                <motion.a
                  href="/auth/signup"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  Get Started
                </motion.a>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
