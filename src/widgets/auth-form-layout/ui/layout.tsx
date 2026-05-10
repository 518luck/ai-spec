import { PropsWithChildren } from "react";

export default function AuthFormLayout({
  children,
  showTerms = "app",
}: PropsWithChildren<{ showTerms?: "app" | "partner" }>) {
  return (
    <div className="flex h-full w-full max-w-sm min-w-0 flex-col">
      <div className="h-8 md:h-12" />
      <div className="flex flex-1 items-center">
        <div className="w-full">{children}</div>
      </div>
      <div className="pt-8">
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
