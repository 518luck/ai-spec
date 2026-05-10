import { PropsWithChildren } from "react";

export default function AuthFormLayout({
  children,
  showTerms = "app",
}: PropsWithChildren<{ showTerms?: "app" | "partner" }>) {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-between">
      <div className="grow basis-0">
        <div className="h-24" />
      </div>

      <div className="flex w-full flex-1 items-center justify-center">
        {children}
      </div>

      <div className="flex grow basis-0 flex-col justify-end">
        {showTerms && (
          <p className="px-20 py-8 text-center text-xs font-medium text-neutral-500 md:px-0">
            By continuing, you agree to Dub&rsquo;s{" "}
            <a
              href={`https://dub.co/legal/${showTerms === "app" ? "terms" : "partners"}`}
              target="_blank"
              className="font-semibold text-neutral-600 hover:text-neutral-800"
            >
              {showTerms === "app" ? "Terms of Service" : "Partner Terms"}
            </a>{" "}
            and{" "}
            <a
              href="https://dub.co/legal/privacy"
              target="_blank"
              className="font-semibold text-neutral-600 hover:text-neutral-800"
            >
              Privacy Policy
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
