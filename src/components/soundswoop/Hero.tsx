'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function Hero() {
  const [videoError, setVideoError] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="px-4 py-16 md:py-24 min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Gradient/Glow Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-black to-cyan-900/20"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl"></div>
      
      <div className="max-w-6xl mx-auto w-full relative z-10">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left Side - Copy and CTAs */}
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight">
              Launch your music with visuals that move.
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-3 max-w-2xl mx-auto md:mx-0">
              Album art + Spotify Canvas + real-world mockups in one swoop.
            </p>
            <p className="text-base md:text-lg text-gray-400 mb-8 md:mb-10 max-w-2xl mx-auto md:mx-0">
              Built for indie producers who want a pro launch without hiring a designer.
            </p>
            
            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center md:justify-start">
              <button
                onClick={() => scrollToSection('packages')}
                className="px-6 py-3 md:px-8 md:py-4 bg-white text-black rounded-lg font-semibold text-base md:text-lg hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl"
              >
                Get Your SoundSwoop
              </button>
              <button
                onClick={() => scrollToSection('golden-sample')}
                className="px-6 py-3 md:px-8 md:py-4 bg-transparent border-2 border-white/30 text-white rounded-lg font-semibold text-base md:text-lg hover:border-white/50 hover:bg-white/10 transition-colors"
              >
                See the Golden Sample
              </button>
            </div>
          </div>

          {/* Right Side / Below on Mobile - iPhone Mockup with Canvas Video */}
          <div className="flex justify-center md:justify-end order-first md:order-last">
            <div className="w-full max-w-xs md:max-w-sm">
              <div className="aspect-[9/16] bg-gray-800 border-2 border-gray-700 rounded-3xl p-2 shadow-2xl relative overflow-hidden">
                {/* iPhone frame styling */}
                <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black rounded-2xl flex items-center justify-center relative overflow-hidden">
                  {/* Screen notch placeholder */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-10"></div>
                  
                  {/* Content area */}
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 md:p-6 relative">
                    {!videoError ? (
                      <video
                        src="/videos/neondriftspotify.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        onError={() => setVideoError(true)}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <div className="w-full aspect-square relative rounded-xl overflow-hidden">
                        <Image
                          src="/images/images/neon-drift-cover.png.png"
                          alt="Neon Drift Album Cover"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="text-center mt-3 md:mt-4">
                      <p className="text-white text-xs md:text-sm font-semibold mb-1">Now Playing</p>
                      <p className="text-gray-400 text-xs">Neon Drift - Vapor Strike</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center mt-3 md:mt-4">
                iPhone Spotify Canvas mockup
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
