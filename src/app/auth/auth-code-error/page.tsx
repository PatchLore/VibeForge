'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-pink-900 to-cyan-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="auth-form-container w-full max-w-md mx-auto text-center"
      >
        <div className="text-6xl mb-6">⚠️</div>
        
        <h1 className="text-3xl font-bold text-white mb-4">
          Authentication Error
        </h1>
        
        <p className="text-gray-300 text-lg mb-8">
          There was a problem signing you in. This could be due to:
        </p>
        
        <ul className="text-gray-300 text-left mb-8 space-y-2">
          <li>• The authentication link expired</li>
          <li>• You cancelled the sign-in process</li>
          <li>• There was a temporary server issue</li>
        </ul>
        
        <div className="space-y-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/auth/signup"
              className="cta-button w-full py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-200 inline-block"
            >
              Try Again
            </Link>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/"
              className="w-full py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-200 inline-block bg-white/10 backdrop-blur-lg hover:bg-white/20 text-white border border-white/20"
            >
              Back to Home
            </Link>
          </motion.div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Need help? Contact us at{' '}
            <a href="mailto:support@soundswoop.com" className="text-pink-400 hover:text-pink-300 transition-colors">
              support@soundswoop.com
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}