// 邮箱领域：processors（消费端）+ enqueues（生产端）的统一出口
export { enqueueEmailChange } from "./enqueues/email-change";
export { enqueueEmailChangedNotice } from "./enqueues/email-changed-notice";
export { processEmailChange } from "./processors/email-change";
export { processEmailChangedNotice } from "./processors/email-changed-notice";
