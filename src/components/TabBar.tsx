import { Home, Route, User } from 'lucide-react';

interface TabBarProps {
  currentTab: 'home' | 'route' | 'profile';
  onNavigate: (screen: 'dashboard' | 'route' | 'delivery' | 'profile' | 'settings') => void;
  disabled?: boolean;
  hasRoute?: boolean;
}

export function TabBar({ currentTab, onNavigate, disabled, hasRoute = true }: TabBarProps) {
  const tabs = [
    { id: 'home' as const, icon: Home, label: 'Home', screen: 'dashboard' as const },
    { id: 'route' as const, icon: Route, label: 'Route', screen: 'route' as const },
    { id: 'profile' as const, icon: User, label: 'Profile', screen: 'profile' as const },
  ];

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-5px_10px_rgba(0,0,0,0.02)] transition-all duration-300 ${disabled ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          const isRouteTab = tab.id === 'route';
          const isTabDisabled = disabled || (isRouteTab && !hasRoute);

          return (
            <button
              key={tab.id}
              onClick={() => {
                if (isRouteTab && !hasRoute) {
                  alert('Please scan a route first.');
                  return;
                }
                if (!disabled) onNavigate(tab.screen);
              }}
              disabled={disabled}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${isTabDisabled ? 'opacity-40 grayscale' : ''}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-primary text-white shadow-lg shadow-black/20 scale-110' : 'bg-transparent text-gray-400 hover:bg-gray-50'
                }`}>
                <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}