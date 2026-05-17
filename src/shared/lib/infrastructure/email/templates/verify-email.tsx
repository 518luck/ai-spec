import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "react-email";
import { Footer } from "../components/footer";

const DUB_WORDMARK = "https://assets.dub.co/wordmark.png";

export default function VerifyEmail({
  email = "panic@thedis.co",
  code = "123456",
}: {
  email: string;
  code: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Dub 验证码</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[600px] rounded border border-solid border-neutral-200 px-10 py-5">
            <Section className="mt-8">
              <Img src={DUB_WORDMARK} height="32" alt="Dub" />
            </Section>
            <Heading className="mx-0 my-7 p-0 text-xl font-medium text-black">
              请确认您的邮箱地址
            </Heading>
            <Text className="mx-auto text-sm leading-6">
              在 Dub 验证页面输入此验证码以完成注册：
            </Text>
            <Section className="my-8 rounded-lg border border-solid border-neutral-200">
              <div className="mx-auto w-fit px-6 py-3 text-center font-mono text-2xl font-semibold tracking-[0.25em]">
                {code}
              </div>
            </Section>
            <Text className="text-sm leading-6 text-black">
              此验证码 10 分钟后过期。
            </Text>
            <Footer email={email} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
