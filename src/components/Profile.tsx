import { ScreenName, TabBar } from './TabBar';
import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface ProfileProps {
  onNavigate: (screen: ScreenName) => void;
  authToken: string;
  hasRoute?: boolean;
}

export function Profile({ onNavigate, authToken, hasRoute }: ProfileProps) {
  const [profile, setProfile] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await api.getDriverProfile(authToken);
        setProfile(data.driver);
        setMetrics(data.metrics);
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [authToken]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const driverName = profile?.fullName || 'Driver';
  const driverId = profile?.username || 'DRV-000';
  const vehicle = profile?.vehicleNumber || 'Not Assigned';
  const emiratesId = profile?.emiratesId || 'Not Uploaded';
  const license = profile?.licenseNo || 'Not Uploaded';
  const efficiency = metrics?.efficiency || '100%';
  const hoursWorked = metrics?.hoursWorked || 0;
  const totalDeliveries = metrics?.totalDeliveries || 0;

  return (
    <div className="min-h-screen bg-background pb-28 font-sans">
      <div className="px-5 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => onNavigate('dashboard')} className="w-10 h-10 rounded-full bg-card border border-gray-800/50 flex items-center justify-center">
            <span className="material-symbols-rounded text-foreground text-xl">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold text-foreground">Profile</h1>
          <button onClick={() => onNavigate('settings')} className="w-10 h-10 rounded-full bg-card border border-gray-800/50 flex items-center justify-center">
            <span className="material-symbols-rounded text-gray-400 text-xl">settings</span>
          </button>
        </div>

        {/* Driver Identity Card */}
        <div className="bg-card rounded-xl p-5 border border-gray-800/50 mb-4">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center text-white text-2xl font-bold overflow-hidden shadow-lg shadow-red-900/30">
              {profile?.photoUrl ? (
                <img src={profile.photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                driverName.charAt(0)
              )}
            </div>
            <div>
              <h3 className="text-foreground font-bold text-lg">{driverName}</h3>
              <p className="text-gray-500 text-sm">ID: {driverId}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-surface-darker rounded-lg p-3">
              <span className="material-symbols-rounded text-gray-500 text-lg">badge</span>
              <div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider">Emirates ID</p>
                <p className="text-sm text-foreground font-medium">{emiratesId}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-surface-darker rounded-lg p-3">
              <span className="material-symbols-rounded text-gray-500 text-lg">description</span>
              <div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider">Driving License</p>
                <p className="text-sm text-foreground font-medium">{license}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-surface-darker rounded-lg p-3">
              <span className="material-symbols-rounded text-gray-500 text-lg">local_shipping</span>
              <div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider">Assigned Vehicle</p>
                <p className="text-sm text-foreground font-medium">{vehicle}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Stats */}
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Today's Performance</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-xl p-4 border border-gray-800/50 text-center">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <span className="material-symbols-rounded text-green-400 text-xl">trending_up</span>
            </div>
            <p className="text-foreground font-bold text-xl">{efficiency}</p>
            <p className="text-gray-500 text-[10px]">Efficiency</p>
          </div>

          <div className="bg-card rounded-xl p-4 border border-gray-800/50 text-center">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <span className="material-symbols-rounded text-primary text-xl">inventory_2</span>
            </div>
            <p className="text-foreground font-bold text-xl">{totalDeliveries}</p>
            <p className="text-gray-500 text-[10px]">Delivered</p>
          </div>

          <div className="bg-card rounded-xl p-4 border border-gray-800/50 text-center">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <span className="material-symbols-rounded text-blue-400 text-xl">schedule</span>
            </div>
            <p className="text-foreground font-bold text-xl">{hoursWorked}h</p>
            <p className="text-gray-500 text-[10px]">Hours</p>
          </div>
        </div>
      </div>

      <TabBar currentTab="settings" onNavigate={onNavigate} hasRoute={hasRoute} />
    </div>
  );
}