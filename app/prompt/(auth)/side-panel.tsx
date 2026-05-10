import InteractiveGridPatternDemo from "./grid-pattern-background";

export function SidePanel() {
  return (
    <InteractiveGridPatternDemo>
      <div className="bg-background relative hidden h-full overflow-hidden border-l border-gray-500 min-[900px]:flex" />
    </InteractiveGridPatternDemo>
  );
}
