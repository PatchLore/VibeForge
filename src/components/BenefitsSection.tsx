"use client";

import { motion } from "framer-motion";

const benefits = [
  {
    icon: "🎵",
    title: "AI Music Generation",
    description: "Transform any vibe into professional-quality music with advanced AI that understands emotion and mood."
  },
  {
    icon: "🎨",
    title: "Artistic Visuals",
    description: "Get painterly, artistic visuals that match your music - no more generic stock images or photo-realistic art."
  },
  {
    icon: "⚡",
    title: "Lightning Fast",
    description: "Generate complete music tracks and artwork in under 2 minutes. No waiting, no delays, just instant creativity."
  },
  {
    icon: "🎯",
    title: "Vibe-Based Creation",
    description: "Simply describe your mood or feeling - our AI handles the technical complexity while you focus on the emotion."
  }
];

export default function BenefitsSection() {
  return (
    <section className="py-20 px-6 bg-gradient-to-b from-[#0a0a15] to-[#060510]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Why <span className="text-purple-400">Soundswoop</span> is Different
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            We don't just generate music or art separately. We create cohesive soundscapes 
            where every element works together to capture your exact emotional state.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300"
            >
              <div className="text-4xl mb-4">{benefit.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {benefit.title}
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
