'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function AuthCodeError() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-pink-900 to-cyan-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full bg-white/10 backdrop-blur-lg rounded-3xl p-12 border border-white/20 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="text-8xl mb-6"
        >
          ⚠️
        </motion.div>

        <h1 className="text-4xl font-semibold text-white mb-4">
          Authentication Error
        </h1>

        <p className="text-gray-300 text-lg mb-8">
          There was an issue with your authentication link. This could be because:
        </p>

        <ul className="text-gray-300 text-left mb-8 space-y-2">
          <li>• The link has expired</li>
          <li>• The link has already been used</li>
          <li>• The link is invalid</li>
        </ul>

        <div className="flex gap-4 justify-center">
          <motion.a
            href="/"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-semibold hover:from-pink-600 hover:to-cyan-600 transition-all"
          >
            Go Home
          </motion.a>

          <motion.button
            onClick={() => window.location.reload()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 rounded-2xl bg-white/20 text-white font-semibold hover:bg-white/30 transition-all"
          >
            Try Again
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
