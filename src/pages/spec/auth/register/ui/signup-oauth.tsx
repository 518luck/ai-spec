import { Github, Google } from "@/shared/assets/icons";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";

export const SignUpOAuth = ({
  methods,
}: {
  methods: ("email" | "google" | "github")[];
}) => {
  // TODO: 添加一个跳转操作,用户登陆进来直接跳转到之前没登陆的页面

  const [clickedGoogle, setClickedGoogle] = useState(false);
  const [clickedGithub, setClickedGithub] = useState(false);

  useEffect(() => {
    // 当离开页面时，重置状态
    return () => {
      setClickedGoogle(false);
      setClickedGithub(false);
    };
  }, []);

  // 前端点击按钮
  //   ↓
  // 调用 NextAuth 的 signIn("google")
  //   ↓
  // 浏览器跳到 /api/auth/signin/google
  //   ↓
  // NextAuth 再把用户跳到 Google 授权页
  //   ↓
  // Google 登录成功后回调到 /api/auth/callback/google
  //   ↓
  // NextAuth 后端处理 code/state，创建用户、Account、Session
  //   ↓
  // 最后跳到 callbackUrl / redirectTo

  return (
    <>
      {methods.includes("google") && (
        <Button
          variant="secondary"
          onClick={() => {
            setClickedGoogle(true);
            signIn("google");
          }}
        >
          {clickedGoogle && <Spinner />}
          <Google />
          使用 Google 帐号继续
        </Button>
      )}
      {methods.includes("github") && (
        <Button
          variant="secondary"
          onClick={() => {
            setClickedGithub(true);
            signIn("github");
          }}
        >
          {clickedGithub && <Spinner />}
          <Github />
          使用 GitHub 帐号继续
        </Button>
      )}
    </>
  );
};
