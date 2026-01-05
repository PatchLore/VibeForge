'use client';

interface Package {
  name: string;
  tagline?: string;
  features: string[];
  isRecommended?: boolean;
}

const packages: Package[] = [
  {
    name: "Cover Swoop",
    features: [
      "Album cover (1 concept + 1 revision)"
    ]
  },
  {
    name: "Canvas Swoop",
    tagline: "Recommended",
    features: [
      "Album cover",
      "6s Spotify Canvas loop",
      "1 iPhone mockup video",
      "1 revision"
    ],
    isRecommended: true
  },
  {
    name: "Launch Swoop",
    features: [
      "Album cover (2 concepts)",
      "6s Canvas loop",
      "3 mockup videos (iPhone + social)",
      "3 social assets (story/post)",
      "Priority delivery"
    ]
  }
];

export default function Packages() {
  const handleRequestPackage = (packageName: string) => {
    const subject = encodeURIComponent(`Request: ${packageName} Package`);
    const body = encodeURIComponent(`Hi, I'm interested in the ${packageName} package.`);
    window.location.href = `mailto:hello@soundswoop.com?subject=${subject}&body=${body}`;
  };

  return (
    <section id="packages" className="px-4 py-16 md:py-24 bg-black">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold mb-10 md:mb-12 text-center">
          Choose Your Package
        </h2>
        
        <div className="grid md:grid-cols-3 gap-5 md:gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.name}
              className={`${
                pkg.isRecommended
                  ? "bg-gradient-to-br from-purple-900/50 to-cyan-900/50 border-2 border-purple-600"
                  : "bg-gray-900 border-2 border-gray-800"
              } rounded-xl p-5 md:p-6 relative`}
            >
              {pkg.isRecommended && (
                <div className="absolute top-3 right-3 md:top-4 md:right-4 bg-purple-600 text-white text-xs font-bold px-2.5 md:px-3 py-1 rounded-full">
                  RECOMMENDED
                </div>
              )}
              
              <h3 className="text-xl md:text-2xl font-bold mb-2">{pkg.name}</h3>
              {pkg.tagline && (
                <p className="text-gray-400 text-sm mb-4 md:mb-5">{pkg.tagline}</p>
              )}
              
              {/* Pricing Placeholder */}
              <div className="mb-4 md:mb-5">
                <p className="text-gray-400 text-sm">Pricing coming next</p>
              </div>
              
              {/* Features List */}
              <ul className={`space-y-2.5 md:space-y-3 mb-6 md:mb-8 ${pkg.isRecommended ? "text-gray-200" : "text-gray-300"}`}>
                {pkg.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-400 mr-2 flex-shrink-0">✓</span>
                    <span className="text-sm md:text-base">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {/* Request Button */}
              <button
                onClick={() => handleRequestPackage(pkg.name)}
                className={`w-full py-3 px-4 md:px-6 rounded-lg font-semibold text-sm md:text-base transition-colors ${
                  pkg.isRecommended
                    ? "bg-white hover:bg-gray-100 text-black"
                    : "bg-gray-800 hover:bg-gray-700 text-white"
                }`}
              >
                Request this package
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
