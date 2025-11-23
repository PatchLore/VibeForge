export interface ImageModel {
  id: string;
  name: string;
  provider: "runware" | "deepinfra";
  supportsLora: boolean;
}

export const MODELS: ImageModel[] = [
  {
    id: "runware:101@1",              // FLUX.1 Schnell AIR ID
    name: "FLUX.1 Schnell",
    provider: "runware",
    supportsLora: true,
  },
  {
    id: "black-forest-labs/FLUX.1-dev",
    name: "FLUX.1 Dev",
    provider: "deepinfra",
    supportsLora: false,
  },
  {
    id: "stabilityai/stable-diffusion-xl-base-1.0",
    name: "SDXL 1.0 Base",
    provider: "deepinfra",
    supportsLora: false,
  },
  {
    id: "runware:realistic-vision-v6", // TODO: replace with real AIR ID from Runware if/when you add it
    name: "Realistic Vision V6",
    provider: "runware",
    supportsLora: true,
  },
  {
    id: "runware:juggernaut-xl", // TODO: replace with real AIR ID from Runware
    name: "Juggernaut XL",
    provider: "runware",
    supportsLora: true,
  },
];
