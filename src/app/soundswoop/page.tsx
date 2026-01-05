export default function SoundSwoopPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="px-4 py-20 md:py-32 min-h-screen flex items-center justify-center">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 md:mb-8 leading-tight">
            Launch your music with visuals that move
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 mb-10 md:mb-12 max-w-2xl mx-auto">
            Album art + Spotify Canvas in one swoop
          </p>
          <button className="px-8 py-4 md:px-12 md:py-5 bg-white text-black rounded-lg font-semibold text-lg md:text-xl hover:bg-gray-100 transition-colors">
            Get Your SoundSwoop
          </button>
        </div>
      </section>

      {/* Golden Sample Section */}
      <section className="px-4 py-16 md:py-24 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-12 text-center">
            Golden Sample
          </h2>
          
          {/* Project Info */}
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-4xl font-bold mb-2">Neon Drift</h3>
            <p className="text-lg md:text-xl text-gray-400">Vapor Strike</p>
          </div>

          {/* Media Placeholders */}
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {/* Album Cover Image Placeholder */}
            <div className="flex flex-col items-center">
              <div className="w-full aspect-square bg-gray-800 border-2 border-gray-700 rounded-lg flex items-center justify-center mb-4">
                <p className="text-gray-500 text-sm text-center px-4">
                  Album Cover Image<br />Placeholder
                </p>
              </div>
              <p className="text-xs text-gray-500 text-center">Album Cover</p>
            </div>

            {/* Spotify Canvas Loop Video Placeholder */}
            <div className="flex flex-col items-center">
              <div className="w-full aspect-square bg-gray-800 border-2 border-gray-700 rounded-lg flex items-center justify-center mb-4">
                <p className="text-gray-500 text-sm text-center px-4">
                  Spotify Canvas<br />Loop Video<br />Placeholder
                </p>
              </div>
              <p className="text-xs text-gray-500 text-center">Spotify Canvas</p>
            </div>

            {/* iPhone Mockup Video Placeholder */}
            <div className="flex flex-col items-center">
              <div className="w-full aspect-[9/16] bg-gray-800 border-2 border-gray-700 rounded-lg flex items-center justify-center mb-4">
                <p className="text-gray-500 text-sm text-center px-4">
                  iPhone Mockup<br />Video<br />Placeholder
                </p>
              </div>
              <p className="text-xs text-gray-500 text-center">iPhone Mockup</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 md:mb-8">
            Swoop in and grab your professional launch visuals
          </h2>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 md:mb-12">
            Launch your music with confidence. Get stunning album art and Spotify Canvas visuals that capture your sound and make your release stand out.
          </p>
          
          {/* Email Capture Placeholder */}
          <div className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                disabled
              />
              <button className="px-8 py-4 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap">
                Get Started
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Email capture placeholder - no backend logic yet
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
