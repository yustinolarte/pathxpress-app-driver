import { useState, useEffect } from 'react';
import { ScreenName, TabBar } from './TabBar';
import { biometricService } from '../services/biometric';

interface SettingsProps {
  onNavigate: (screen: ScreenName) => void;
  onLogout: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function Settings({ onNavigate, onLogout, theme, onToggleTheme }: SettingsProps) {
  const [notifications, setNotifications] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  useEffect(() => {
    // Check if available and enabled
    biometricService.checkAvailability().then(available => {
      setBiometricsAvailable(available);
      setBiometricsEnabled(biometricService.isBiometricEnabled());
    });
  }, []);

  const settingsOptions = [
    {
      category: 'Preferences',
      items: [
        { id: 'theme', icon: theme === 'dark' ? 'dark_mode' : 'light_mode', label: 'Dark Mode', toggle: true, value: theme === 'dark' },
        { id: 'notifications', icon: 'notifications', label: 'Notifications', toggle: true, value: notifications },
        // Only show if available
        ...(biometricsAvailable ? [{
          id: 'biometric',
          icon: 'fingerprint',
          label: 'Biometric Login',
          toggle: true,
          value: biometricsEnabled
        }] : []),
      ]
    },
    {
      category: 'Security',
      items: [
        { id: 'privacy', icon: 'shield', label: 'Privacy & Security' },
      ]
    },
    {
      category: 'Support',
      items: [
        { id: 'help', icon: 'help', label: 'Help & Support' },
        { id: 'about', icon: 'info', label: 'About' },
      ]
    },
  ];

  const handleItemClick = async (id: string) => {
    if (id === 'theme') onToggleTheme();
    else if (id === 'notifications') setNotifications(!notifications);
    else if (id === 'privacy') setShowPrivacyModal(true);
    else if (id === 'biometric') {
      if (biometricsEnabled) {
        await biometricService.disableBiometric();
        setBiometricsEnabled(false);
      } else {
        // Prompt for password to enable
        const password = prompt("Please enter your password to enable biometric login:");
        if (password) {
          // Get username from stored driver info
          const driverInfoStr = localStorage.getItem('driverInfo');
          let username = '';
          if (driverInfoStr) {
            try {
              const driverInfo = JSON.parse(driverInfoStr);
              username = driverInfo.username || driverInfo.email;
            } catch (e) {
              console.error('Error parsing driver info', e);
            }
          }

          if (username) {
            const success = await biometricService.enableBiometric(username, password);
            if (success) setBiometricsEnabled(true);
            else alert('Failed to enable biometrics. Please try again.');
          } else {
            alert('Could not determine username. Please login again.');
          }
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28 font-sans">
      {/* Header */}
      <div className="px-5 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-4">
        <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>

        <div className="space-y-5">
          {settingsOptions.map((section) => (
            <div key={section.category}>
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">{section.category}</h3>
              <div className="bg-card rounded-xl border border-gray-800/50 overflow-hidden">
                {section.items.map((item: any, index) => (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center justify-between p-4 hover:bg-surface-darker transition-all ${index !== section.items.length - 1 ? 'border-b border-gray-800/50' : ''
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-surface-darker rounded-lg flex items-center justify-center">
                        <span className="material-symbols-rounded text-gray-400 text-lg">{item.icon}</span>
                      </div>
                      <span className="text-foreground text-sm font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.toggle ? (
                        <div className={`relative w-11 h-6 rounded-full transition-colors ${item.value ? 'bg-primary' : 'bg-gray-700'}`}>
                          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${item.value ? 'right-0.5' : 'left-0.5'}`} />
                        </div>
                      ) : (
                        <span className="material-symbols-rounded text-gray-600 text-lg">chevron_right</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Logout */}
          <button
            onClick={onLogout}
            className="w-full bg-red-500/10 border border-red-500/20 text-red-400 py-4 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all font-medium"
          >
            <span className="material-symbols-rounded text-xl">logout</span>
            Sign Out
          </button>

          <div className="text-center text-gray-600 pt-2 text-xs">
            <div>PATHXPRESS Driver v2.1.0</div>
          </div>
        </div>
      </div>

      {/* Privacy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-5">
          <div className="w-full max-w-sm bg-surface-dark border border-gray-800 rounded-2xl p-5 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-foreground mb-4">Privacy & Security</h3>
            <div className="space-y-3 text-gray-400 text-sm leading-relaxed">
              <p><strong className="text-foreground">Data Protection (UAE PDPL)</strong><br />
                PathXpress protects your personal data in compliance with UAE PDPL.
              </p>
              <p><strong className="text-foreground">Data Collection</strong><br />
                We collect only necessary data (location, device info, delivery proof) to fulfill service obligations.
              </p>
              <p><strong className="text-foreground">Your Rights</strong><br />
                You have the right to access, correct, or request deletion of your personal data.
              </p>
              <p className="text-xs text-gray-600 mt-4">Last updated: December 2025</p>
            </div>
            <button onClick={() => setShowPrivacyModal(false)} className="w-full mt-5 bg-primary text-white py-3 rounded-xl font-bold active:scale-[0.98] transition-transform">
              Close
            </button>
          </div>
        </div>
      )}

      <TabBar currentTab="settings" onNavigate={onNavigate} />
    </div>
  );
}
