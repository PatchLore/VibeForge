'use client';

export default function FinalCTA() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="px-4 py-16 md:py-24 bg-black">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-5 md:mb-6">
          Swoop in and grab your professional launch visuals.
        </h2>
        <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed">
          Stop launching with placeholder art. Get album covers, Spotify Canvas loops, and real-world mockups that make your music look as professional as it sounds. Built for indie producers who want label-quality visuals without the label budget.
        </p>
        
        <button
          onClick={() => scrollToSection('packages')}
          className="px-6 py-3 md:px-8 md:py-4 bg-white text-black rounded-lg font-semibold text-base md:text-lg hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl"
        >
          Get Your SoundSwoop
        </button>
      </div>
    </section>
  );
}
