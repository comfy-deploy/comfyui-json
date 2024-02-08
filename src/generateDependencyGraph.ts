import { computeCustomModelsMap } from "./computeCustomModelsMap";
import { computeExternalFilesMap } from "./computeExternalFilesMap";
import {
  computeCustomNodesMap,
  type SnapshotType,
  type WorkflowAPIType,
} from "./computeCustomNodesMap";
import { z } from "zod";
import { CustomNodesDepsType, FileReferenceType } from ".";
import type { FileGroup } from "./computeFileMap";
import { FileReferencesType, type CustomNodesDeps } from "./workflowAPIType";

export const DependencyGraphType = z.object({
  comfyui: z.string(),
  custom_nodes: CustomNodesDepsType,
  models: FileReferencesType,
  files: FileReferencesType,
});

export async function generateDependencyGraph(
  workflow_api: WorkflowAPIType,
  snapshot: SnapshotType,
  computeFileHash?: (path: string) => Promise<string | undefined>,
  handleFileUpload?: (
    path: string,
    hash: string,
    prevHash?: string,
  ) => Promise<string>,
  existingDependencies?: z.infer<typeof DependencyGraphType>,
) {
  const deps = await computeCustomNodesMap({
    workflow_api,
    snapshot,
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
