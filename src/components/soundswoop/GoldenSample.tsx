export default function GoldenSample() {
  return (
    <section className="px-4 py-16 md:py-24 bg-black">
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
            <div className="w-full aspect-square bg-gray-800 border-2 border-gray-700 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-purple-600/30 to-cyan-600/30 flex items-center justify-center">
                <p className="text-gray-400 text-sm text-center px-4">
                  Album Cover Image<br />Placeholder
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center">Album Cover</p>
          </div>

          {/* Spotify Canvas Loop Video Placeholder */}
          <div className="flex flex-col items-center">
            <div className="w-full aspect-square bg-gray-800 border-2 border-gray-700 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-pink-600/30 to-purple-600/30 flex items-center justify-center">
                <p className="text-gray-400 text-sm text-center px-4">
                  Spotify Canvas<br />Loop Video<br />Placeholder
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center">Spotify Canvas</p>
          </div>

          {/* iPhone Mockup Video Placeholder */}
          <div className="flex flex-col items-center">
            <div className="w-full aspect-[9/16] bg-gray-800 border-2 border-gray-700 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-cyan-600/30 to-blue-600/30 flex items-center justify-center">
                <p className="text-gray-400 text-sm text-center px-4">
                  iPhone Mockup<br />Video<br />Placeholder
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center">iPhone Mockup</p>
          </div>
        </div>
      </div>
    </section>
  );
}
