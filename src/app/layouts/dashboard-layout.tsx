export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div>侧边栏</div>
      <div>顶部</div>
      {children}
    </div>
  );
}
