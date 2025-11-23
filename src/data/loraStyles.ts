export interface LoRAStyle {
  name: string;
  airId: string;
}

export const LORA_STYLES: LoRAStyle[] = [
  // NOTE:
  // - These airId values are placeholders.
  // - You (Allen) will fill them with real Runware AIR IDs like "civitai:122359@135867"
  //   using Runware's model search once you pick final emotional LoRAs.
  {
    name: "Detail Tweaker XL (Intensity)",
    airId: "", // TODO: e.g. "civitai:122359@135867"
  },
  {
    name: "SDXL Inkdrawing (Ink Abstraction)",
    airId: "", // TODO
  },
  {
    name: "Cinematic Warm Light (SDXL version)",
    airId: "", // TODO
  },
  {
    name: "Expressive Watercolor (SDXL)",
    airId: "", // TODO
  },
  {
    name: "Detailed Eyes XL (Emotion Focus)",
    airId: "", // TODO
  },
];
