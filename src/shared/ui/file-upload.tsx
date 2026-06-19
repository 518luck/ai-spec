"use client";

import Image from "next/image";
import type { DragEvent, ReactNode } from "react";
import { useState } from "react";

import { cn } from "@/shared/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { toast } from "sonner";

import type { Icon } from "@/shared/ui/icons";
import { Icons } from "@/shared/ui/icons";
import { Spinner } from "@/shared/ui/spinner";

// 受支持的文件格式
type AcceptedFileFormats = "any" | "images" | "csv" | "documents";

// 文档类 MIME 白名单
const documentTypes = [
  "application/pdf", // .pdf
  "text/plain", // .txt
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.ms-excel", // .xls
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "text/csv", // .csv
];

// 每种格式允许的 MIME 与报错文案，新增类型只改这里
const acceptFileTypes: Record<
  AcceptedFileFormats,
  { types: string[]; errorMessage?: string }
> = {
  any: { types: [] },
  images: {
    types: ["image/png", "image/jpeg", "image/webp", "image/gif"],
    errorMessage: "仅支持 png、jpg、webp、gif 格式",
  },
  csv: {
    types: ["text/csv"],
    errorMessage: "仅支持 csv 格式",
  },
  documents: {
    types: documentTypes,
    errorMessage: "仅支持文档格式（pdf、doc、xls、csv 等）",
  },
};

// 外观变体：default 带边框阴影；plain 无边框，由外部自定义形状（如圆形头像）
const fileUploadVariants = cva(
  "group relative isolate flex flex-col items-center justify-center overflow-hidden bg-background transition-all",
  {
    variants: {
      variant: {
        default: "rounded-md border border-border shadow-sm hover:bg-muted/50",
        plain: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

// readFile 辨别联合：传 true 时 onChange 强制带 src（base64 预览），不传只回传 File
type FileUploadReadFileProps =
  | {
      readFile?: false;
      onChange?: (data: { file: File }) => void;
    }
  | {
      readFile: true;
      onChange?: (data: { file: File; src: string }) => void;
    };

export type FileUploadProps = FileUploadReadFileProps & {
  id?: string;
  accept?: AcceptedFileFormats;
  className?: string;
  iconClassName?: string;
  previewClassName?: string;
  /** 自定义图标，默认上传图标 */
  icon?: Icon;
  /** 自定义预览内容（替代默认 img） */
  customPreview?: ReactNode;
  /** 当前预览图（一般是 base64 或 URL） */
  imageSrc?: string | null;
  /** 是否显示 loading 转圈 */
  loading?: boolean;
  /** 是否允许点击上传区域选择文件 */
  clickToUpload?: boolean;
  /** 有 imageSrc 时是否在 hover 显示「更换」遮罩 */
  showHoverOverlay?: boolean;
  /** 图标下方的提示文案，传 null 则只显示图标 */
  content?: ReactNode | null;
  /** 文件大小上限（MB），默认 5 */
  maxFileSizeMB?: number;
  /** 无障碍标签 */
  accessibilityLabel?: string;
  disabled?: boolean;
} & VariantProps<typeof fileUploadVariants>;

// 通用文件上传区域：拖拽 / 点击选择 + 类型与大小校验 + 预览，纯原生无第三方上传库
export function FileUpload({
  id,
  readFile,
  onChange,
  variant,
  className,
  iconClassName,
  previewClassName,
  icon: IconCmp = Icons.upload,
  accept = "any",
  imageSrc,
  customPreview,
  loading = false,
  clickToUpload = true,
  showHoverOverlay = true,
  content,
  maxFileSizeMB = 5,
  accessibilityLabel = "文件上传",
  disabled = false,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  // 文件进入后的处理：取文件 → 校验大小 → 校验类型 → 按 readFile 决定是否回传 base64 src
  const onFileChange = async (
    e: React.ChangeEvent<HTMLInputElement> | DragEvent,
  ) => {
    // 区分拖拽与点击两种来源
    const file =
      "dataTransfer" in e
        ? (e.dataTransfer.files?.[0] ?? null)
        : (e.target.files?.[0] ?? null);
    if (!file) {
      return;
    }

    // 记下文件名作为隐藏 input 的 key，便于连续选同一文件
    setFileName(file.name);

    // 校验大小
    if (maxFileSizeMB > 0 && file.size / 1024 / 1024 > maxFileSizeMB) {
      toast.error(`文件过大（上限 ${maxFileSizeMB} MB）`);
      return;
    }

    // 校验类型
    const acceptedTypes = acceptFileTypes[accept].types;
    if (acceptedTypes.length > 0 && !acceptedTypes.includes(file.type)) {
      toast.error(acceptFileTypes[accept].errorMessage ?? "文件类型不支持");
      return;
    }

    // readFile=true 时读成 base64 src 一并回传，否则只回传 File
    if (readFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const src = event.target?.result;
        if (typeof src === "string") {
          onChange?.({ src, file });
        }
      };
      reader.readAsDataURL(file);
      return;
    }

    onChange?.({ file });
  };

  return (
    <label
      className={cn(
        fileUploadVariants({ variant }),
        disabled ? "cursor-not-allowed" : cn(clickToUpload && "cursor-pointer"),
        className,
      )}
    >
      {loading && (
        <div className="bg-background/80 absolute inset-0 z-5 flex items-center justify-center rounded-[inherit]">
          <Spinner className="size-6" />
        </div>
      )}

      {/* 拖拽事件承接层 */}
      <div
        className="absolute inset-0 z-5"
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(true);
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onFileChange(e);
          setDragActive(false);
        }}
      />

      {/* 提示 / 图标层：有图时默认透明，hover 才露出「换图」遮罩 */}
      <div
        className={cn(
          "bg-background/60 absolute inset-0 z-3 flex flex-col items-center justify-center rounded-[inherit] border-2 border-transparent text-center backdrop-blur-[2px] transition-all",
          disabled && "bg-muted/50",
          dragActive &&
            !disabled &&
            "border-primary bg-muted cursor-copy opacity-100",
          imageSrc
            ? cn(
                "opacity-0",
                showHoverOverlay && !disabled && "group-hover:opacity-100",
              )
            : cn(!disabled && "group-hover:bg-muted/50"),
        )}
      >
        <IconCmp
          className={cn(
            "size-7 transition-all duration-75",
            !disabled
              ? cn(
                  "text-muted-foreground group-hover:scale-110 group-active:scale-95",
                  dragActive ? "scale-110" : "scale-100",
                )
              : "text-muted-foreground/60",
            iconClassName,
          )}
        />
        {content !== null && (
          <div className="text-muted-foreground mt-2 text-sm">
            {content ?? (clickToUpload ? "拖拽或点击上传" : "拖拽到此处上传")}
          </div>
        )}
        <span className="sr-only">{accessibilityLabel}</span>
      </div>

      {/* 预览层 */}
      {imageSrc &&
        (customPreview ?? (
          <Image
            src={imageSrc}
            alt="预览"
            fill
            unoptimized
            sizes="100%"
            className={cn("rounded-[inherit] object-cover", previewClassName)}
          />
        ))}

      {/* 隐藏 input：仅屏幕阅读器可见，clickToUpload 时才挂载 */}
      {clickToUpload && (
        <div className="sr-only">
          <input
            id={id}
            key={fileName}
            type="file"
            accept={acceptFileTypes[accept].types.join(",")}
            onChange={onFileChange}
            disabled={disabled}
          />
        </div>
      )}
    </label>
  );
}
