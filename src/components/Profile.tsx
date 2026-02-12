import { ArrowLeft, TrendingUp, Award, DollarSign, IdCard, Car, FileText, Settings, Clock } from 'lucide-react';
import { TabBar } from './TabBar';
import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface ProfileProps {
  onNavigate: (screen: 'dashboard' | 'route' | 'delivery' | 'profile' | 'settings') => void;
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading Profile...</div>
      </div>
    );
  }

  // Fallback data if fields are missing
  const driverName = profile?.fullName || 'Driver';
  const driverId = profile?.username || 'DRV-000';
  const vehicle = profile?.vehicleNumber || 'Not Assigned';
  const emiratesId = profile?.emiratesId || 'Not Uploaded';
  const license = profile?.licenseNo || 'Not Uploaded';

  // Metrics
  const efficiency = metrics?.efficiency || '100%';
  const hoursWorked = metrics?.hoursWorked || 0;
  const totalDeliveries = metrics?.totalDeliveries || 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => onNavigate('dashboard')} className="text-gray-900 hover:bg-gray-100 p-2 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-gray-900 flex-1 text-xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>Profile & Performance</h2>
          <button
            onClick={() => onNavigate('settings')}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-all"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-6 pt-6 space-y-4">
        {/* Driver Info Card */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center text-white overflow-hidden shadow-lg shadow-red-200" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '2rem' }}>
              {profile?.photoUrl ? (
                <img src={profile.photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                driverName.charAt(0)
              )}
            </div>
            <div>
              <h3 className="text-gray-900 mb-1 font-bold text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>{driverName}</h3>
              <div className="text-gray-500 text-sm">Driver ID: {driverId}</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <IdCard className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-gray-400 text-xs uppercase tracking-wider">Emirates ID</div>
                <div className="text-gray-900 font-medium">{emiratesId}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-gray-400 text-xs uppercase tracking-wider">Driving License</div>
                <div className="text-gray-900 font-medium">{license}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Car className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-gray-400 text-xs uppercase tracking-wider">Assigned Vehicle</div>
                <div className="text-gray-900 font-medium">{vehicle}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics (Today) */}
        <h3 className="text-gray-900 font-bold px-2" style={{ fontFamily: 'Poppins, sans-serif' }}>Today's Stats</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 text-center">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-gray-900 font-bold mb-1" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.5rem' }}>{efficiency}</div>
            <div className="text-gray-500 text-xs">Efficiency</div>
          </div>

          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 text-center">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Award className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-gray-900 font-bold mb-1" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.5rem' }}>{totalDeliveries}</div>
            <div className="text-gray-500 text-xs">Delivered</div>
          </div>

          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 text-center">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Clock className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-gray-900 font-bold mb-1" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.5rem' }}>{hoursWorked}h</div>
            <div className="text-gray-500 text-xs">Hours</div>
          </div>
        </div>
      </div>

      <TabBar currentTab="profile" onNavigate={onNavigate} hasRoute={hasRoute} />
    </div>
  );
}