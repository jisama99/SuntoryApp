export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-title">
        <span className="border-b-4 border-pink pb-1">{title}</span>
      </h1>
      {subtitle ? <p className="mt-3 text-muted">{subtitle}</p> : null}
    </header>
  );
}
