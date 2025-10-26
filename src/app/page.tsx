'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Hero from '@/components/Hero';
import BenefitsSection from '@/components/BenefitsSection';
import Footer from '@/components/Footer';
import FAQ from '@/components/FAQ';
import FeatureHighlights from '@/components/FeatureHighlights';
import MarketingNavigation from '@/components/MarketingNavigation';
import { useAuth } from '@/hooks/useAuth';
import '@/styles/homepage.css';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/app');
    }
  }, [user, loading, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-pink-900 to-cyan-900 flex items-center justify-center">
        <div className="animate-pulse text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Don't render marketing content if user is logged in (will redirect)
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-pink-900 to-cyan-900 flex items-center justify-center">
        <div className="animate-pulse text-white text-xl">Redirecting...</div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-pink-900 to-cyan-900">
      {/* Navigation */}
      <MarketingNavigation />
      
      {/* Hero Section */}
      <Hero />

      {/* Benefits Section */}
      <BenefitsSection />

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        {/* Feature Highlights */}
        <FeatureHighlights />
        
        {/* FAQ Section */}
        <FAQ />
        
        {/* Call to Action Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="text-center py-20"
        >
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Create Your <span className="text-purple-400">Soundscape</span>?
            </h2>
            <p className="text-xl text-white/70 mb-12 max-w-2xl mx-auto">
              Join thousands of creators who are already transforming their emotions into music and art. 
              Start with 36 free credits - no credit card required.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/auth/signup"
                  className="inline-block bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 text-white font-semibold text-lg px-8 py-6 rounded-full hover:opacity-90 transition-opacity shadow-xl"
                >
                  🎵 Start Creating Free
                </Link>
        </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/auth/login"
                  className="inline-block px-8 py-6 rounded-full border-2 border-white/30 text-white hover:border-white/50 hover:bg-white/10 transition-all"
                >
                  Sign In
                </Link>
              </motion.div>
            </div>
            
            <div className="mt-8 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 max-w-md mx-auto">
              <p className="text-sm text-white/80">
                ✨ <span className="text-white font-semibold">36 free credits</span> included with every new account
              </p>
              <p className="text-xs text-white/60 mt-1">
                No credit card required • Start creating immediately
              </p>
            </div>
          </div>
        </motion.section>
        </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
