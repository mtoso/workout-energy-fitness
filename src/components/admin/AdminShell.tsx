import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Dumbbell, FileText, LogOut, Users } from 'lucide-react';
import { meQueryOptions } from '../../lib/api/query-options';

export type AdminSection = 'users' | 'personal';

interface AdminShellProps {
  section: AdminSection;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  onLogout: () => void;
  children: ReactNode;
  hideMobileNavigation?: boolean;
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

export const AdminShell = ({
  section,
  title,
  subtitle,
  actions,
  onLogout,
  children,
  hideMobileNavigation = false,
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
    {
      id: 'personal',
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
  ];

  const isItemActive = (item: NavItem) => section === item.id;

  return (
    <div className="min-h-[100dvh] bg-zinc-100 md:flex">
      <aside className="hidden md:flex w-72 shrink-0 bg-zinc-950 text-zinc-400 flex-col z-10 relative shadow-2xl md:shadow-none">
        <div className="p-6 flex items-center gap-3 border-b border-zinc-800">
          <div className="w-10 h-10 bg-emerald-400 rounded-2xl flex items-center justify-center text-zinc-950">
            <Dumbbell size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Backoffice
            </p>
            <p className="text-white font-bold text-xl tracking-tight">EnergyFit Pro</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item);

            return (
              <button
                key={item.id}
                onClick={item.onClick}
                disabled={item.disabled}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition text-left ${
                  isActive ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-900 hover:text-white'
                } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Icon size={18} />
                <span className="font-semibold">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={onLogout}
            className="w-full mb-4 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-3 rounded-2xl font-semibold transition"
          >
            <LogOut size={16} /> Logout
          </button>
          <div className="flex items-center gap-3 px-2">
            <div className="w-11 h-11 bg-zinc-800 rounded-full flex items-center justify-center text-white font-bold">
              {getInitials(currentUser?.fullName ?? '', currentUser?.email ?? 'admin')}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">
                {currentUser?.fullName ?? currentUser?.email ?? 'Manager'}
              </p>
              <p className="text-xs text-zinc-500">
                {currentUser ? `${getUserLabel(currentUser.isAdmin, currentUser.userType)} • ${currentUser.status}` : 'Sessione'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="md:hidden sticky top-0 z-30 bg-zinc-950 text-white px-4 py-4 border-b border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-semibold">
                Backoffice
              </p>
              <h1 className="text-lg font-bold tracking-tight truncate">EnergyFit Pro</h1>
            </div>
            <button
              onClick={onLogout}
              className="bg-white/10 px-3 py-2 rounded-xl text-sm font-semibold shrink-0"
            >
              Logout
            </button>
          </div>
        </div>

        <div
          className={`px-4 md:px-8 py-6 md:py-8 space-y-6 ${
            hideMobileNavigation ? '' : 'pb-[96px] md:pb-8'
          }`}
        >
          <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 tracking-tight">{title}</h1>
              {subtitle && <p className="text-sm md:text-base text-zinc-500 mt-1">{subtitle}</p>}
            </div>
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <button
                onClick={() => {
                  void navigate({ to: '/' });
                }}
                className="bg-white border border-zinc-200 text-zinc-700 px-4 py-2.5 rounded-2xl font-semibold w-full sm:w-auto"
              >
                App utente
              </button>
              {actions}
            </div>
          </header>

          {children}
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
