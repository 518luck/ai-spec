// # 规约领域 service 出口：每个用例一个文件，按需导入

export { createRule } from "./create-rule";
export { createRuleSpace } from "./create-rule-space";
export { deleteRule } from "./delete-rule";
export { deleteRules } from "./delete-rules";
export { getRuleById } from "./get-rule-by-id";
export { getRuleVersionDetail } from "./get-rule-version-detail";

// 规约领域空间
export { listRuleSpaces } from "./list-rule-spaces";
export { listRuleVersions } from "./list-rule-versions";
// 规约主资源
export { listRules } from "./list-rules";
export { updateRule } from "./update-rule";
// 规约版本
export { updateRuleAndVersion } from "./update-rule-and-version";
