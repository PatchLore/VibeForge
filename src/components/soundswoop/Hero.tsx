export default function Hero() {
  return (
    <section className="px-4 py-20 md:py-32 min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-black"></div>
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 md:mb-8 leading-tight">
          Launch your music with visuals that move
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 mb-10 md:mb-12 max-w-2xl mx-auto">
          Album art + Spotify Canvas in one swoop
        </p>
        <button className="px-8 py-4 md:px-12 md:py-5 bg-white text-black rounded-lg font-semibold text-lg md:text-xl hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl">
          Get Your SoundSwoop
        </button>
      </div>
    </section>
  );
}
