export function AuthMethodsSeparator() {
  return (
    <div className="my-3 flex shrink items-center justify-center gap-2">
      <div className="grow basis-0 border-b border-neutral-200" />
      <span className="text-content-muted text-xs leading-none font-medium uppercase">
        or
      </span>
      <div className="grow basis-0 border-b border-neutral-200" />
    </div>
  );
}
