import { Home, Route, User } from 'lucide-react';

interface TabBarProps {
  currentTab: 'home' | 'route' | 'profile';
  onNavigate: (screen: 'dashboard' | 'route' | 'delivery' | 'issue' | 'profile' | 'settings') => void;
  disabled?: boolean;
}

export function TabBar({ currentTab, onNavigate, disabled }: TabBarProps) {
  const tabs = [
    { id: 'home' as const, icon: Home, label: 'Home', screen: 'dashboard' as const },
    { id: 'route' as const, icon: Route, label: 'Route', screen: 'route' as const },
    { id: 'profile' as const, icon: User, label: 'Profile', screen: 'profile' as const },
  ];

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-[#050505] border-t border-[#555555]/20 px-4 py-3 safe-area-pb transition-all duration-300 ${disabled ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => !disabled && onNavigate(tab.screen)}
              disabled={disabled}
              className="flex flex-col items-center gap-1 flex-1 py-2 transition-all"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isActive ? 'bg-[#e10600]' : 'bg-transparent'
                }`}>
                <Icon className={`w-6 h-6 ${isActive ? 'text-[#f2f4f8]' : 'text-[#555555]'}`} />
              </div>
              <span className={`transition-all ${isActive ? 'text-[#f2f4f8]' : 'text-[#555555]'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}