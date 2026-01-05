import Image from 'next/image';

export default function GoldenSample() {
  return (
    <section id="golden-sample" className="px-4 py-16 md:py-24 bg-black">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
            Golden Sample: Neon Drift
          </h2>
          <p className="text-lg md:text-xl text-gray-400 mb-4 md:mb-6">Vapor Strike</p>
          
          {/* Style Tags */}
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
            <span className="px-3 md:px-4 py-1.5 md:py-2 bg-gray-800 border border-gray-700 rounded-full text-xs md:text-sm text-gray-300">
              Synthwave
            </span>
            <span className="px-3 md:px-4 py-1.5 md:py-2 bg-gray-800 border border-gray-700 rounded-full text-xs md:text-sm text-gray-300">
              80s Cyberpunk
            </span>
            <span className="px-3 md:px-4 py-1.5 md:py-2 bg-gray-800 border border-gray-700 rounded-full text-xs md:text-sm text-gray-300">
              Purple/Pink Neon
            </span>
            <span className="px-3 md:px-4 py-1.5 md:py-2 bg-gray-800 border border-gray-700 rounded-full text-xs md:text-sm text-gray-300">
              Retro Supercar
            </span>
          </div>
        </div>

        {/* Media Placeholders Grid */}
        <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-10 md:mb-12">
          {/* Album Cover - Square */}
          <div className="flex flex-col items-center">
            <div className="w-full aspect-square bg-gray-800 border-2 border-gray-700 rounded-lg flex items-center justify-center mb-3 md:mb-4 overflow-hidden relative">
              <Image
                src="/images/images/neon-drift-cover.png.png"
                alt="Neon Drift Album Cover"
                fill
                className="object-cover"
                priority
              />
            </div>
            <p className="text-xs text-gray-500 text-center">Album Cover</p>
          </div>

          {/* Spotify Canvas Loop - Vertical 9:16 */}
          <div className="flex flex-col items-center">
            <div className="w-full aspect-[9/16] bg-gray-800 border-2 border-gray-700 rounded-lg flex items-center justify-center mb-3 md:mb-4 overflow-hidden relative">
              <video
                src="/videos/neondriftspotify.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-xs text-gray-500 text-center">Spotify Canvas Loop</p>
          </div>

          {/* iPhone Desk Mockup - Video */}
          <div className="flex flex-col items-center">
            <div className="w-full aspect-[9/16] bg-gray-800 border-2 border-gray-700 rounded-lg flex items-center justify-center mb-3 md:mb-4 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-cyan-600/30 to-blue-600/30 flex items-center justify-center">
                <p className="text-gray-400 text-xs md:text-sm text-center px-2 md:px-4">
                  iPhone Desk<br />Mockup<br />(Video Placeholder)
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center">iPhone Desk Mockup</p>
          </div>
        </div>

        {/* Bullet Points */}
        <div className="max-w-3xl mx-auto">
          <ul className="space-y-3 md:space-y-4">
            <li className="flex items-start">
              <span className="text-purple-400 mr-3 text-lg md:text-xl flex-shrink-0">•</span>
              <span className="text-base md:text-lg text-gray-300">
                Professional album art that captures the synthwave aesthetic and stands out in streaming platforms
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 mr-3 text-lg md:text-xl flex-shrink-0">•</span>
              <span className="text-base md:text-lg text-gray-300">
                Engaging Spotify Canvas loop that keeps listeners engaged and adds visual storytelling to the track
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 mr-3 text-lg md:text-xl flex-shrink-0">•</span>
              <span className="text-base md:text-lg text-gray-300">
                Real-world mockups that show how your visuals look in context, perfect for social media and promotional materials
              </span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
