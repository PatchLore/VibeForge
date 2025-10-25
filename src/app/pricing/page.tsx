'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const startCheckout = async (type: 'subscription' | 'topup', priceId: string) => {
    setLoading(priceId);
    
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          priceId,
          email: 'user@example.com', // In production, get from user session
        }),
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Free',
      emoji: '🆓',
      price: '$0',
      period: 'Forever free',
      description: 'Get started with 3 free AI music or art generations daily.',
      features: [
        '3 free generations per day',
        'Limited access to Infinite Vibes feed',
        'Basic audio quality',
        'Community Radio access',
        'No credit card required'
      ],
      button: {
        text: 'Start Free',
        href: '/',
        type: 'link' as const
      },
      popular: false,
      comingSoon: false
    },
    {
      id: 'pro',
      name: 'Pro',
      emoji: '💎',
      price: '$9.99',
      period: 'per month',
      description: 'Unlimited AI music & art generation with premium features.',
      features: [
        'Unlimited AI music & art generation',
        'Full access to Infinite Vibes Discovery feed',
        'Download MP3, PNG, and MP4 files',
        'Priority generation speed',
        'Community Radio playlist rotation',
        'Cloud storage for your creations'
      ],
      button: {
        text: 'Upgrade to Pro',
        action: () => startCheckout('subscription', 'price_pro_month'),
        type: 'action' as const
      },
      popular: true,
      comingSoon: false
    },
    {
      id: 'creator',
      name: 'Creator',
      emoji: '🚀',
      price: '$19.99',
      period: 'per month',
      description: 'Designed for frequent creators & content producers.',
      features: [
        'Higher quality audio + HD artwork generation',
        'Your tracks eligible for Community Radio spotlight',
        'Early access to new Vibes & exclusive effects',
        '10,000 monthly credits included',
        'Advanced AI models',
        'Commercial license included'
      ],
      button: {
        text: 'Get Creator',
        action: () => startCheckout('subscription', 'price_creator_month'),
        type: 'action' as const
      },
      popular: false,
      comingSoon: false
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      emoji: '🏢',
      price: 'Custom',
      period: 'Contact us',
      description: 'For studios, teams, and platforms integrating Soundswoop tech.',
      features: [
        'Dedicated API access',
        'Bulk credits + private generation servers',
        'Advanced analytics and custom features',
        'White-label solutions',
        'Priority support',
        'Custom integrations'
      ],
      button: {
        text: 'Contact Us',
        href: 'mailto:enterprise@soundswoop.com',
        type: 'link' as const
      },
      popular: false,
      comingSoon: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-pink-900 to-cyan-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Join the Soundswoop community and unlock Infinite Vibes.
          </p>
          
          {/* Animated gradient border */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="h-1 bg-gradient-to-r from-pink-500 via-cyan-500 to-purple-500 rounded-full mx-auto max-w-md"
          />
        </motion.div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              whileHover={{ 
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
              className={`
                relative bg-white/5 backdrop-blur-lg rounded-2xl p-6 border transition-all duration-300
                ${plan.popular 
                  ? 'border-2 border-gradient-to-r from-pink-500 to-cyan-500 shadow-lg shadow-pink-500/20' 
                  : 'border border-white/20 hover:border-cyan-500/50'
                }
                ${plan.comingSoon ? 'opacity-75' : ''}
                flex flex-col h-full
              `}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-pink-500 to-cyan-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Coming Soon Badge */}
              {plan.comingSoon && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gray-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Coming Soon
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">{plan.emoji}</div>
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400 mb-1">
                  {plan.price}
                </div>
                <p className="text-gray-400 text-sm">{plan.period}</p>
              </div>

              {/* Description */}
              <p className="text-gray-300 text-sm mb-6 text-center">
                {plan.description}
              </p>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start text-gray-300 text-sm">
                    <span className="text-green-400 mr-3 mt-0.5 flex-shrink-0">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Button */}
              <div className="mt-auto">
                {plan.button.type === 'link' ? (
                  <motion.a
                    href={plan.button.href}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      w-full py-3 px-6 rounded-xl font-semibold text-center block transition-all duration-200
                      ${plan.comingSoon 
                        ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed' 
                        : plan.popular
                        ? 'bg-gradient-to-r from-pink-500 to-cyan-500 text-white hover:from-pink-600 hover:to-cyan-600'
                        : 'bg-white/10 text-white hover:bg-white/20'
                      }
                    `}
                  >
                    {plan.button.text}
                  </motion.a>
                ) : (
                  <motion.button
                    onClick={plan.button.action}
                    disabled={loading === `price_${plan.id}_month` || plan.comingSoon}
                    whileHover={{ scale: plan.comingSoon ? 1 : 1.02 }}
                    whileTap={{ scale: plan.comingSoon ? 1 : 0.98 }}
                    className={`
                      w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200
                      ${plan.comingSoon 
                        ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed' 
                        : plan.popular
                        ? 'bg-gradient-to-r from-pink-500 to-cyan-500 text-white hover:from-pink-600 hover:to-cyan-600 disabled:opacity-50'
                        : 'bg-white/10 text-white hover:bg-white/20 disabled:opacity-50'
                      }
                    `}
                  >
                    {loading === `price_${plan.id}_month` ? 'Loading...' : plan.button.text}
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Credit Top-Up Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-12"
        >
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Buy More Credits</h3>
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-gray-300 mb-2">1,000 Credits</p>
              <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400 mb-4">$5</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => startCheckout('topup', 'price_topup_1k')}
                disabled={loading === 'price_topup_1k'}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-semibold hover:from-pink-600 hover:to-cyan-600 transition-all disabled:opacity-50"
              >
                {loading === 'price_topup_1k' ? 'Loading...' : 'Buy Credits'}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center"
        >
          <p className="text-gray-400 mb-6">
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