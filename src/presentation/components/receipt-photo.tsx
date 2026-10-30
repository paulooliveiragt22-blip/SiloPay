export function ReceiptPhoto({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return (
      <p className="flex aspect-[4/3] items-center justify-center rounded-md bg-muted px-3 text-center text-sm text-muted-foreground">
        Foto indisponível
      </p>
    );
  }

  return <img src={src} alt={alt} className="aspect-[4/3] w-full rounded-md bg-muted object-contain" />;
}
