"use client";

import { AuthMethodsSeparator } from "@/shared/ui/auth-methods-separator";
// import { SignUpEmail } from "./signup-email";
// import { SignUpOAuth } from "./signup-oauth";

export const SignUpForm = ({
  methods = ["email", "google", "github"],
}: {
  methods?: ("email" | "google" | "github")[];
}) => {
  return (
    <>
      <div className="flex flex-col gap-3 p-1">
        {/* {methods.includes("email") && <SignUpEmail />} */}
        {methods.length && <AuthMethodsSeparator />}
        {/* <SignUpOAuth methods={methods} /> */}
      </div>
    </>
  );
};
