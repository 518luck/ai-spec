// 邮箱领域：processors（消费端）+ enqueues（生产端）的统一出口
export { processEmailChange } from "./processors/email-change";
export { processEmailChangedNotice } from "./processors/email-changed-notice";
export { enqueueEmailChange } from "./enqueues/enqueue-email-change";
export { enqueueEmailChangedNotice } from "./enqueues/enqueue-email-changed-notice";
