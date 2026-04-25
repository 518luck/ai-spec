type InfoTileProps = {
  description: string;
  eyebrow: string;
  title: string;
};

export function InfoTile({ description, eyebrow, title }: InfoTileProps) {
  return (
    <article className="rounded-[1.75rem] border border-panel-border bg-panel p-5 shadow-[0_20px_60px_rgba(67,46,24,0.08)] backdrop-blur">
      <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted">
        {eyebrow}
      </p>
      <h3 className="mt-3 text-xl font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-muted">{description}</p>
    </article>
  );
}
