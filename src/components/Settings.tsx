import { ArrowLeft, AlertCircle, Bell, HelpCircle, LogOut, Shield } from 'lucide-react';
import { useState } from 'react';

interface SettingsProps {
  onNavigate: (screen: 'dashboard' | 'route' | 'delivery' | 'issue' | 'profile' | 'settings') => void;
  onLogout: () => void;
}

export function Settings({ onNavigate, onLogout }: SettingsProps) {
  const [notifications, setNotifications] = useState(true);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const settingsOptions = [
    {
      category: 'Support',
      items: [
        { id: 'report-issue', icon: AlertCircle, label: 'Report Issue', color: 'text-red-600', bg: 'bg-red-50' },
      ]
    },
    {
      category: 'Preferences',
      items: [
        { id: 'notifications', icon: Bell, label: 'Notifications', color: 'text-gray-700', bg: 'bg-gray-100', toggle: true, value: notifications },
      ]
    },
    {
      category: 'Security',
      items: [
        { id: 'privacy', icon: Shield, label: 'Privacy & Security', color: 'text-gray-700', bg: 'bg-gray-100' },
      ]
    },
  ];

  const handleItemClick = (id: string) => {
    if (id === 'report-issue') {
      onNavigate('issue');
    } else if (id === 'notifications') {
      setNotifications(!notifications);
    } else if (id === 'privacy') {
      setShowPrivacyModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-6 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('dashboard')} className="text-gray-900 hover:bg-gray-100 p-2 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-gray-900 text-xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>Settings</h2>
        </div>
      </div>

      <div className="px-6 pt-6 space-y-6">
        {settingsOptions.map((section) => (
          <div key={section.category}>
            <h3 className="text-gray-500 text-sm font-medium mb-3 px-2 uppercase tracking-wider">{section.category}</h3>
            <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
              {section.items.map((item: any, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-all ${index !== section.items.length - 1 ? 'border-b border-gray-100' : ''
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <span className="text-gray-900 font-medium">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.value !== undefined && !item.toggle && (
                        <span className="text-gray-500">{item.value}</span>
                      )}
                      {item.toggle ? (
                        <div className={`relative w-12 h-7 rounded-full transition-colors ${item.value ? 'bg-red-600' : 'bg-gray-300'}`}>
                          <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${item.value ? 'right-1' : 'left-1'}`}></div>
                        </div>
                      ) : (
                        <div className="text-gray-400">›</div>
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
            className="w-full bg-white border border-red-100 text-red-600 py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-red-50 transition-all shadow-sm font-medium"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>

        {/* Version Info */}
        <div className="text-center text-gray-400 pt-4 text-sm">
          <div>PATHXPRESS Driver</div>
          <div>Version 2.1.0</div>
        </div>
      </div>

      {/* Privacy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center px-6">
          <div className="w-full max-w-md bg-white border border-gray-100 rounded-3xl p-6 max-h-[80vh] overflow-y-auto shadow-2xl">
            <h3 className="text-gray-900 mb-4 text-xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Privacy & Security
            </h3>

            <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
              <p>
                <strong className="text-gray-900">Data Protection (UAE PDPL)</strong><br />
                PathXpress is committed to protecting your personal data in compliance with the UAE Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data (PDPL).
              </p>

              <p>
                <strong className="text-gray-900">Data Collection & Usage</strong><br />
                We collect only necessary data (location, device info, delivery proof) to fulfill service obligations. Your data is processed lawfully, fairly, and transparently.
              </p>

              <p>
                <strong className="text-gray-900">Data Storage & Transfer</strong><br />
                Your data is stored securely within the UAE. Any cross-border transfer complies with PDPL regulations ensuring adequate protection levels.
              </p>

              <p>
                <strong className="text-gray-900">Your Rights</strong><br />
                You have the right to access, correct, or request deletion of your personal data. Contact our Data Protection Officer for inquiries.
              </p>

              <p className="text-xs text-gray-400 mt-4">
                Last updated: December 2025
              </p>
            </div>

            <button
              onClick={() => setShowPrivacyModal(false)}
              className="w-full mt-6 bg-red-600 text-white py-4 rounded-2xl hover:bg-red-700 transition-all font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
