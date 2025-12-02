import { ArrowLeft, AlertCircle, Bell, Globe, HelpCircle, Lock, LogOut, Moon, Shield } from 'lucide-react';
import { useState } from 'react';

interface SettingsProps {
  onNavigate: (screen: 'dashboard' | 'route' | 'delivery' | 'issue' | 'profile' | 'settings') => void;
  onLogout: () => void;
}

export function Settings({ onNavigate, onLogout }: SettingsProps) {
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const settingsOptions = [
    {
      category: 'Support',
      items: [
        { id: 'report-issue', icon: AlertCircle, label: 'Report Issue', color: 'text-[#e10600]', bg: 'bg-[#e10600]/20' },
        { id: 'help', icon: HelpCircle, label: 'Help & Support', color: 'text-[#f2f4f8]', bg: 'bg-[#555555]/20' },
      ]
    },
    {
      category: 'Preferences',
      items: [
        { id: 'notifications', icon: Bell, label: 'Notifications', color: 'text-[#f2f4f8]', bg: 'bg-[#555555]/20', toggle: true, value: notifications },
        { id: 'language', icon: Globe, label: 'Language', color: 'text-[#f2f4f8]', bg: 'bg-[#555555]/20', value: 'English' },
        { id: 'theme', icon: Moon, label: 'Dark Mode', color: 'text-[#f2f4f8]', bg: 'bg-[#555555]/20', toggle: true, value: darkMode },
      ]
    },
    {
      category: 'Security',
      items: [
        { id: 'password', icon: Lock, label: 'Change Password', color: 'text-[#f2f4f8]', bg: 'bg-[#555555]/20' },
        { id: 'privacy', icon: Shield, label: 'Privacy & Security', color: 'text-[#f2f4f8]', bg: 'bg-[#555555]/20' },
      ]
    },
  ];

  const handleItemClick = (id: string) => {
    if (id === 'report-issue') {
      onNavigate('issue');
    } else if (id === 'theme') {
      setDarkMode(!darkMode);
    } else if (id === 'notifications') {
      setNotifications(!notifications);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1128] pb-32">
      {/* Header */}
      <div className="bg-[#050505] px-6 pt-12 pb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('dashboard')} className="text-[#f2f4f8]">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-[#f2f4f8]" style={{ fontFamily: 'Poppins, sans-serif' }}>Settings</h2>
        </div>
      </div>

      <div className="px-6 pt-6 space-y-6">
        {settingsOptions.map((section) => (
          <div key={section.category}>
            <h3 className="text-[#555555] mb-3 px-2">{section.category}</h3>
            <div className="bg-[#050505]/60 backdrop-blur-sm border border-[#555555]/20 rounded-3xl overflow-hidden">
              {section.items.map((item: any, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center justify-between p-5 hover:bg-[#0a1128]/40 transition-all ${index !== section.items.length - 1 ? 'border-b border-[#555555]/20' : ''
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <span className="text-[#f2f4f8]">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.value !== undefined && !item.toggle && (
                        <span className="text-[#555555]">{item.value}</span>
                      )}
                      {item.toggle ? (
                        <div className={`relative w-14 h-7 rounded-full transition-colors ${item.value ? 'bg-[#e10600]' : 'bg-[#555555]'}`}>
                          <div className={`absolute top-1 w-5 h-5 bg-[#f2f4f8] rounded-full shadow-md transition-all ${item.value ? 'right-1' : 'left-1'}`}></div>
                        </div>
                      ) : (
                        <div className="text-[#555555]">›</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Logout Button */}
        <div className="pt-4">
          <button
            onClick={onLogout}
            className="w-full bg-[#050505]/60 backdrop-blur-sm border border-[#e10600]/50 text-[#e10600] py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-[#e10600]/10 transition-all"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>

        {/* Version Info */}
        <div className="text-center text-[#555555] pt-4">
          <div>PATHXPRESS Driver</div>
          <div>Version 2.1.0</div>
        </div>
      </div>
    </div>
  );
}
