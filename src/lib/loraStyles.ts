export interface LoRAStyle {
  label: string;
  id: string;
  defaultScale: number;
}

export const LORA_STYLES: LoRAStyle[] = [
  {
    label: "Detail Tweaker XL (Intensity / Grit)",
    id: "civitai:122359@135867",
    defaultScale: 1.0
  },
  {
    label: "SDXL Inkdrawing (Raw Emotion)",
    id: "civitai:154918@173694",
    defaultScale: 0.9
  },
  {
    label: "Warm Light XL v2 (Nostalgia & Comfort)",
    id: "civitai:290860@592197",
    defaultScale: 0.8
  },
  {
    label: "Watercolor – Textured Paper (Soft Dreaminess)",
    id: "civitai:120789@131382",
    defaultScale: 0.7
  },
  {
    label: "Fine Tuned Detailed Eyes (Realistic Emotion)",
    id: "civitai:316969@355491",
    defaultScale: 0.8
  },
];

