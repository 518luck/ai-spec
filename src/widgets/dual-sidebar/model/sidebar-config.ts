// 侧边栏宽度与折叠的配置常量（单位 px），集中维护便于核查与调整

// 存储用户拖拽后宽度与折叠状态的 cookie 名（layout 服务端读、客户端写）
export const SIDEBAR_WIDTH_COOKIE = "sidebar-width";
export const SIDEBAR_COLLAPSED_COOKIE = "sidebar-collapsed";

// 默认展开宽度，对应当前的 w-76（19rem = 304px），保证 Step 1 无视觉变化
export const SIDEBAR_DEFAULT_WIDTH = 304;

// 紧凑（折叠）态下整个 aside 的宽度：左图标栏 64 + 操作面板 64
export const SIDEBAR_COMPACT_WIDTH = 128;

// aside 宽度拖拽范围（Step 3 的 resize handle 使用）
export const SIDEBAR_MIN_WIDTH = 128;
export const SIDEBAR_MAX_WIDTH = 424;

// 拖拽松手时的折叠判定阈值（Step 4 使用）：aside 宽度小于此值则吸附为紧凑
export const SIDEBAR_COLLAPSE_THRESHOLD = 200;
