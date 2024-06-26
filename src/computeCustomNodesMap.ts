import { z } from "zod";

import {
  workflowAPIType,
  snapshotType,
  type CustomNodesDeps,
} from "./workflowAPIType";
import { getBranchInfo } from "./getBranchInfo";

export type ExtensionNodeMap = Record<
  string,
  [
    string[],
    {
      title: string;
      title_aux: string;
      nodename_pattern: string;
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
    nodename_pattern: string;
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
  pullLatestHashIfMissing = true,
}: {
  workflow_api: WorkflowAPIType;
  snapshot?: SnapshotType;
  includeNodes?: boolean;
  extensionNodeMap?: ExtensionNodeMap;
  pullLatestHashIfMissing?: boolean;
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

  // Black list nodes that are having too much conflicts
  const blacklistedUrls = ["https://github.com/Seedsa/Fooocus_Nodes"];
  Object.entries(data).forEach(([key, value]) => {
    if (blacklistedUrls.includes(key)) {
      delete data[key];
    }
  });

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

  const missingNodes: Set<string> = new Set();

  const crossCheckedApi = Object.entries(workflow_api)
    .map(([_, value]) => {
      const classType = value.class_type;
      // Collect all matches for the classType
      const classTypeMatches = classType
        ? Object.entries(data).filter(
          ([_, nodeArray]) =>
            nodeArray[0].includes(classType) ||
            (nodeArray[1].nodename_pattern &&
              new RegExp(nodeArray[1].nodename_pattern).test(classType)),
        )
        : [];

      // Detect conflict: more than one match found
      if (classTypeMatches.length > 1) {
        console.warn(`Conflict detected for classType '${classType}' in node pack '${classTypeMatches.reduce(
          (acc, curr, index, array) => acc + curr[1][1].title_aux + (index < array.length - 1 ? ", " : ""),
          ""
        )}': multiple matches found.`);
        // Handle the conflict, e.g., by choosing the first match, logging a warning, etc.
        // This example simply chooses the first match
      }

      const classTypeData = classTypeMatches.length == 1 ? classTypeMatches[0] : undefined;

      if (!classTypeData && value.class_type) {
        missingNodes.add(value.class_type);
      }
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

        if (!customNodeHash && pullLatestHashIfMissing) {
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
        if (custom_node_details) {
          acc[classTypeData[0]].files = custom_node_details.files
          acc[classTypeData[0]].install_type = custom_node_details.install_type
        }
      }
      if (includeNodes) acc[classTypeData[0]].node?.push(node);
      return acc;
    },
    Promise.resolve({} as CustomNodesDeps),
  );

  console.log("Missing nodes", missingNodes);

  return {
    customNodes: await groupedByAuxName,
    missingNodes: Array.from(missingNodes),
  };
}
