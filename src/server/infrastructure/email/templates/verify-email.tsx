import {
	Body,
	Container,
	Head,
	Heading,
	Html,
	Preview,
	Section,
	Tailwind,
	Text,
} from "react-email";
import { appConfig } from "@/shared/configs/app.config";
import { Footer } from "../components/footer";

export default function VerifyEmail({
	email = "123@123.co",
	code = "123456",
}: {
	email: string;
	code: string;
}) {
	return (
		<Html>
			<Head />
			<Preview>{`${appConfig.appName} 验证码`}</Preview>
			<Tailwind>
				<Body className="mx-auto my-auto bg-white font-sans">
					<Container className="mx-auto my-10 max-w-150 rounded border border-neutral-200 border-solid px-10 py-5">
						<Heading className="mx-0 my-0 mt-8 p-0 font-extrabold text-3xl text-black">
							{appConfig.appName}
						</Heading>
						<Heading className="mx-0 my-7 p-0 font-medium text-black text-xl">
							请确认您的邮箱地址
						</Heading>
						<Text className="mx-auto text-sm leading-6">
							在 {appConfig.appName} 验证页面输入此验证码以完成注册：
						</Text>
						<Section className="my-8 rounded-lg border border-neutral-200 border-solid">
							<div className="mx-auto w-fit px-6 py-3 text-center font-mono font-semibold text-3xl tracking-[0.25em]">
								{code}
							</div>
						</Section>
						<Text className="text-black text-sm leading-6">此验证码 10 分钟后过期。</Text>
						<Footer email={email} />
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}
