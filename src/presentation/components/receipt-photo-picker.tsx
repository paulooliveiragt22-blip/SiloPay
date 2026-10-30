"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";

export function ReceiptPhotoPicker({
  onFile,
  currentSrc = null,
  onRemoveCurrent,
}: {
  onFile: (file: File | null) => void;
  currentSrc?: string | null;
  onRemoveCurrent?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState(0);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function choose(next: File | null) {
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return next ? URL.createObjectURL(next) : null;
    });
    setFile(next);
    onFile(next);
    if (!next) setInputKey((key) => key + 1);
  }

  const shownSrc = preview ?? currentSrc;

  function clearPhoto() {
    if (file) {
      choose(null);
      return;
    }
    onRemoveCurrent?.();
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        key={inputKey}
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={(event) => choose(event.target.files?.[0] ?? null)}
      />
      <Button type="button" variant={shownSrc ? "outline" : "default"} className="w-full" onClick={() => inputRef.current?.click()}>
        <ImagePlusIcon />
        {shownSrc ? "Trocar foto" : "Adicionar foto"}
      </Button>
      {shownSrc ? (
        <>
          <img
            src={shownSrc}
            alt={file ? "Prévia do comprovante" : "Foto atual do comprovante"}
            className="aspect-[4/3] w-full rounded-md bg-muted object-contain"
          />
          <p className="truncate text-sm text-muted-foreground">{file?.name ?? "Foto atual"}</p>
          <Button type="button" variant="outline" onClick={clearPhoto}>
            Excluir foto
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhuma foto selecionada.</p>
      )}
    </div>
  );
}

function ImagePlusIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
      <rect x="1.5" y="3" width="13" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 6.2v4.6M5.7 8.5h4.6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
