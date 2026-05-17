import { Hr, Link, Tailwind, Text } from "react-email";

export function Footer({
  email, //收件人的邮箱地址
  marketing, //标记该邮件是否为营销邮件。
  unsubscribeUrl = "https://app.dub.co/account/settings", //营销类邮件的退订/偏好管理链接。
  notificationSettingsUrl, //非营销类邮件的通知设置链接。只有当 marketing 为 false/未设置且该值存在时，才会显示"调整通知设置"链接。
}: {
  email: string;
  marketing?: boolean;
  unsubscribeUrl?: string;
  notificationSettingsUrl?: string;
}) {
  return (
    <Tailwind>
      <Hr className="mx-0 my-6 w-full border border-neutral-200" />
      <Text className="text-[12px] leading-6 text-neutral-500">
        本邮件发送至 <span className="text-black">{email}</span>
        。如非您本人操作，请忽略此邮件。若对账户安全有任何疑虑，欢迎
        <Link
          className="text-neutral-700 underline"
          href="https://dub.co/support"
        >
          联系我们
        </Link>
        。
      </Text>

      {(marketing || notificationSettingsUrl) && (
        <Text className="text-[12px] leading-6 text-neutral-500">
          不想再收到此类邮件？
          <Link
            className="text-neutral-700 underline"
            href={marketing ? unsubscribeUrl : notificationSettingsUrl}
          >
            {marketing ? "管理邮件偏好" : "调整通知设置"}
          </Link>
        </Text>
      )}
      <Text className="text-[12px] text-neutral-500">
        Dub Technologies, Inc.
        <br />
        2261 Market Street STE 5906
        <br />
        San Francisco, CA 941114
      </Text>
    </Tailwind>
  );
}
