export default function ProofStrip() {
  return (
    <section className="px-4 py-12 md:py-16 bg-gray-900 border-y border-gray-800">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 text-gray-400">
          <div className="text-center">
            <p className="text-2xl md:text-3xl font-bold text-white mb-1">500+</p>
            <p className="text-sm md:text-base">Artists Launched</p>
          </div>
          <div className="hidden md:block w-px h-12 bg-gray-700"></div>
          <div className="text-center">
            <p className="text-2xl md:text-3xl font-bold text-white mb-1">10K+</p>
            <p className="text-sm md:text-base">Visuals Created</p>
          </div>
          <div className="hidden md:block w-px h-12 bg-gray-700"></div>
          <div className="text-center">
            <p className="text-2xl md:text-3xl font-bold text-white mb-1">4.9★</p>
            <p className="text-sm md:text-base">Average Rating</p>
          </div>
          <div className="hidden md:block w-px h-12 bg-gray-700"></div>
          <div className="text-center">
            <p className="text-2xl md:text-3xl font-bold text-white mb-1">24hr</p>
            <p className="text-sm md:text-base">Turnaround</p>
          </div>
        </div>
      </div>
    </section>
  );
}
