import { AppProviders } from "@/app/providers";

type RootLayoutShellProps = Readonly<{
  children: React.ReactNode;
}>;

export function RootLayoutShell({ children }: RootLayoutShellProps) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full bg-app text-ink">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
