export interface HFModel {
  id: string;
  label: string;
  category: string;
}

export const HF_MODELS: HFModel[] = [
  {
    id: "SG161222/Realistic_Vision_V6.0_B1_noVAE",
    label: "Realistic Vision V6 (Photorealistic)",
    category: "Realism",
  },
  {
    id: "RunDiffusion/Juggernaut-XL-Version9",
    label: "Juggernaut XL V9 (Cinematic)",
    category: "Cinematic",
  },
  {
    id: "Lykon/dreamshaper-8",
    label: "DreamShaper 8 (Fantasy / Sci-Fi)",
    category: "Stylized",
  },
  {
    id: "stabilityai/stable-diffusion-2-1",
    label: "Deliberate (Balanced Realism)",
    category: "All-Rounder",
  },
  {
    id: "cyberdelia/CyberRealistic",
    label: "CyberRealistic (Ultra Realistic Faces)",
    category: "Faces",
  },
  {
    id: "prompthero/openjourney",
    label: "OpenJourney v4 (Midjourney Style)",
    category: "Stylized",
  },
  {
    id: "ItsJayQz/SynthwavePunk-v2",
    label: "SynthwavePunk v2 (Retro/Neon)",
    category: "Retro",
  },
];

