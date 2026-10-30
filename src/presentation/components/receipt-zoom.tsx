"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";

const scales = [1, 1.5, 2, 3, 4] as const;

export function ReceiptZoomFrame({ src, alt }: { src: string | null; alt: string }) {
  const [scale, setScale] = useState<(typeof scales)[number]>(1);

  function step(delta: number) {
    setScale((current) => {
      const index = scales.indexOf(current);
      return scales[Math.min(scales.length - 1, Math.max(0, index + delta))] ?? 1;
    });
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" disabled={scale <= 1} onClick={() => step(-1)}>
          Diminuir
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={scale === 1} onClick={() => setScale(1)}>
          Tamanho normal
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={scale >= 4} onClick={() => step(1)}>
          Aumentar
        </Button>
      </div>
      <div className="max-h-[65dvh] overflow-auto rounded-md bg-muted">
        {src ? (
          <img src={src} alt={alt} style={{ width: `${scale * 100}%`, maxWidth: "none" }} className="h-auto" />
        ) : (
          <p className="p-4 text-center text-sm text-muted-foreground">Foto indisponível</p>
        )}
      </div>
    </>
  );
}

export function ReceiptZoomDialog({
  src,
  alt,
  open,
  onOpenChange,
}: {
  src: string | null;
  alt: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] max-w-5xl">
        <DialogHeader>
          <DialogTitle>Ampliar comprovante</DialogTitle>
          <DialogDescription>Aumente a foto para ler valor, data e demais detalhes.</DialogDescription>
        </DialogHeader>
        <ReceiptZoomFrame key={open ? "open" : "closed"} src={src} alt={alt} />
      </DialogContent>
    </Dialog>
  );
}
