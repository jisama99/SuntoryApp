import {
  ArrowDown, ArrowUp, ArrowUpDown, Bell, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, CircleCheck, Circle, ClipboardCheck, ClipboardList, Flag, GitMerge, House, Inbox,
  Info, Languages, LayoutDashboard, LoaderCircle, Menu, OctagonAlert, PanelLeftClose, PanelLeftOpen, Plus, Ellipsis, Settings, ShieldCheck, Store,
  TriangleAlert, UserRound, Wallet, X, Sun, Moon, Monitor,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { MenuKey } from '@/domain/types';

export type { LucideIcon };

/**
 * Seul point d'entrée des icônes (D113) : pictogrammes usuels, aucun symbole de style IA.
 * tests/unit/icons.test.ts interdit tout autre import de lucide-react.
 */
export const MENU_ICONS: Record<MenuKey, LucideIcon> = {
  home: House,
  dashboard: LayoutDashboard,
  needs: ClipboardList,
  proposals: ClipboardCheck,
  field: Store,
  budget: Wallet,
  alerts: Bell,
  settings: Settings,
  admin: ShieldCheck,
};

export const UI_ICONS = {
  sortNone: ArrowUpDown,
  sortAsc: ArrowUp,
  sortDesc: ArrowDown,
  chevronDown: ChevronDown,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  calendar: CalendarDays,
  close: X,
  menu: Menu,
  plus: Plus,
  more: Ellipsis,
  panelClose: PanelLeftClose,
  panelOpen: PanelLeftOpen,
  language: Languages,
  profile: UserRound,
  info: Info,
  ok: CircleCheck,
  attention: TriangleAlert,
  risk: OctagonAlert,
  neutral: Circle,
  important: Flag,
  empty: Inbox,
  loading: LoaderCircle,
  conflict: GitMerge,
  themeLight: Sun,
  themeDark: Moon,
  themeSystem: Monitor,
} satisfies Record<string, LucideIcon>;
