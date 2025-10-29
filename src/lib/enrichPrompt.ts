// 🧠 Unified Prompt Enrichment System
// Expands user input into detailed descriptions for both music and image generation

import styles from './prompt_enrichment.json';

export interface EnrichedPrompts {
  musicPrompt: string;
  imagePrompt: string;
  combinedPrompt: string;
  detectedIntent: string;
  confidence: number;
}

// Fallback templates for when no specific intent is detected
const DEFAULT_TEMPLATES = {
  music: "experimental electronic music with creative sound design, innovative techniques, rhythmic elements, and artistic expression",
  image: "experimental artistic scene with creative visual elements, innovative composition, and avant-garde aesthetic",
  confidence: 0.5
};

/**
 * Detects the primary intent from user input using the comprehensive style mapping
 */
function detectIntent(userPrompt: string): { intent: string; confidence: number } {
  const lowerPrompt = userPrompt.toLowerCase();
  let bestMatch = { intent: 'experimental', confidence: 0 };

  // Check each style category for keyword matches
  for (const [styleKey, styleData] of Object.entries(styles)) {
    const keywords = [
      styleKey, // The key itself (e.g., "gaming", "lofi")
      ...getStyleKeywords(styleKey) // Additional keywords for each style
    ];
    
    const keywordMatches = keywords.filter(keyword => 
      lowerPrompt.includes(keyword.toLowerCase())
    );
    
    if (keywordMatches.length > 0) {
      // Calculate confidence based on number of matches and keyword specificity
      const baseConfidence = 0.8;
      const matchBonus = Math.min(keywordMatches.length * 0.1, 0.2);
      const confidence = Math.min(baseConfidence + matchBonus, 1.0);
      
      if (confidence > bestMatch.confidence) {
        bestMatch = { intent: styleKey, confidence };
      }
    }
  }

  return bestMatch;
}

/**
 * Get additional keywords for each style category
 */
function getStyleKeywords(styleKey: string): string[] {
  const keywordMap: Record<string, string[]> = {
    gaming: ['game', 'roblox', 'minecraft', 'fortnite', 'arcade', 'retro gaming', 'video game'],
    lofi: ['lo-fi', 'chill', 'study', 'relaxing', 'peaceful', 'calm', 'zen', 'meditation'],
    cinematic: ['epic', 'orchestral', 'movie', 'film', 'dramatic', 'heroic', 'grand', 'sweeping', 'soundtrack'],
    ambient: ['atmospheric', 'ethereal', 'space', 'cosmic', 'floating', 'dreamy', 'otherworldly'],
    trap: ['trap beats', '808', 'urban', 'street', 'hard-hitting'],
    hiphop: ['hip-hop', 'rap', 'boom-bap', 'street', 'urban culture'],
    rock: ['electric guitar', 'driving', 'powerful', 'rebellious'],
    metal: ['heavy', 'distorted', 'aggressive', 'thunderous', 'gothic'],
    pop: ['catchy', 'upbeat', 'mainstream', 'radio-friendly'],
    retro: ['vintage', '80s', 'nostalgic', 'analog', 'classic'],
    cyberpunk: ['futuristic', 'dystopian', 'neon', 'high-tech', 'urban'],
    fantasy: ['magical', 'mystical', 'heroic', 'medieval', 'enchanted'],
    dreamy: ['ethereal', 'floating', 'otherworldly', 'whimsical'],
    surreal: ['experimental', 'abstract', 'dreamlike', 'avant-garde'],
    vaporwave: ['slowed-down', '80s aesthetic', 'nostalgic', 'lo-fi'],
    classical: ['orchestral', 'elegant', 'sophisticated', 'refined'],
    jazz: ['improvisational', 'sophisticated', 'saxophone', 'piano'],
    rnb: ['soulful', 'romantic', 'groovy', 'smooth'],
    acoustic: ['folk', 'guitar', 'piano', 'organic', 'natural', 'unplugged', 'intimate'],
    dark: ['gothic', 'moody', 'melancholy', 'sad', 'brooding', 'ominous', 'haunting', 'shadowy'],
    futuristic: ['cutting-edge', 'advanced', 'next-generation', 'high-tech'],
    ethereal: ['celestial', 'angelic', 'transcendent', 'spiritual', 'mystical'],
    'sci-fi': ['space-age', 'cosmic', 'interstellar', 'technological'],
    nostalgic: ['sentimental', 'warm memories', 'vintage', 'heartfelt'],
    horror: ['chilling', 'dissonant', 'eerie', 'terrifying', 'suspenseful'],
    upbeat: ['happy', 'joyful', 'cheerful', 'positive', 'energetic', 'uplifting', 'bright', 'sunny'],
    melancholic: ['emotional', 'introspective', 'bittersweet', 'contemplative'],
    energetic: ['driving', 'powerful', 'intense', 'electrifying'],
    peaceful: ['serene', 'calming', 'tranquil', 'meditative', 'soothing'],
    experimental: ['creative', 'innovative', 'unconventional', 'artistic']
  };
  
  return keywordMap[styleKey] || [];
}

