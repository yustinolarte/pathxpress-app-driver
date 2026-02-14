import { useState } from 'react';

export type ScreenName = 'login' | 'scanner' | 'inspection' | 'dashboard' | 'route' | 'delivery' | 'profile' | 'settings' | 'wallet' | 'issue' | 'load_scan';

interface TabBarProps {
  currentTab: 'home' | 'route' | 'wallet' | 'settings' | string;
  onNavigate: (screen: ScreenName) => void;
  disabled?: boolean;
  hasRoute?: boolean;
}

const tabs = [
  { id: 'home', icon: 'home', label: 'Home', screen: 'dashboard' as const },
  { id: 'route', icon: 'local_shipping', label: 'Route', screen: 'route' as const },
  { id: 'wallet', icon: 'account_balance_wallet', label: 'Wallet', screen: 'wallet' as const },
  { id: 'settings', icon: 'settings', label: 'Settings', screen: 'settings' as const },
] as const;

export function TabBar({ currentTab, onNavigate, disabled, hasRoute = true }: TabBarProps) {
  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-surface-darker border-t border-gray-800/50 px-4 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] z-50 transition-all duration-300 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const isRouteTab = tab.id === 'route';
          const isTabDisabled = disabled || (isRouteTab && !hasRoute);

          return (
            <button
              key={tab.id}
              onClick={() => {
                if (isRouteTab && !hasRoute) {
                  // Allow navigation but maybe show empty state? Or block?
                  // For now block as per logic
                  if (onNavigate) onNavigate(tab.screen);
                } else {
                  if (!disabled) onNavigate(tab.screen);
                }
              }}
              disabled={disabled}
              className={`flex flex-col items-center justify-center flex-1 py-3 transition-all duration-200 relative ${isTabDisabled ? 'opacity-50' : ''}`}
            >
              <div className={`transition-all duration-200 p-1 rounded-xl ${isActive ? 'bg-primary/10' : 'bg-transparent'}`}>
                <span
                  className={`material-symbols-rounded text-2xl transition-all duration-200 ${isActive ? 'text-primary' : 'text-gray-500'
                    }`}
                  style={{ fontVariationSettings: isActive ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 400" }}
                >
                  {tab.icon}
                </span>
              </div>
              <span className={`text-[10px] font-medium mt-1 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-gray-500'
                }`}>
                {tab.label}
              </span>
              {/* Active dot indicator removed for cleaner look, background pill used instead */}
            </button>
          );
        })}
      </div>
    </div>
  );
}