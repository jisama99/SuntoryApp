export function PageHeader({ title, subtitle, hideOnPrint = false }: { title: string; subtitle?: string; hideOnPrint?: boolean }) {
  return (
    <header className={`mb-8 ${hideOnPrint ? 'print:hidden' : ''}`.trim()}>
      <h1 className="text-xl font-extrabold tracking-tight text-title">
        {title}
      </h1>
      {subtitle ? <p className="mt-3 text-muted">{subtitle}</p> : null}
    </header>
  );
}
