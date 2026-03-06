import { FileText, Home, Shield, User } from 'lucide-react';

type ScreenName = 'home' | 'scheda' | 'profile';

interface BottomNavProps {
  currentScreen: ScreenName;
  onNavigate: (screen: ScreenName) => void;
  showAdminEntry?: boolean;
  onOpenAdmin?: () => void;
}

export const BottomNav = ({
  currentScreen,
  onNavigate,
  showAdminEntry = false,
  onOpenAdmin,
}: BottomNavProps) => (
  <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-zinc-100 px-8 py-3 flex justify-between items-center pb-6 z-40">
    <button
      onClick={() => onNavigate('home')}
      className={`flex flex-col items-center p-2 transition-colors ${
        currentScreen === 'home'
          ? 'text-zinc-900'
          : 'text-zinc-400 hover:text-zinc-600'
      }`}
    >
      <Home size={24} strokeWidth={currentScreen === 'home' ? 2.5 : 2} />
      <span className="text-[10px] mt-1.5 font-bold tracking-wide">HOME</span>
    </button>
    <button
      onClick={() => onNavigate('scheda')}
      className={`flex flex-col items-center p-2 transition-colors ${
        currentScreen === 'scheda'
          ? 'text-zinc-900'
          : 'text-zinc-400 hover:text-zinc-600'
      }`}
    >
      <FileText size={24} strokeWidth={currentScreen === 'scheda' ? 2.5 : 2} />
      <span className="text-[10px] mt-1.5 font-bold tracking-wide">SCHEDA</span>
    </button>
    <button
      onClick={() => onNavigate('profile')}
      className={`flex flex-col items-center p-2 transition-colors ${
        currentScreen === 'profile'
          ? 'text-zinc-900'
          : 'text-zinc-400 hover:text-zinc-600'
      }`}
    >
      <User size={24} strokeWidth={currentScreen === 'profile' ? 2.5 : 2} />
      <span className="text-[10px] mt-1.5 font-bold tracking-wide">PROFILO</span>
    </button>
    {showAdminEntry && onOpenAdmin && (
      <button
        onClick={onOpenAdmin}
        className="flex flex-col items-center p-2 transition-colors text-amber-700 hover:text-amber-900"
      >
        <Shield size={24} strokeWidth={2.25} />
        <span className="text-[10px] mt-1.5 font-bold tracking-wide">ADMIN</span>
      </button>
    )}
  </div>
);
