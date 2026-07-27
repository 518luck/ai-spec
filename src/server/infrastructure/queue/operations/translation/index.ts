// Translation 领域：独立队列的 enqueues / processors / 路由出口
export { enqueueTranslateBatch } from "./enqueues/translate-batch";
export type { TranslateBatchResult } from "./processors/translate-batch";
export { processTranslateBatch } from "./processors/translate-batch";
export { processTranslationJob, type TranslationJobData } from "./router";
export type { TranslateBatchData, TranslationResourceType } from "./types";
