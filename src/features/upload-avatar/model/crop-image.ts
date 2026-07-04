import type { Area } from "react-easy-crop";

// 加载图片为 HTMLImageElement，用于 canvas 重绘
const createImage = (src: string): Promise<HTMLImageElement> =>
	new Promise((resolve, reject) => {
		const image = new Image();
		image.addEventListener("load", () => resolve(image));
		image.addEventListener("error", (error) => reject(error));
		image.crossOrigin = "anonymous";
		image.src = src;
	});

// 按 croppedAreaPixels 在 canvas 上裁剪并等比缩放到不超过 maxSize，输出 JPEG dataUrl
export const cropImage = async (
	imageSrc: string,
	pixelCrop: Area,
	maxSize = 512,
): Promise<string> => {
	const image = await createImage(imageSrc);

	// 计算缩放比例，保证输出边长不超过 maxSize
	const scale = Math.min(1, maxSize / pixelCrop.width, maxSize / pixelCrop.height);
	const outputWidth = Math.round(pixelCrop.width * scale);
	const outputHeight = Math.round(pixelCrop.height * scale);

	const canvas = document.createElement("canvas");
	canvas.width = outputWidth;
	canvas.height = outputHeight;

	const ctx = canvas.getContext("2d");
	if (!ctx) {
		throw new Error("无法获取 canvas 2D 上下文，裁剪失败");
	}

	// 源图按裁剪区域取出，绘制到目标尺寸
	ctx.drawImage(
		image,
		pixelCrop.x,
		pixelCrop.y,
		pixelCrop.width,
		pixelCrop.height,
		0,
		0,
		outputWidth,
		outputHeight,
	);

	return canvas.toDataURL("image/jpeg", 0.9);
};
