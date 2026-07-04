import { Hr, Link, Tailwind, Text } from "react-email";
export function Footer({
  email, //收件人的邮箱地址
  marketing, //标记该邮件是否为营销邮件。
  // TODO 两个连接字段没有做
  unsubscribeUrl = "https://www.zdic.net", //营销类邮件的退订/偏好管理链接。
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
      <Text className="text-[12px] text-neutral-500 leading-6">
        本邮件发送至 <span className="text-black">{email}</span>
        。如非您本人操作，请忽略此邮件。若对账户安全有任何疑虑，欢迎
        {/* TODO 这个地方的联系邮件需要修改 */}
        <Link className="text-neutral-700 underline" href="https://dub.co/support">
          联系我们
        </Link>
        。
      </Text>

      {(marketing || notificationSettingsUrl) && (
        <Text className="text-[12px] text-neutral-500 leading-6">
          不想再收到此类邮件？
          <Link
            className="text-neutral-700 underline"
            href={marketing ? unsubscribeUrl : notificationSettingsUrl}
          >
            {marketing ? "管理邮件偏好" : "调整通知设置"}
          </Link>
        </Text>
      )}
    </Tailwind>
  );
}
