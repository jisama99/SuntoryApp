import { getTranslations } from 'next-intl/server';
import { setSimulatedProfile } from '@/app/actions';
import type { DemoProfile } from '@/data/schemas';
import type { ProfileId } from '@/domain/types';
import { UI_ICONS } from './icons';

export async function ProfileSwitcher({ profiles, current }: { profiles: DemoProfile[]; current: ProfileId }) {
  const t = await getTranslations('profile');
  const Icon = UI_ICONS.profile;
  const Chevron = UI_ICONS.chevronDown;
  return (
    <details className="relative">
      <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-full border border-line bg-surface px-3 text-sm font-semibold marker:hidden">
        <Icon aria-hidden="true" className="size-4" strokeWidth={1.7} />
        <span className="text-muted">{t('switcher')} :</span>
        <span>{t(current)}</span>
        <Chevron aria-hidden="true" className="size-4" strokeWidth={1.7} />
      </summary>
      <form
        action={setSimulatedProfile}
        className="absolute right-0 z-20 mt-2 w-72 rounded-card border border-line bg-surface p-2 shadow-card"
      >
        <p className="px-2 pb-2 text-xs text-muted">{t('note')}</p>
        <ul className="flex flex-col gap-1">
          {profiles.map((p) => (
            <li key={p.id}>
              <button
                type="submit"
                name="profile"
                value={p.id}
                aria-current={p.id === current ? 'true' : undefined}
                className={`flex min-h-11 w-full items-center rounded-ctl px-3 text-left text-sm hover:bg-alt ${
                  p.id === current ? 'bg-sel font-semibold' : 'font-medium'
                }`}
              >
                {t(p.id)}
              </button>
            </li>
          ))}
        </ul>
      </form>
    </details>
  );
}
