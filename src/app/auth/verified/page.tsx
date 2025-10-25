'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function VerifiedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-pink-900 to-cyan-900 flex items-center justify-center p-4">
      {/* Animated gradient orb backgrounds */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="auth-form-container w-full max-w-md mx-auto text-center"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            <CheckCircle className="w-24 h-24 text-green-400" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 }}
              className="absolute inset-0 bg-green-400/20 rounded-full blur-xl"
            />
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            ✅ Your Soundswoop account has been verified. Welcome aboard!
          </h1>
          
          <p className="text-gray-300 text-lg mb-8">
            You're all set! Your email has been verified and you can now access all features of Soundswoop.
          </p>
        </motion.div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/dashboard"
              className="cta-button w-full py-4 px-8 rounded-xl font-semibold text-lg transition-all duration-200 inline-block"
            >
              Go to Dashboard
            </Link>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/pricing"
              className="w-full py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-200 inline-block bg-white/10 backdrop-blur-lg hover:bg-white/20 text-white border border-white/20"
            >
              View Pricing Plans
            </Link>
          </motion.div>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center"
        >
          <p className="text-gray-400 text-sm">
            Ready to create amazing AI music and art? Let's get started!
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
