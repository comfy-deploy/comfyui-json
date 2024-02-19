import { computeFileMap, type ComputeFileMapProps } from "./computeFileMap";

export async function computeCustomModelsMap(props: ComputeFileMapProps) {
  const resourcesMapping: Record<
    string,
    {
      inputs: {
        name: string;
        type: string;
      }[];
    }
  > = {
    CheckpointLoaderSimple: {
      inputs: [
        {
          name: "ckpt_name",
          type: "checkpoints",
        },
      ],
    },
    IPAdapterModelLoader: {
      inputs: [
        {
          name: "ipadapter_file",
          type: "ipadapter",
        },
      ],
    },
    CLIPVisionLoader: {
      inputs: [
        {
          name: "clip_name",
          type: "clip_vision",
        },
      ],
    },
    LoraLoader: {
      inputs: [
        {
          name: "lora_name",
          type: "loras",
        },
      ],
    },
    VAELoader: {
      inputs: [
        {
          name: "vae_name",
          type: "vae",
        },
      ],
    },
    UNETLoader: {
      inputs: [
        {
          name: "unet_name",
          type: "unet",
        },
      ],
    },
    CLIPLoader: {
      inputs: [
        {
          name: "clip_name",
          type: "clip",
        },
      ],
    }
  };

  return computeFileMap({
    folder: "models",
    includeTypeInPath: true,
    map: resourcesMapping,
    ...props,
  });
}
