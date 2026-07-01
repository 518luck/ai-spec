import { appendFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import type { LogLevel, LogEvent } from "@axiomhq/logging";
import type { Transport } from "@axiomhq/logging";

// 本地日志文件路径（项目根 logs/server.log）
const LOG_FILE = resolve(process.cwd(), "logs/server.log");
// 仅开发环境启用本地文件日志：生产不落盘，避免敏感信息泄露与文件无限增长
const isDev = process.env.NODE_ENV !== "production";

// 日志目录只需创建一次，用标志位避免重复系统调用
let dirReady = false;

// 确保日志目录存在；失败时静默（文件不可写不应影响业务）
const ensureLogDir = async (): Promise<void> => {
  if (dirReady) return;
  await mkdir(dirname(LOG_FILE), { recursive: true });
  dirReady = true;
};

// 把 ISO 时间格式化为「YYYY-MM-DD HH:mm:ss.SSS」便于翻阅定位
const formatTime = (iso: string): string =>
  `${iso.slice(0, 10)} ${iso.slice(11, 23)}`;

// 把单条 LogEvent 渲染成单行可读文本，格式：
// 时间 LEVEL [module] message {fields(json)}
// fields 包含结构化字段及错误的完整 stack，人能翻阅、AI 能解析
const renderLine = (ev: LogEvent): string => {
  const level = (ev.level as string).toUpperCase().padEnd(5);
  const time = formatTime(ev._time ?? new Date().toISOString());
  const moduleName = (ev.fields as Record<string, unknown>)?.module ?? "-";
  const fields = { ...ev.fields };
  delete fields.module;
  const fieldsStr =
    Object.keys(fields).length > 0 ? ` ${JSON.stringify(fields)}` : "";
  return `${time} ${level} [${moduleName}] ${ev.message}${fieldsStr}\n`;
};

// Axiom 自定义 Transport：开发环境把日志追加写入本地 logs/server.log
// 实现 @axiomhq/logging 的 Transport 接口（log + flush），与 AxiomJSTransport / ConsoleTransport 并列挂载
export class LocalFileTransport implements Transport {
  // Axiom 批量传入日志事件，逐条渲染后一次性追加写盘
  log: Transport["log"] = (logs: LogEvent[]): void => {
    if (!isDev) return;
    const content = logs.map(renderLine).join("");
    void ensureLogDir().then(() => appendFile(LOG_FILE, content, "utf8"));
  };

  // 本地文件每次 append 即落盘，无需缓冲 flush
  flush: Transport["flush"] = (): void => {};
}

// 供按级别过滤时使用的 LogLevel（保持与 Axiom 一致的类型）
export type { LogLevel };
