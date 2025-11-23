export interface ImageModel {
  id: string;
  name: string;
  provider: "runware" | "deepinfra";
}

export const RUNWARE_MODELS: ImageModel[] = [
  {
    id: "flux-schnell",
    name: "FLUX.1 Schnell (Runware)",
    provider: "runware"
  }
];

export const DEEPINFRA_MODELS: ImageModel[] = [
  {
    id: "black-forest-labs/FLUX.1-dev",
    name: "FLUX.1 Dev (DeepInfra)",
    provider: "deepinfra"
  },
  {
    id: "stabilityai/stable-diffusion-xl-base-1.0",
    name: "SDXL 1.0 Base",
    provider: "deepinfra"
  },
  {
    id: "SG161222/Realistic_Vision_V6.0_B1_noVAE",
    name: "Realistic Vision V6",
    provider: "deepinfra"
  },
  {
    id: "juggernaut-xl/Juggernaut_XL",
    name: "Juggernaut XL",
    provider: "deepinfra"
  }
];

export const ALL_MODELS: ImageModel[] = [...RUNWARE_MODELS, ...DEEPINFRA_MODELS];

