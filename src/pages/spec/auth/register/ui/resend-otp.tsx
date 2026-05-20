import { sendOtpAction } from "@/shared/lib/actions/send-otp";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";

export const ResendOtp = ({ email }: { email: string }) => {
  const [delaySeconds, setDelaySeconds] = useState(0);
  const [state, setState] = useState<"default" | "success" | "error">(
    "default",
  );

  const { executeAsync, isPending } = useAction(sendOtpAction, {
    onSuccess: () => {
      setState("success");
      setDelaySeconds(60);
    },
    onError: () => {
      setState("error");
      setDelaySeconds(5);
    },
  });

  useEffect(() => {
    if (delaySeconds <= 0) return;

    const timer = setTimeout(() => {
      setDelaySeconds((seconds) => Math.max(seconds - 1, 0));
    }, 1000);

    return () => clearTimeout(timer);
  }, [delaySeconds]);

  const currentState = delaySeconds > 0 ? state : "default";

  return (
    <div className="relative mt-4 text-center text-sm font-medium text-neutral-500">
      {currentState === "default" && (
        <>
          {/* {isPending && (
          )} */}
          <div className="absolute top-1/2 left-0 -translate-x-full -translate-y-1/2 pr-1.5">
            <Spinner className="h-3 w-3" />
          </div>

          <p className={cn(isPending && "opacity-80")}>
            未收到验证码？
            <Button
              variant="ghost"
              type="button"
              onClick={() => executeAsync({ email })}
              className={cn(
                "font-semibold text-neutral-400 transition-colors hover:text-neutral-300",
                isPending && "pointer-events-none",
              )}
            >
              重新发送
            </Button>
          </p>
        </>
      )}

      {currentState === "success" && (
        <p className="text-sm text-neutral-500">
          验证码发送成功。
          <Delay seconds={delaySeconds} />
        </p>
      )}

      {currentState === "error" && (
        <p className="text-sm text-neutral-500">
          验证码发送失败。 <Delay seconds={delaySeconds} />
        </p>
      )}
    </div>
  );
};

const Delay = ({ seconds }: { seconds: number }) => {
  return (
    <span className="ml-1 text-sm text-neutral-400 tabular-nums">
      {seconds}秒
    </span>
  );
};
