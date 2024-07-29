import workflow_json  from "../workflow.json";
import workflow_api from "../api.json"
import { computeCustomNodesMapJson, computeCustomNodesMap } from "../computeCustomNodesMap";

// computeCustomNodesMap ({ workflow_api }).then((deps) => {
//    console.log(deps) 
// })

computeCustomNodesMapJson({ workflow_json }).then((deps) => {
  console.log(deps)
});
