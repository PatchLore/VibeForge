import type { Metadata } from 'next';
import { motion } from 'framer-motion';

export const metadata: Metadata = {
  title: 'Pricing - VibeForge',
  description: 'Choose the perfect plan for your AI music generation needs. Free tier available, Pro coming soon.',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-pink-900 to-cyan-900 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-light text-white mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400">
              Choose Your Plan
            </span>
          </h1>
          <p className="text-xl text-gray-300">
            Start creating AI music today
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 hover:border-pink-500/50 transition-all"
          >
            <div className="text-center mb-6">
              <h2 className="text-3xl font-semibold text-white mb-2">Free</h2>
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400">
                $0
              </div>
              <p className="text-gray-400 text-sm mt-2">Forever free</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center text-gray-300">
                <span className="text-green-400 mr-3">✓</span>
                3 tracks per day
              </li>
              <li className="flex items-center text-gray-300">
                <span className="text-green-400 mr-3">✓</span>
                Standard quality audio
              </li>
              <li className="flex items-center text-gray-300">
                <span className="text-green-400 mr-3">✓</span>
                AI-generated artwork
              </li>
              <li className="flex items-center text-gray-300">
                <span className="text-green-400 mr-3">✓</span>
                Save tracks locally
              </li>
              <li className="flex items-center text-gray-300">
                <span className="text-green-400 mr-3">✓</span>
                No credit card required
              </li>
            </ul>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 px-6 rounded-2xl bg-white/20 text-white font-semibold hover:bg-white/30 transition-all"
            >
              Get Started Free
            </motion.button>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-pink-500/20 to-cyan-500/20 backdrop-blur-lg rounded-3xl p-8 border-2 border-pink-500/50 relative overflow-hidden"
          >
            {/* Badge */}
            <div className="absolute top-4 right-4 bg-gradient-to-r from-pink-500 to-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              COMING SOON
            </div>

            <div className="text-center mb-6">
              <h2 className="text-3xl font-semibold text-white mb-2">Pro</h2>
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400">
                $9
              </div>
              <p className="text-gray-400 text-sm mt-2">per month</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center text-gray-300">
                <span className="text-green-400 mr-3">✓</span>
                Unlimited tracks
              </li>
              <li className="flex items-center text-gray-300">
                <span className="text-green-400 mr-3">✓</span>
                HD quality audio
              </li>
              <li className="flex items-center text-gray-300">
                <span className="text-green-400 mr-3">✓</span>
                Advanced AI models
              </li>
              <li className="flex items-center text-gray-300">
                <span className="text-green-400 mr-3">✓</span>
                Cloud storage
              </li>
              <li className="flex items-center text-gray-300">
                <span className="text-green-400 mr-3">✓</span>
                Priority generation
              </li>
              <li className="flex items-center text-gray-300">
                <span className="text-green-400 mr-3">✓</span>
                Commercial license
              </li>
            </ul>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-semibold hover:from-pink-600 hover:to-cyan-600 transition-all"
            >
              Join Waitlist
            </motion.button>
          </motion.div>
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-400 mb-4">
            Questions? We're here to help
          </p>
          <motion.a
            href="/"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all"
          >
            ← Back to Home
          </motion.a>
        </motion.div>
      </div>
    </div>
  );
}

