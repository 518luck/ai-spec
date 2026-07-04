"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Slider } from "@/shared/ui/slider";
import { cropImage } from "../model/crop-image";

type AvatarCropDialogProps = {
  open: boolean;
  imageSrc: string;
  onOpenChange: (open: boolean) => void;
  // 确认裁剪：传入裁剪后的 dataUrl，由父组件负责提交
  onConfirm: (croppedDataUrl: string) => void | Promise<void>;
};

// 头像裁剪弹窗：1:1 圆形裁剪 + 缩放滑块，确认后输出 JPEG dataUrl
export function AvatarCropDialog({
  open,
  imageSrc,
  onOpenChange,
  onConfirm,
}: AvatarCropDialogProps): React.JSX.Element {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // 裁剪完成回调：记录像素区域，确认时用于 canvas 重绘
  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // 确认：裁剪输出 dataUrl 后交给父组件提交
  const handleConfirm = async (): Promise<void> => {
    if (!croppedAreaPixels) {
      return;
    }
    const dataUrl = await cropImage(imageSrc, croppedAreaPixels);
    await onConfirm(dataUrl);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>裁剪头像</DialogTitle>
          <DialogDescription>拖动调整位置，滑动缩放，完成后点击保存。</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 bg-muted px-6 py-4">
          {/* 裁剪区域：固定高度，圆形遮罩由 Cropper object-fit + aspect=1 实现 */}
          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          {/* 缩放滑块 */}
          <div className="flex items-center gap-3">
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.05}
              onValueChange={(value) => {
                setZoom(Array.isArray(value) ? value[0] : value);
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleConfirm}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
