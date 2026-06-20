import { appConfig } from "@/shared/configs/app.config";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "react-email";
import { Footer } from "../components/footer";

// 邮箱变更确认邮件：魔法链接形态，收件人点击链接完成新邮箱验证；附带取消链接用于作废本次变更
export default function EmailChange({
  newEmail = "new@example.com",
  oldEmail = "old@example.com",
  url = "https://example.com/spec/confirm-email-change/xxx",
  cancelUrl = "https://example.com/spec/confirm-email-change/xxx?cancel=true",
}: {
  newEmail: string;
  oldEmail: string;
  url: string;
  cancelUrl: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>{`${appConfig.appName} 邮箱变更确认`}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-150 rounded border border-solid border-neutral-200 px-10 py-5">
            <Heading className="mx-0 my-0 mt-8 p-0 text-3xl font-extrabold text-black">
              {appConfig.appName}
            </Heading>
            <Heading className="mx-0 my-7 p-0 text-xl font-medium text-black">
              确认更换绑定邮箱
            </Heading>
            <Text className="mx-auto text-sm leading-6">
              我们检测到你的账户正在申请将绑定邮箱从
              <span className="font-medium"> {oldEmail} </span>
              更改为
              <span className="font-medium"> {newEmail} </span>。
            </Text>
            <Section className="my-8 text-center">
              <Link
                href={url}
                className="inline-block rounded-lg bg-black px-6 py-3 text-center text-sm font-semibold text-white no-underline"
              >
                确认更换邮箱
              </Link>
            </Section>
            <Text className="text-xs leading-5 break-all text-neutral-500">
              如果按钮无法点击，请直接访问以下链接：
              <br />
              {url}
            </Text>
            <Text className="text-sm leading-6 text-black">
              此链接 15 分钟后过期。
            </Text>
            <Text className="text-xs leading-5 text-neutral-500">
              非本人操作？
              <Link href={cancelUrl} className="text-neutral-700 underline">
                取消本次邮箱变更
              </Link>
              。
            </Text>
            <Footer email={newEmail} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
