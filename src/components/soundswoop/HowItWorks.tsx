interface Step {
  number: number;
  title: string;
  description: string;
  gradient: string;
}

const steps: Step[] = [
  {
    number: 1,
    title: "Send your track + vibe",
    description: "Upload your music and share your genre, mood, and visual references. We'll capture your sound.",
    gradient: "from-purple-600 to-cyan-600"
  },
  {
    number: 2,
    title: "We deliver visuals",
    description: "Get album art, 6-second Spotify Canvas loop, and real-world mockups—all matching your vibe.",
    gradient: "from-pink-600 to-purple-600"
  },
  {
    number: 3,
    title: "You launch like a label",
    description: "Download your professional visuals and launch your music with artwork that stands out.",
    gradient: "from-cyan-600 to-blue-600"
  }
];

export default function HowItWorks() {
  return (
    <section className="px-4 py-16 md:py-24 bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold mb-10 md:mb-12 text-center">
          How It Works
        </h2>
        
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {steps.map((step) => (
            <div
              key={step.number}
              className="bg-gray-800 border-2 border-gray-700 rounded-xl p-6 md:p-8 hover:border-purple-600/50 transition-colors"
            >
              {/* Numbered Badge */}
              <div className={`w-14 h-14 md:w-16 md:h-16 mb-5 md:mb-6 rounded-full bg-gradient-to-br ${step.gradient} flex items-center justify-center text-2xl md:text-3xl font-bold shadow-lg`}>
                {step.number}
              </div>
              
              {/* Content */}
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-white">
                {step.title}
              </h3>
              <p className="text-sm md:text-base text-gray-400 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
