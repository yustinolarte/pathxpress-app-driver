import { ArrowLeft, TrendingUp, Award, DollarSign, IdCard, Car, FileText, Settings, Clock } from 'lucide-react';
import { TabBar } from './TabBar';
import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface ProfileProps {
  onNavigate: (screen: 'dashboard' | 'route' | 'delivery' | 'issue' | 'profile' | 'settings') => void;
  authToken: string;
}

export function Profile({ onNavigate, authToken }: ProfileProps) {
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
      <div className="min-h-screen bg-[#0a1128] flex items-center justify-center">
        <div className="text-[#f2f4f8]">Loading Profile...</div>
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
    <div className="min-h-screen bg-[#0a1128] pb-32">
      {/* Header */}
      <div className="bg-[#050505] px-6 pt-12 pb-6">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => onNavigate('dashboard')} className="text-[#f2f4f8]">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-[#f2f4f8] flex-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Profile & Performance</h2>
          <button
            onClick={() => onNavigate('settings')}
            className="w-10 h-10 rounded-full bg-[#0a1128]/60 backdrop-blur-sm border border-[#555555]/20 flex items-center justify-center text-[#f2f4f8] hover:border-[#e10600]/50 transition-all"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-6 pt-6 space-y-4">
        {/* Driver Info Card */}
        <div className="bg-[#050505]/60 backdrop-blur-sm border border-[#555555]/20 rounded-3xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#e10600] to-[#a00500] flex items-center justify-center text-[#f2f4f8] overflow-hidden" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '2rem' }}>
              {profile?.photoUrl ? (
                <img src={profile.photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                driverName.charAt(0)
              )}
            </div>
            <div>
              <h3 className="text-[#f2f4f8] mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>{driverName}</h3>
              <div className="text-[#555555]">Driver ID: {driverId}</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <IdCard className="w-5 h-5 text-[#555555]" />
              <div>
                <div className="text-[#555555]">Emirates ID</div>
                <div className="text-[#f2f4f8]">{emiratesId}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-[#555555]" />
              <div>
                <div className="text-[#555555]">Driving License</div>
                <div className="text-[#f2f4f8]">{license}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Car className="w-5 h-5 text-[#555555]" />
              <div>
                <div className="text-[#555555]">Assigned Vehicle</div>
                <div className="text-[#f2f4f8]">{vehicle}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics (Today) */}
        <h3 className="text-[#f2f4f8] px-2" style={{ fontFamily: 'Poppins, sans-serif' }}>Today's Stats</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#050505]/60 backdrop-blur-sm border border-[#555555]/20 rounded-2xl p-4 text-center">
            <div className="w-10 h-10 bg-[#00c853]/20 rounded-xl flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-5 h-5 text-[#00c853]" />
            </div>
            <div className="text-[#f2f4f8] mb-1" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.5rem' }}>{efficiency}</div>
            <div className="text-[#555555]">Efficiency</div>
          </div>

          <div className="bg-[#050505]/60 backdrop-blur-sm border border-[#555555]/20 rounded-2xl p-4 text-center">
            <div className="w-10 h-10 bg-[#e10600]/20 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Award className="w-5 h-5 text-[#e10600]" />
            </div>
            <div className="text-[#f2f4f8] mb-1" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.5rem' }}>{totalDeliveries}</div>
            <div className="text-[#555555]">Delivered</div>
          </div>

          <div className="bg-[#050505]/60 backdrop-blur-sm border border-[#555555]/20 rounded-2xl p-4 text-center">
            <div className="w-10 h-10 bg-[#e10600]/20 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Clock className="w-5 h-5 text-[#e10600]" />
            </div>
            <div className="text-[#f2f4f8] mb-1" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.5rem' }}>{hoursWorked}h</div>
            <div className="text-[#555555]">Hours</div>
          </div>
        </div>
      </div>

      <TabBar currentTab="profile" onNavigate={onNavigate} />
    </div>
  );
}