import type { SelectHTMLAttributes } from 'react';

export function SelectField({ id, label, hint, error, options, placeholder, ...props }: Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  options: Array<{ value: string; text: string }>;
  placeholder: string;
}) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...props}
        className={`min-h-11 rounded-ctl border bg-surface px-3 text-ink ${error ? 'border-2 border-danger' : 'border-field'}`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.text}
          </option>
        ))}
      </select>
      {hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-sm font-semibold text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
