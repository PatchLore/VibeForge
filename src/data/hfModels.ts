export interface HFModel {
  name: string;
  id: string;
}

export const HF_MODELS: HFModel[] = [
  {
    name: "Realistic Vision V6 (Photorealistic)",
    id: "SG161222/Realistic_Vision_V6.0_B1_noVAE"
  },
  {
    name: "Juggernaut XL V9 (Cinematic)",
    id: "stablediffusionapi/juggernaut-xl-v9"
  },
  {
    name: "DreamShaper 8 (Fantasy / Sci-Fi)",
    id: "Lykon/DreamShaper_8"
  },
  {
    name: "Deliberate (Balanced Realism)",
    id: "XpucT/DeliberateV2"
  },
  {
    name: "CyberRealistic (Ultra Realistic Faces)",
    id: "gsdf/CyberRealistic_V4"
  },
  {
    name: "OpenJourney v4 (Midjourney Style)",
    id: "prompthero/openjourney-v4"
  },
  {
    name: "SynthwavePunk v2 (Retro/Neon)",
    id: "ItsJayQz/SynthwavePunk-v2"
  }
];

