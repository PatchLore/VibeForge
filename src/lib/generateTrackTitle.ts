import crypto from "crypto";

const titleThemes: Record<string, string[]> = {
  ambient: [
    "Echoes of Light", "Still Waters", "Twilight Memory", "Ethereal Drift", "Dream Circuit",
    "Silent Frequency", "Radiant Dust", "Cloudform", "Luminous Depths", "Drifting Horizons"
  ],
  gaming: [
    "Neon Rush", "Byte Pulse", "Circuit Anthem", "Power Up", "Next Level",
    "Virtual Bloom", "Digital Drift", "Hyperwave", "Pixel Reign", "Speedcore Sky"
  ],
  lofi: [
    "Midnight Cup", "Soft Vinyl", "Rainroom", "Lazy Spectrum", "Static Heart",
    "Window Glow", "Coffee Loop", "Dreambench", "Subtle Replay", "Quiet Arcade"
  ],
  cinematic: [
    "Echoes of Dawn", "Glass Horizon", "Golden Fracture", "Rising Signal",
    "Solar Frame", "Last Transmission", "Frozen Sky", "Crimson Bloom", "Nova Dream", "Silent Code"
  ],
  trap: [
    "Street Code", "Urban Pulse", "City Lights", "Neon Nights", "Concrete Dreams",
    "Metro Beat", "Skyline Drive", "Night Shift", "Urban Legend", "City Storm"
  ],
  hiphop: [
    "Flow State", "Street Wisdom", "Urban Poetry", "City Rhythms", "Block Stories",
    "Metro Flow", "Urban Tales", "Street Dreams", "City Vibes", "Block Anthem"
  ],
  rock: [
    "Electric Storm", "Thunder Road", "Fire & Steel", "Rebel Heart", "Wild Energy",
    "Storm Rider", "Electric Dreams", "Thunder Strike", "Wild Fire", "Rebel Soul"
  ],
  metal: [
    "Dark Symphony", "Thunder & Lightning", "Shadow Realm", "Iron Will", "Dark Storm",
    "Metal Thunder", "Shadow Strike", "Iron Heart", "Dark Power", "Thunder Storm"
  ],
  pop: [
    "Bright Lights", "Summer Dreams", "Electric Love", "Golden Hour", "Sweet Escape",
    "Dancing Stars", "Electric Dreams", "Summer Vibes", "Golden Days", "Sweet Melody"
  ],
  electronic: [
    "Digital Dreams", "Electric Pulse", "Neon Waves", "Cyber Symphony", "Electric Storm",
    "Digital Horizon", "Electric Dreams", "Neon Pulse", "Cyber Waves", "Digital Storm"
  ],
  acoustic: [
    "Wooden Dreams", "Gentle Breeze", "Morning Light", "Sunset Strings", "Natural Flow",
    "Forest Echo", "Mountain Song", "River Flow", "Sunrise Melody", "Nature's Call"
  ],
  jazz: [
    "Midnight Blues", "Smooth Groove", "City Lights", "Jazz Dreams", "Night Session",
    "Smooth Ride", "City Jazz", "Midnight Session", "Jazz Flow", "Night Groove"
  ],
  classical: [
    "Symphony of Dreams", "Elegant Echoes", "Classical Beauty", "Orchestral Dreams", "Musical Poetry",
    "Elegant Flow", "Classical Storm", "Symphony of Light", "Musical Dreams", "Orchestral Beauty"
  ],
  cyberpunk: [
    "Neon Dreams", "Cyber Storm", "Digital Rebellion", "Electric Night", "Cyber Pulse",
    "Neon Storm", "Digital Dreams", "Cyber Night", "Electric Rebellion", "Neon Pulse"
  ],
  fantasy: [
    "Magic Dreams", "Enchanted Forest", "Mystical Journey", "Fantasy Realm", "Magic Storm",
    "Enchanted Dreams", "Mystical Storm", "Fantasy Journey", "Magic Forest", "Enchanted Realm"
  ],
  vaporwave: [
    "Retro Dreams", "Neon Sunset", "Digital Memories", "Synth Dreams", "Retro Storm",
    "Neon Dreams", "Digital Sunset", "Synth Memories", "Retro Storm", "Neon Memories"
  ],
  horror: [
    "Dark Dreams", "Shadow Realm", "Nightmare Storm", "Dark Pulse", "Shadow Dreams",
    "Nightmare Realm", "Dark Storm", "Shadow Pulse", "Nightmare Dreams", "Dark Realm"
  ],
  default: [
    "Lucid Machine", "Velvet Static", "Breath of Glass", "Solar Ghosts",
    "Serene Circuitry", "Mirrorwave", "Neon Drift", "Hollow Sunlight", "Electric Dreams", "Digital Storm"
  ]
};

