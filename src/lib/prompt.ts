/**
 * Simple prompt expansion function that adds emotion, setting, and tone to short user input
 */
export function expandPrompt(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  
  // Basic emotion detection
  const emotions = {
    happy: 'joyful and uplifting',
    sad: 'melancholic and introspective', 
    calm: 'peaceful and serene',
    energetic: 'dynamic and vibrant',
    dark: 'mysterious and atmospheric',
    dreamy: 'ethereal and floating',
    nostalgic: 'warm and reminiscent',
    romantic: 'tender and emotional',
    epic: 'grand and cinematic',
    chill: 'relaxed and mellow'
  };
  
  // Setting detection
  const settings = {
    city: 'urban metropolitan atmosphere',
    forest: 'natural woodland environment', 
    ocean: 'aquatic coastal setting',
    space: 'cosmic stellar landscape',
    night: 'nocturnal evening ambiance',
    morning: 'dawn sunrise atmosphere',
    sunset: 'golden hour twilight',
    rain: 'gentle precipitation mood',
    snow: 'winter crystalline scene',
    desert: 'arid sandy landscape'
  };
  
  // Tone detection
  const tones = {
    soft: 'gentle and delicate',
    loud: 'powerful and bold',
    fast: 'rapid and energetic',
    slow: 'leisurely and contemplative',
    bright: 'luminous and radiant',
    dim: 'subtle and understated',
    warm: 'cozy and inviting',
    cool: 'refreshing and crisp'
  };
  
  // Find matching emotions, settings, and tones
  let emotion = '';
  let setting = '';
  let tone = '';
  
  for (const [key, value] of Object.entries(emotions)) {
    if (lowerPrompt.includes(key)) {
      emotion = value;
      break;
    }
  }
  
  for (const [key, value] of Object.entries(settings)) {
    if (lowerPrompt.includes(key)) {
      setting = value;
      break;
    }
  }
  
  for (const [key, value] of Object.entries(tones)) {
    if (lowerPrompt.includes(key)) {
      tone = value;
      break;
    }
  }
  
  // Build expanded prompt
  let expanded = prompt;
  
  if (emotion) {
    expanded += ` with ${emotion} feeling`;
  }
  
  if (setting) {
    expanded += ` in a ${setting}`;
  }
  
  if (tone) {
    expanded += `, ${tone} mood`;
  }
  
  // Add some generic enhancements if no specific matches
  if (!emotion && !setting && !tone) {
    expanded += ` with rich emotional depth and atmospheric texture`;
  }
  
  return expanded;
}

// Re-export the existing function for backward compatibility
export { generateExpandedPrompt } from './promptExpansion';
