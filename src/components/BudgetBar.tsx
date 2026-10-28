export type ChartTone = 'consumed' | 'forecast' | 'dispositif1' | 'dispositif2' | 'dispositif3' | 'dispositif4';

/** Couleurs des séries du jeu de graphiques (jetons de chart-tokens.css, D213). Classes écrites en toutes lettres pour être générées. */
const FILL: Record<ChartTone, string> = {
  consumed: 'bg-chart-2',
  forecast: 'bg-chart-1',
  dispositif1: 'bg-chart-1',
  dispositif2: 'bg-chart-2',
  dispositif3: 'bg-chart-5',
  dispositif4: 'bg-chart-6',
};

/**
 * Barre de répartition (style Doux : piste et bouts arrondis, jetons de graphique). Les valeurs sont toujours écrites à côté :
 * la barre ne porte jamais seule le sens. Les parts s'expriment en pourcentage de la piste et sont bornées entre 0 et 100.
 */
export function BudgetBar({ label, segments }: { label: string; segments: Array<{ pct: number; tone: ChartTone }> }) {
  return (
    <div role="img" aria-label={label} className="flex h-3 w-full overflow-hidden rounded-chart-track bg-chart-neutral">
      {segments.map((s, i) => (
        <span key={`${s.tone}-${i}`} className={`h-full rounded-chart-bar ${FILL[s.tone]}`} style={{ width: `${Math.max(0, Math.min(100, s.pct))}%` }} />
      ))}
    </div>
  );
}