function detectTheme(prompt: string = ""): keyof typeof titleThemes {
  const lower = prompt.toLowerCase();
  
  // Gaming themes
  if (lower.includes("game") || lower.includes("roblox") || lower.includes("edm") || lower.includes("gaming")) return "gaming";
  
  // Chill themes
  if (lower.includes("lofi") || lower.includes("chill") || lower.includes("study") || lower.includes("relaxing")) return "lofi";
  
  // Cinematic themes
  if (lower.includes("cinematic") || lower.includes("orchestral") || lower.includes("soundtrack") || lower.includes("epic")) return "cinematic";
  
  // Ambient themes
  if (lower.includes("ambient") || lower.includes("dream") || lower.includes("ethereal") || lower.includes("atmospheric")) return "ambient";
  
  // Trap themes
  if (lower.includes("trap") || lower.includes("808") || lower.includes("urban") || lower.includes("street")) return "trap";
  
  // Hip-hop themes
  if (lower.includes("hip-hop") || lower.includes("hiphop") || lower.includes("rap") || lower.includes("boom-bap")) return "hiphop";
  
  // Rock themes
  if (lower.includes("rock") || lower.includes("guitar") || lower.includes("electric") || lower.includes("rebellious")) return "rock";
  
  // Metal themes
  if (lower.includes("metal") || lower.includes("heavy") || lower.includes("distorted") || lower.includes("aggressive")) return "metal";
  
  // Pop themes
  if (lower.includes("pop") || lower.includes("catchy") || lower.includes("upbeat") || lower.includes("mainstream")) return "pop";
  
  // Electronic themes
  if (lower.includes("electronic") || lower.includes("synth") || lower.includes("techno") || lower.includes("edm")) return "electronic";
  
  // Acoustic themes
  if (lower.includes("acoustic") || lower.includes("folk") || lower.includes("organic") || lower.includes("natural")) return "acoustic";
  
  // Jazz themes
  if (lower.includes("jazz") || lower.includes("improvisational") || lower.includes("saxophone") || lower.includes("sophisticated")) return "jazz";
  
  // Classical themes
  if (lower.includes("classical") || lower.includes("orchestral") || lower.includes("elegant") || lower.includes("refined")) return "classical";
  
  // Cyberpunk themes
  if (lower.includes("cyberpunk") || lower.includes("futuristic") || lower.includes("dystopian") || lower.includes("neon")) return "cyberpunk";
  
  // Fantasy themes
  if (lower.includes("fantasy") || lower.includes("magical") || lower.includes("mystical") || lower.includes("enchanted")) return "fantasy";
  
  // Vaporwave themes
  if (lower.includes("vaporwave") || lower.includes("retro") || lower.includes("80s") || lower.includes("nostalgic")) return "vaporwave";
  
  // Horror themes
  if (lower.includes("horror") || lower.includes("dark") || lower.includes("scary") || lower.includes("chilling")) return "horror";
  
  return "default";
}

export function generateTrackTitle(prompt?: string): string {
  const theme = detectTheme(prompt);
  const options = titleThemes[theme];
  const base = options[Math.floor(Math.random() * options.length)];

  console.log(`🎵 [TITLE GEN] Theme: ${theme}, Base: ${base}`);
  
  return base;
}

/**
 * Test function to validate title generation
 */
export function testTitleGeneration(): void {
  const testCases = [
    'Roblox gaming music',
    'lofi study vibes',
    'epic cinematic soundtrack',
    'dark trap beats',
    'upbeat pop anthem',
    'ambient space music',
    'acoustic guitar track',
    'electronic dance music',
    'cyberpunk city anthem',
    'fantasy adventure theme',
    'vaporwave aesthetic',
    'jazz club atmosphere',
    'horror movie soundtrack',
    'nostalgic memories',
    'futuristic technology'
  ];

  console.log('🧪 Testing title generation system:');
  testCases.forEach(testCase => {
    const title = generateTrackTitle(testCase);
    console.log(`Input: "${testCase}" → Title: "${title}"`);
  });
}
