import { appConfig } from "@/shared/configs/app.config";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Tailwind,
  Text,
} from "react-email";
import { Footer } from "../components/footer";

// 邮箱变更成功通知：发送到老邮箱，提醒账户绑定邮箱已变更
export default function EmailChangedNotice({
  newEmail = "new@example.com",
}: {
  newEmail: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>{`${appConfig.appName} 邮箱已变更`}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-150 rounded border border-solid border-neutral-200 px-10 py-5">
            <Heading className="mx-0 my-0 mt-8 p-0 text-3xl font-extrabold text-black">
              {appConfig.appName}
            </Heading>
            <Heading className="mx-0 my-7 p-0 text-xl font-medium text-black">
              您的账户邮箱已变更
            </Heading>
            <Text className="mx-auto text-sm leading-6">
              您的 {appConfig.appName} 账户绑定邮箱已成功变更为
              <span className="font-medium"> {newEmail} </span>
              。
            </Text>
            <Text className="text-sm leading-6 text-black">
              如非您本人操作，请立即登录账户修改密码并联系我们。
            </Text>
            <Footer email={newEmail} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
