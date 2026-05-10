import AuthLayout from "@/app/layouts/auth-layouts/ui/auth-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthLayout>{children}</AuthLayout>;
}
