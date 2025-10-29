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
 * Generate a creative title based on user prompt with proper capitalization
 * Examples:
 * - "geometry dash frontier" → "Geometry Dash Frontier"
 * - "roblox dubstep anthem" → "Roblox Dubstep Anthem"
 * - "lofi chill vibes" → "Lofi Chill Vibes"
 */
export function generateCreativeTitle(userPrompt: string): string {
  if (!userPrompt || userPrompt.trim().length === 0) {
    return generateTrackTitle(); // Fallback to theme-based title
  }

  // Clean and normalize the prompt
  const cleaned = userPrompt
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special chars except hyphens
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  if (cleaned.length === 0) {
    return generateTrackTitle();
  }

  // Split into words and capitalize each word properly
  const words = cleaned.split(' ');
  const capitalized = words.map(word => {
    // Preserve hyphens
    if (word.includes('-')) {
      return word.split('-').map(part => 
        part.charAt(0).toUpperCase() + part.slice(1)
      ).join('-');
    }
    return word.charAt(0).toUpperCase() + word.slice(1);
  });

  // Join words back together
  let creativeTitle = capitalized.join(' ');

  // Ensure it's not too long (max 50 chars)
  if (creativeTitle.length > 50) {
    creativeTitle = creativeTitle.slice(0, 47) + '...';
  }

  console.log(`🎨 [CREATIVE TITLE] "${userPrompt}" → "${creativeTitle}"`);
  
  return creativeTitle;
}

/**
 * Detect primary mood/vibe from user prompt
 * Examples:
 * - "melodic trance sunrise" → "Euphoric / Uplifting"
 * - "dark dnb bassline" → "Aggressive / Intense"
 * - "ambient forest soundscape" → "Calm / Reflective"
 */
export function detectVibe(userPrompt: string): string {
  const p = (userPrompt || "").toLowerCase();
  if (/trance|euphoria|uplift|sunrise|anthem/.test(p)) return "Euphoric / Uplifting";
  if (/(dark|dnb|drum and bass|neuro|industrial|hard)/.test(p)) return "Aggressive / Intense";
  if (/(ambient|forest|rain|nature|calm|meditat|chill|lofi)/.test(p)) return "Calm / Reflective";
  if (/(game|gaming|roblox|geometry dash|edm|synthwave|arcade|8-bit|chip)/.test(p)) return "Energetic / Gaming";
  if (/(cinematic|orchestral|film|epic|trailer)/.test(p)) return "Cinematic / Dramatic";
  if (/(jazzy|jazz|sax|blues)/.test(p)) return "Smooth / Jazzy";
  if (/(pop|upbeat|dance)/.test(p)) return "Upbeat / Pop";
  return "Creative / Expressive";
}

/**
 * Generate a short vivid summary for the track
 */
export function generateSummary(userPrompt: string): string {
  const vibe = detectVibe(userPrompt);
  const p = userPrompt.trim();
  // Simple templated narrative
  if (/trance|euphor/i.test(p)) {
    return "An atmospheric trance anthem inspired by sunrise energy — glowing pads, shimmering synths, and euphoric build-ups.";
  }
  if (/dnb|drum and bass|neuro|bassline|dark/i.test(p)) {
    return "A high-velocity DnB drive — razor bass, rapid-fire drums, and tension-filled drops with cinematic impact.";
  }
  if (/ambient|forest|rain|nature/i.test(p)) {
    return "A serene ambient journey — misty textures, gentle swells, and organic field tones evoking tranquil nature.";
  }
  if (/game|gaming|roblox|geometry dash|edm|synthwave/i.test(p)) {
    return "A high-energy electronic rush — playful synths, neon textures, and glitch-tinted drops built for fast-paced worlds.";
  }
  if (/cinematic|orchestral|film|epic/i.test(p)) {
    return "A sweeping cinematic piece — soaring strings, bold brass, and dramatic crescendos glowing with emotion.";
  }
  return `${vibe} piece — expressive melodies, modern production, and immersive atmosphere.`;
}

// --- Two-word, TitleCase title enforcement ---
export function toTitleCaseTwoWords(s: string): string {
  if (!s) return "Untitled Track";
  const words = s
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.toLowerCase());

  const ranked = [...new Set(words)].sort((a,b) => b.length - a.length);
  const base = ranked.slice(0, 2).length ? ranked.slice(0, 2) : words.slice(0, 2);
  const chosen = base.map(w => w.charAt(0).toUpperCase() + w.slice(1));

  const title = chosen.join(" ").trim();
  return title || "Untitled Track";
}

export function generateCreativeTitleTwoWords(userPrompt: string, genreHint?: string): string {
  const flair = ["Pulse","Echo","Horizon","Rush","Dream","Flux","Nova","Glide","Shift","Spark"];
  const base = toTitleCaseTwoWords(userPrompt);
  if (base.split(" ").length >= 2) return base;
  const add = flair.find(f => f !== base);
  return `${base} ${add || "Pulse"}`;
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