/**
 * Build creative, narrative-style music prompt
 * Compressed to stay under Kie.ai's 500 character limit
 */
export function buildMusicPrompt(userPrompt: string) {
  const lowerPrompt = userPrompt.toLowerCase();
  
  // Detect style and create narrative description
  let narrativePrompt = "";
  
  if (/game|gaming|roblox|geometry dash|edm|synthwave|dnb|drum and bass|dubstep/i.test(lowerPrompt)) {
    narrativePrompt = `A high-energy ${/dubstep/i.test(lowerPrompt) ? 'dubstep' : 'electronic'} ${/anthem/i.test(lowerPrompt) ? 'anthem' : 'track'} inspired by ${userPrompt} — thundering basslines, ${/roblox|gaming|game/i.test(lowerPrompt) ? 'playful synths, and glitchy drops' : 'driving rhythms, and electrifying synth melodies'}`;
  } else if (/cinematic|orchestral|film|epic/i.test(lowerPrompt)) {
    narrativePrompt = `An epic ${/cinematic|film/i.test(lowerPrompt) ? 'cinematic orchestral' : 'orchestral'} composition inspired by ${userPrompt} — sweeping strings, powerful brass sections, dramatic crescendos, and emotional depth`;
  } else if (/lofi|chill|relaxing|study|peaceful/i.test(lowerPrompt)) {
    narrativePrompt = `A ${/lofi/i.test(lowerPrompt) ? 'lofi' : 'chill'} melody inspired by ${userPrompt} — soft analog textures, gentle piano chords, warm vinyl crackle, and laid-back grooves`;
  } else {
    // Creative default for other prompts
    narrativePrompt = `Creative music inspired by ${userPrompt} — dynamic arrangement, expressive melodies, rich instrumentation, and engaging rhythms`;
  }

  // Clean and compress
  let finalPrompt = narrativePrompt.replace(/\s+/g, " ").trim();

  // Enforce max length (Kie.ai limit ≈ 500 chars)
  if (finalPrompt.length > 490) {
    console.warn("⚠️ [PROMPT TRUNCATED] Exceeded 500-char limit. Length:", finalPrompt.length);
    finalPrompt = finalPrompt.slice(0, 490);
  }

  console.log("[PROMPT LENGTH]", finalPrompt.length, "chars");
  console.log("🎵 [CREATIVE PROMPT] Music:", finalPrompt);
  
  return finalPrompt;
}

/**
 * Build creative, narrative-style image prompt
 */
export function buildImagePrompt(userPrompt: string) {
  const lowerPrompt = userPrompt.toLowerCase();
  const prompt = userPrompt.trim();
  
  // Detect the primary style/intent from the user prompt
  const { intent } = detectIntent(prompt);
  
  // Get the enriched image description from the mapping
  const styleMapping = styles[intent as keyof typeof styles];
  const enrichedImageDescription = styleMapping?.image || styles.experimental.image;
  
  // Create narrative-style visual description
  let visualPrompt = "";
  
  if (/game|gaming|roblox|geometry dash/i.test(lowerPrompt)) {
    visualPrompt = `A neon futuristic ${/roblox/i.test(lowerPrompt) ? 'Roblox' : 'gaming'} arena with glowing avatars, energy bursts, cyber city lights, vibrant colors, dynamic action, and cutting-edge visuals in 2K cinematic quality, 16:9 aspect ratio`;
  } else if (/geometry dash/i.test(lowerPrompt)) {
    visualPrompt = `A geometric digital landscape inspired by ${prompt} — neon grid patterns, rhythmic obstacles, dynamic shapes, vibrant color gradients, and cinematic 2K resolution, 16:9 aspect ratio`;
  } else if (/cinematic|orchestral|film|epic/i.test(lowerPrompt)) {
    visualPrompt = `A cinematic ${/cinematic|film/i.test(lowerPrompt) ? 'cinematic' : 'dramatic'} scene visualizing ${prompt} — epic landscapes, dramatic lighting, sweeping vistas, theatrical composition, and 2K cinematic quality, 16:9 aspect ratio`;
  } else if (/lofi|chill/i.test(lowerPrompt)) {
    visualPrompt = `A ${/lofi/i.test(lowerPrompt) ? 'nostalgic lofi' : 'serene'} aesthetic visualizing ${prompt} — warm tones, soft lighting, cozy atmosphere, vintage textures, and 2K cinematic quality, 16:9 aspect ratio`;
  } else {
    // Creative default with enriched description
    visualPrompt = `A stunning visual representation of ${prompt}, ${enrichedImageDescription}, cinematic lighting, 16:9 aspect ratio, ultra-detailed textures, high contrast, professional composition, 2K resolution quality`;
  }
  
  // Clean up
  const enrichedPrompt = visualPrompt.replace(/\s+/g, " ").trim();
  
  console.log(`🖼️ [ENRICHED IMAGE] Detected intent: ${intent}`);
  console.log(`🖼️ [CREATIVE PROMPT] Image: ${enrichedPrompt}`);
  
  return enrichedPrompt;
}

