import { z } from "zod";
// import { $, file } from "bun";

import {
  workflowAPIType,
  snapshotType,
  type CustomNodesDeps,
} from "./workflowAPIType";
import { getBranchInfo } from "./getBranchInfo";
type ExtensionNodeMap = Record<
  string,
  [
    string[],
    {
      title_aux: string;
    },
  ]
>;
type CustomNodeList = {
  custom_nodes: {
    author: string;
    title: string;
    reference: string;
    pip: string[];
    files: string[];
    install_type: string;
    description: string;
  }[];
};

export type WorkflowAPIType = z.infer<typeof workflowAPIType>;
export type SnapshotType = z.infer<typeof snapshotType>;
// const cacheFilePath = file("./cache/extension-node-map.json");
export async function computeCustomNodesMap({
  workflow_api,
  snapshot,
  includeNodes,
  extensionNodeMap,
}: {
  workflow_api: WorkflowAPIType;
  snapshot?: SnapshotType;
  includeNodes?: boolean;
  extensionNodeMap?: ExtensionNodeMap;
}) {
  const data = (
    extensionNodeMap
      ? extensionNodeMap
      : await (
          await fetch(
            "https://raw.githubusercontent.com/ltdrdata/ComfyUI-Manager/main/extension-node-map.json",
          )
        ).json()
  ) as ExtensionNodeMap;

  const custom_nodes = (await (
    await fetch(
      "https://raw.githubusercontent.com/ltdrdata/ComfyUI-Manager/main/custom-node-list.json",
    )
  ).json()) as CustomNodeList;

  console.log("Getting extension-node-map.json");

  // if (!cacheExist) {
  //   console.log("Cache file not found, creating one");
  //   await $`mkdir -p ./cache`;
  //   await $`echo ${JSON.stringify(data, null, 2)} > ${cacheFilePath}`;
  // }

  const crossCheckedApi = Object.entries(workflow_api)
    .map(([_, value]) => {
      const classType = value.class_type;
      const classTypeData = classType
        ? Object.entries(data).find(([_, nodeArray]) =>
            nodeArray[0].includes(classType),
          )
        : undefined;
      return classTypeData ? { node: value, classTypeData } : null;
    })
    .filter((item) => item !== null);

  // console.log(crossCheckedApi);
  const groupedByAuxName = crossCheckedApi.reduce(
    async (_acc, data) => {
      if (!data) return _acc;
      const acc = await _acc;

      const { node, classTypeData } = data;
      const auxName = classTypeData[1][1].title_aux;
      if (!acc[classTypeData[0]]) {
        // console.log(auxName);
        let warning: string | undefined = undefined;
        let url: string | undefined = classTypeData[0];
        let customNodeHash = snapshot?.git_custom_nodes[classTypeData[0]]?.hash;

        if (url == "https://github.com/comfyanonymous/ComfyUI") {
          customNodeHash = snapshot?.comfyui;
        }

        if (!customNodeHash) {
          if (classTypeData[0].endsWith(".git")) {
            url = classTypeData[0].split("/").pop()?.split(".")[0];
            if (url) customNodeHash = snapshot?.git_custom_nodes[url]?.hash;
          } else {
            url = classTypeData[0] + ".git";
            if (url) customNodeHash = snapshot?.git_custom_nodes[url]?.hash;
          }

          if (!customNodeHash && url) {
            const info = await getBranchInfo(url);
            if (info) {
              customNodeHash = info.commit.sha;
            }
            warning = "No hash found in snapshot, using latest commit hash";
          }
        }
        //   console.log(url, customNodeHash);
        acc[classTypeData[0]] = {
          url: classTypeData[0],
          name: auxName,
          hash: customNodeHash,
        };

        if (warning) {
          acc[classTypeData[0]].warning = warning;
        }

        if (includeNodes) {
          acc[classTypeData[0]].node = [];
        }

        const custom_node_details = custom_nodes.custom_nodes.find((x) =>
          x.files.includes(classTypeData[0]),
        );
        if (custom_node_details && custom_node_details.pip) {
          acc[classTypeData[0]].pip = custom_node_details.pip;
        }
      }
      if (includeNodes) acc[classTypeData[0]].node?.push(node);
      return acc;
    },
    Promise.resolve({} as CustomNodesDeps),
  );

  return groupedByAuxName;
}
