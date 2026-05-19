import { createUserAccountAction } from "@/shared/lib/actions/create-user-account";
import { Button } from "@/shared/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/shared/ui/input-otp";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";

export function VerifyEmailForm() {
  const [value, setValue] = useState("");
  const { executeAsync, isPending } = useAction(createUserAccountAction, {
    async onSuccess() {},
  });

  return (
    <div className="flex flex-col items-center">
      <InputOTP
        maxLength={6}
        value={value}
        onChange={(value) => setValue(value)}
        onClick={(code) => {
          console.log("6位验证码:", code);

          // 这里调用接口
          // verifyEmail(code)
        }}
      >
        <InputOTPGroup className="gap-4 border-0 ring-0">
          <InputOTPSlot
            className="bg-background/60 h-14 w-13 rounded-xl border backdrop-blur-xs"
            index={0}
          />
          <InputOTPSlot
            className="bg-background/60 h-14 w-13 rounded-xl border backdrop-blur-xs"
            index={1}
          />
          <InputOTPSlot
            className="bg-background/60 h-14 w-13 rounded-xl border backdrop-blur-xs"
            index={2}
          />
          <InputOTPSlot
            className="bg-background/60 h-14 w-13 rounded-xl border backdrop-blur-xs"
            index={3}
          />
          <InputOTPSlot
            className="bg-background/60 h-14 w-13 rounded-xl border backdrop-blur-xs"
            index={4}
          />
          <InputOTPSlot
            className="bg-background/60 h-14 w-13 rounded-xl border backdrop-blur-xs"
            index={5}
          />
        </InputOTPGroup>
      </InputOTP>
      <Button className="w-full"></Button>
    </div>
  );
}
