export function PageHeader({ title, subtitle, hideOnPrint = false }: { title: string; subtitle?: string; hideOnPrint?: boolean }) {
  return (
    <header className={`mb-6 ${hideOnPrint ? 'print:hidden' : ''}`.trim()}>
      <h1 className="text-2xl font-extrabold tracking-tight text-title">
        <span className="border-b-4 border-pink pb-1">{title}</span>
      </h1>
      {subtitle ? <p className="mt-3 text-muted">{subtitle}</p> : null}
    </header>
  );
}