/**
 * Enriches a user prompt with detailed descriptions for music and image generation
 */
export function enrichPrompt(userPrompt: string): EnrichedPrompts {
  if (!userPrompt || userPrompt.trim().length === 0) {
    throw new Error('User prompt cannot be empty');
  }

  const { intent, confidence } = detectIntent(userPrompt);
  
  // Get the style mapping from JSON or use default
  const styleMapping = styles[intent as keyof typeof styles] || DEFAULT_TEMPLATES;
  
  // Create enriched prompts with structured, high-energy focus
  const musicPrompt = `
Create original, structured music inspired by "${userPrompt}".
Focus on rhythm, energy, and arrangement matching the requested genre and mood.

⚙️ Guidelines:
- If the style implies energy (gaming, edm, dnb, trap, pop, rock, metal): 
  emphasize strong rhythm, clear structure, melodic build-ups, and dynamic percussion.
- If the style implies chill (lofi, ambient, cinematic): 
  keep soft textures and relaxed pacing.
- Avoid describing as "ambient" or "soundscape" unless explicitly requested.
- Use descriptors like "anthem", "beat", "track", or "composition" instead.
- Include genre-appropriate BPM (e.g., 120–150 for energetic, 70–90 for chill).
- Ensure it sounds intentionally produced, not generative background audio.

Output format: short, focused text suitable for an AI music generation model.
`.trim();

  const imagePrompt = `${userPrompt}, ${styleMapping.image}`;
  const combinedPrompt = `${userPrompt} | Music: ${musicPrompt} | Visual: ${imagePrompt}`;

  // Post-filter to remove unwanted ambient keywords
  const cleanedMusicPrompt = musicPrompt
    .replace(/\bambient\b/gi, "")
    .replace(/\bgenerative soundscape\b/gi, "")
    .replace(/\brelaxation\b/gi, "")
    .replace(/\bbackground\b/gi, "")
    .replace(/\bmeditative\b/gi, "")
    .replace(/\bdrones\b/gi, "")
    .trim();

  console.log(`🎯 [EnrichPrompt] Detected intent: ${intent} (confidence: ${confidence.toFixed(2)})`);
  console.log(`🎵 [EnrichPrompt] Structured music prompt: ${cleanedMusicPrompt}`);
  console.log(`🖼️ [EnrichPrompt] Image prompt: ${imagePrompt}`);
  console.log(`⚡ [ENRICHMENT] Music energy bias corrected for ${intent} style`);
  console.log(`🧹 [ENRICHMENT] Ambient keywords filtered from music prompt`);

  return {
    musicPrompt: cleanedMusicPrompt,
    imagePrompt,
    combinedPrompt,
    detectedIntent: intent,
    confidence
  };
}

/**
 * Get available intent categories for debugging/analytics
 */
export function getAvailableIntents(): string[] {
  return Object.keys(styles);
}

/**
 * Test function to validate compressed prompt system
 */
export function testCompressedPrompts(): void {
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

  console.log('🧪 Testing compressed prompt system:');
  testCases.forEach(testCase => {
    const musicPrompt = buildMusicPrompt(testCase);
    const imagePrompt = buildImagePrompt(testCase);
    
    console.log(`\n📝 Input: "${testCase}"`);
    console.log(`🎵 Music Prompt (${musicPrompt.length} chars):`);
    console.log(musicPrompt);
    console.log(`🖼️ Image Prompt (${imagePrompt.length} chars):`);
    console.log(imagePrompt);
    console.log('─'.repeat(80));
  });
}
