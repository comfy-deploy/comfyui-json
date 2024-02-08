import { computeCustomModelsMap } from "./computeCustomModelsMap";
import { computeExternalFilesMap } from "./computeExternalFilesMap";
import {
  computeCustomNodesMap,
  type ExtensionNodeMap,
  type SnapshotType,
  type WorkflowAPIType,
} from "./computeCustomNodesMap";
import { z } from "zod";
import { CustomNodesDepsType } from ".";
import { FileReferencesType } from "./workflowAPIType";

export const DependencyGraphType = z.object({
  comfyui: z.string(),
  custom_nodes: CustomNodesDepsType,
  models: FileReferencesType,
  files: FileReferencesType,
});

export async function generateDependencyGraph({
  workflow_api,
  snapshot,
  computeFileHash,
  handleFileUpload,
  existingDependencies,
  cachedExtensionsMap,
}: {
  workflow_api: WorkflowAPIType;
  snapshot: SnapshotType;
  computeFileHash?: (path: string) => Promise<string | undefined>;
  handleFileUpload?: (
    path: string,
    hash: string,
    prevHash?: string,
  ) => Promise<string>;
  existingDependencies?: z.infer<typeof DependencyGraphType>;
  cachedExtensionsMap: ExtensionNodeMap
}) {
  const deps = await computeCustomNodesMap({
    workflow_api,
    snapshot,
    extensionNodeMap: cachedExtensionsMap
  });
  const comfyuihash = deps["https://github.com/comfyanonymous/ComfyUI"].hash;
  delete deps["https://github.com/comfyanonymous/ComfyUI"];

  return {
    comfyui: comfyuihash,
    custom_nodes: deps,
    models: await computeCustomModelsMap({
      workflow_api,
      getFileHash: computeFileHash,
      // Skipping upload for models
      // handleFileUpload,
      // existingFiles: existingDependencies?.models,
    }),
    files: await computeExternalFilesMap({
      workflow_api,
      getFileHash: computeFileHash,
      handleFileUpload,
      existingFiles: existingDependencies?.files,
    }),
  };
}
