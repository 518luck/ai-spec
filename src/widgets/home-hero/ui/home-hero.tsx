import { InfoTile } from "@/shared/ui/info-tile";

const layers = [
  {
    eyebrow: "app",
    title: "应用壳与入口",
    description:
      "放路由入口、全局样式、providers。当前项目里，根目录 app 只保留 Next 特殊文件，真正实现放在 src/app。",
  },
  {
    eyebrow: "pages",
    title: "页面组装",
    description:
      "每个页面 slice 负责拼装 widgets 和 features。现在首页已经拆到 src/pages/home。",
  },
  {
    eyebrow: "widgets",
    title: "可复用页面区块",
    description:
      "HomeHero 是一个页面级 UI 区块，适合承载一个相对完整但可复用的展示模块。",
  },
  {
    eyebrow: "shared",
    title: "基础复用能力",
    description:
      "InfoTile 这种纯展示组件适合落在 shared/ui，避免和业务语义绑死。",
  },
];

export function HomeHero() {
  return (
    <section className="grid w-full gap-8 lg:grid-cols-[1.3fr_0.9fr] lg:items-start">
      <div className="rounded-[2rem] border border-panel-border bg-panel p-8 shadow-[0_24px_80px_rgba(67,46,24,0.12)] backdrop-blur sm:p-12">
        <p className="font-mono text-sm uppercase tracking-[0.35em] text-accent-strong">
          Prompt Shelf
        </p>
        <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight text-ink sm:text-6xl">
          一个按 FSD 组织的 Next.js 起始项目
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-muted sm:text-lg">
          这版改造的核心不是“把所有东西都塞进 src/app”，而是把 Next.js
          的特殊路由文件和真正的业务实现拆开。你后面新增页面时，通常只需要在根
          app 下保留一个很薄的路由入口，然后把页面实现继续写进 FSD 分层。
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.5rem] bg-[#fff7f0] p-5">
            <p className="text-sm font-mono uppercase tracking-[0.28em] text-accent-strong">
              路由入口
            </p>
            <p className="mt-3 text-sm leading-7 text-muted">
              根目录 <code>app/page.tsx</code> 现在只负责把首页导向
              <code>src/pages/home</code>。
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-[#f3f0ea] p-5">
            <p className="text-sm font-mono uppercase tracking-[0.28em] text-accent-strong">
              真实实现
            </p>
            <p className="mt-3 text-sm leading-7 text-muted">
              结构、组件、样式职责都拆进 <code>src</code>，后续扩展时不会让根目录越来越乱。
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {layers.map((layer) => (
          <InfoTile key={layer.eyebrow} {...layer} />
        ))}
      </div>
    </section>
  );
}
