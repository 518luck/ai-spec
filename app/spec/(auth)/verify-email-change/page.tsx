import { VerifyEmailChangePage } from "@/pages/spec/auth/verify-email-change";

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return <VerifyEmailChangePage searchParams={searchParams} />;
}
