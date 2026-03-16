import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { FileText, LogOut, Users } from 'lucide-react';
import defaultProfileLogo from '../../assets/profile-default-logo.png';
import { meQueryOptions } from '../../lib/api/query-options';

export type AdminSection = 'users' | 'personal';

interface AdminShellProps {
  section: AdminSection;
  title: string;
  eyebrow?: string;
  contextLabel?: string;
  subtitle?: string;
  actions?: ReactNode;
  leading?: ReactNode;
  onLogout: () => void;
  children: ReactNode;
  hideMobileNavigation?: boolean;
  hideHeader?: boolean;
  contentClassName?: string;
}

interface NavItem {
  id: AdminSection;
  label: string;
  shortLabel: string;
  icon: typeof Users;
  onClick: () => void;
  disabled?: boolean;
}

const getInitials = (fullName: string, email: string) =>
  (fullName || email)
    .split(/\s+|[._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? '')
    .join('') || 'EF';

const getUserLabel = (isAdmin: boolean, userType: 'client' | 'coach') => {
  if (isAdmin) return 'Admin';
  return userType === 'coach' ? 'Coach' : 'Cliente';
};

const getStatusLabel = (status: 'invited' | 'active' | 'disabled') => {
  if (status === 'invited') return 'Invitato';
  if (status === 'disabled') return 'Disabilitato';
  return 'Attivo';
};

export const AdminShell = ({
  section,
  title,
  eyebrow,
  contextLabel,
  subtitle,
  actions,
  leading,
  onLogout,
  children,
  hideMobileNavigation = false,
  hideHeader = false,
  contentClassName,
}: AdminShellProps) => {
  const navigate = useNavigate();
  const meQuery = useQuery(meQueryOptions());
  const currentUser = meQuery.data?.user;

  const navItems: NavItem[] = [
    {
      id: 'users',
      label: 'Utenti',
      shortLabel: 'UTENTI',
      icon: Users,
      onClick: () => {
        void navigate({ to: '/admin/users' });
      },
    },
    ...(currentUser?.canUsePersonalApp
      ? [
          {
            id: 'personal' as const,
            label: 'Le mie schede',
            shortLabel: 'PROFILO',
            icon: FileText,
            onClick: () => {
              if (!currentUser) return;
              void navigate({
                to: '/admin/users/$userId',
                params: { userId: currentUser.id },
              });
            },
            disabled: !currentUser,
          },
        ]
      : []),
  ];

  const isItemActive = (item: NavItem) => section === item.id;

  return (
    <div className="min-h-[100dvh] bg-zinc-100 md:flex">
      <aside className="hidden md:flex w-[320px] shrink-0 bg-zinc-950 text-zinc-400 flex-col z-10 relative shadow-2xl md:shadow-none">
        <div className="p-8 flex items-center gap-4 border-b border-zinc-800">
          <div className="w-14 h-14 rounded-2xl bg-white overflow-hidden shadow-sm shrink-0">
            <img
              src={defaultProfileLogo}
              alt="EnergyFit"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Backoffice
            </p>
            <p className="text-white font-bold text-[2rem] tracking-tight leading-none">EnergyFit Pro</p>
          </div>
        </div>

        <nav className="flex-1 px-6 py-8 space-y-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item);

            return (
              <button
                key={item.id}
                onClick={item.onClick}
                disabled={item.disabled}
                className={`w-full flex items-center gap-4 px-6 py-5 rounded-[1.75rem] transition text-left text-xl ${
                  isActive ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-900 hover:text-white'
                } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Icon size={22} />
                <span className="font-semibold">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-zinc-800">
          <button
            onClick={onLogout}
            className="w-full mb-5 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-4 rounded-2xl font-semibold transition"
          >
            <LogOut size={16} /> Esci
          </button>
          <div className="flex items-center gap-3 px-2">
            <div className="w-11 h-11 bg-zinc-800 rounded-full flex items-center justify-center text-white font-bold">
              {getInitials(currentUser?.fullName ?? '', currentUser?.email ?? 'admin')}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">
                {currentUser?.fullName ?? currentUser?.email ?? 'Gestore'}
              </p>
              <p className="text-xs text-zinc-500">
                {currentUser
                  ? `${getUserLabel(currentUser.isAdmin, currentUser.userType)} • ${getStatusLabel(currentUser.status)}`
                  : 'Sessione'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="md:hidden sticky top-0 z-30 bg-zinc-950 text-white border-b border-zinc-800 shadow-sm">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white overflow-hidden shadow-sm shrink-0">
                  <img
                    src={defaultProfileLogo}
                    alt="EnergyFit"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500 font-semibold">
                    Backoffice
                  </p>
                  <h1 className="text-lg font-bold tracking-tight leading-none truncate">EnergyFit Pro</h1>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="bg-white/10 px-3 py-2 rounded-xl text-sm font-semibold shrink-0"
              >
                Esci
              </button>
            </div>
          </div>
        </div>

        <div
          className={`px-4 md:px-8 py-6 md:py-8 space-y-6 ${
            hideMobileNavigation ? '' : 'pb-[96px] md:pb-8'
          } ${contentClassName ?? ''}`}
        >
          {!hideHeader ? (
            <section className="-mx-4 -mt-6 sticky top-[65px] z-20 border-b border-zinc-200 bg-white md:static md:-mx-8 md:-mt-8">
              <div className="flex flex-col gap-5 px-6 py-6 md:px-8 md:py-7 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex min-w-0 items-start gap-4 md:gap-5">
                  {leading ? <div className="shrink-0">{leading}</div> : null}
                  <div className="min-w-0">
                    {eyebrow || contextLabel ? (
                      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400 md:text-xs">
                        {eyebrow ? <span className="text-emerald-600">{eyebrow}</span> : null}
                        {eyebrow && contextLabel ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
                        ) : null}
                        {contextLabel ? (
                          <span className="truncate normal-case tracking-normal text-sm font-bold text-zinc-500 md:text-base">
                            {contextLabel}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                    <h1 className="mt-1 text-3xl font-black tracking-tight text-zinc-900 md:text-[3rem]">
                      {title}
                    </h1>
                    {subtitle ? (
                      <p className="mt-2 max-w-3xl text-sm md:text-base text-zinc-500">{subtitle}</p>
                    ) : null}
                  </div>
                </div>
                {actions ? (
                  <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 w-full xl:w-auto xl:justify-end">
                    {actions}
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          <div className={!hideHeader ? 'space-y-6 pt-2 md:pt-4' : undefined}>
            {children}
          </div>
        </div>
      </main>

      {!hideMobileNavigation && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 flex justify-around pb-6 pt-2 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item);

            return (
              <button
                key={item.id}
                onClick={item.onClick}
                disabled={item.disabled}
                className={`flex flex-col items-center p-2 flex-1 transition-colors ${
                  isActive ? 'text-emerald-600' : 'text-zinc-400'
                } ${item.disabled ? 'opacity-50' : ''}`}
              >
                <Icon size={22} />
                <span className="text-[10px] font-bold mt-1 tracking-wide">{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
