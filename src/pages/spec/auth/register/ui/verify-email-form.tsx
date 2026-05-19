import { useMediaQuery } from "@/shared/hooks/use-media-query";
import { createUserAccountAction } from "@/shared/lib/actions/create-user-account";
import { Button } from "@/shared/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/shared/ui/input-otp";
import { Spinner } from "@/shared/ui/spinner";
import { useAction } from "next-safe-action/hooks";
import router from "next/router";
import { useState } from "react";
import { toast } from "sonner";
import { useRegisterContext } from "../model/register-context";

export function VerifyEmailForm() {
  const { email, password } = useRegisterContext();
  const { isMobile } = useMediaQuery();
  const [code, setCode] = useState("");
  const [isInvalidCode, setIsInvalidCode] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // 校验code 同时创建账户
  const { executeAsync, isPending } = useAction(createUserAccountAction, {
    async onSuccess() {
      toast.success("正在创建账户...");
      setIsRedirecting(true);
      // 不保留url历史
      router.replace("/");
    },
    onError({ error }) {
      toast.error(error.serverError);
      setCode("");
      setIsInvalidCode(true);
    },
  });

  return (
    <div className="flex flex-col items-center">
      <InputOTP
        maxLength={6}
        value={code}
        onChange={(value) => {
          setIsInvalidCode(false);
          setCode(value);
        }}
        autoFocus={!isMobile} //非移动端自动聚焦
        // 自动提交
        onComplete={(completedCode) => {
          executeAsync({ email, password, code: completedCode });
        }}
      >
        <InputOTPGroup className="gap-4 border-0 ring-0">
          <InputOTPSlot
            className="bg-background/60 h-14 w-13 rounded-xl border backdrop-blur-xs"
            index={0}
            aria-invalid={isInvalidCode}
          />
          <InputOTPSlot
            className="bg-background/60 h-14 w-13 rounded-xl border backdrop-blur-xs"
            index={1}
            aria-invalid={isInvalidCode}
          />
          <InputOTPSlot
            className="bg-background/60 h-14 w-13 rounded-xl border backdrop-blur-xs"
            index={2}
            aria-invalid={isInvalidCode}
          />
          <InputOTPSlot
            className="bg-background/60 h-14 w-13 rounded-xl border backdrop-blur-xs"
            index={3}
            aria-invalid={isInvalidCode}
          />
          <InputOTPSlot
            className="bg-background/60 h-14 w-13 rounded-xl border backdrop-blur-xs"
            index={4}
            aria-invalid={isInvalidCode}
          />
          <InputOTPSlot
            className="bg-background/60 h-14 w-13 rounded-xl border backdrop-blur-xs"
            index={5}
            aria-invalid={isInvalidCode}
          />
        </InputOTPGroup>
      </InputOTP>

      {isInvalidCode ? (
        <p id="otp-error" className="text-destructive mt-3 text-center text-sm">
          验证码错误，请重新输入
        </p>
      ) : null}

      <Button
        className="bg-primary/70 hover:bg-primary/80 mt-8 flex w-full items-center backdrop-blur-md"
        type="submit"
        disabled={!code || code.length < 6}
      >
        {(isPending || isRedirecting) && <Spinner />}
        {isPending ? "验证中..." : "继续"}
      </Button>
    </div>
  );
}
