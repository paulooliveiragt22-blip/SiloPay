export default function AdminLoading() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8" aria-busy="true" aria-live="polite">
      <div className="h-8 w-40 rounded-md bg-muted" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="h-24 rounded-lg bg-muted" />
        <div className="h-24 rounded-lg bg-muted" />
        <div className="h-24 rounded-lg bg-muted" />
      </div>
      <div className="h-48 rounded-lg bg-muted" />
    </div>
  );
}
