'use client';

import { motion } from 'framer-motion';

const features = [
  {
    icon: '🎵',
    title: 'AI Music Generation',
    description: 'Create personalized music with advanced AI technology powered by Kie.ai'
  },
  {
    icon: '🎨',
    title: 'Visual Art Generation',
    description: 'Each music track comes with matching AI-generated artwork'
  },
  {
    icon: '⚡',
    title: 'Instant Results',
    description: 'Generate your custom soundscape in 1-2 minutes'
  },
  {
    icon: '💸',
    title: '100% Free',
    description: 'No account required, no credit card needed'
  },
  {
    icon: '🎭',
    title: 'Emotion-Based',
    description: 'Music tailored to your specific vibe and emotions'
  },
  {
    icon: '🌐',
    title: 'Accessible Anywhere',
    description: 'Works on all devices - desktop, tablet, and mobile'
  }
];

export default function FeatureHighlights() {
  return (
    <div className="mt-16">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-3xl font-light text-white mb-8 text-center"
      >
        Why Choose Soundswoop?
      </motion.h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-colors"
          >
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {feature.title}
            </h3>
            <p className="text-gray-300 text-sm">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

