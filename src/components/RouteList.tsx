import { ArrowLeft, Navigation, Settings, MapPin, Truck, Wallet } from 'lucide-react';
import { TabBar } from './TabBar';
import { useState } from 'react';

interface RouteListProps {
  onNavigate: (screen: 'dashboard' | 'route' | 'delivery' | 'issue' | 'profile' | 'settings') => void;
  onSelectDelivery: (id: number) => void;
  routeData?: any;
}

const defaultDeliveries = [
  { id: 1, name: 'Fatima Al Mansoori', address: 'Palm Jumeirah, Villa 234', distance: '2.1 km', status: 'Pending', type: 'COD', cod: '245.00 AED', lat: 25.1124, lng: 55.1390 },
  { id: 2, name: 'Mohammed Hassan', address: 'Dubai Marina, Tower 3, Apt 1205', distance: '3.2 km', status: 'Pending', type: 'Prepaid', cod: null, lat: 25.0805, lng: 55.1410 },
  { id: 3, name: 'Sarah Johnson', address: 'Business Bay, Office 45B', distance: '1.8 km', status: 'Delivered', type: 'COD', cod: '180.00 AED', lat: 25.1872, lng: 55.2631 },
  { id: 4, name: 'Abdullah Rashid', address: 'Al Barsha, Building 7, Unit 302', distance: '4.5 km', status: 'Pending', type: 'Prepaid', cod: null, lat: 25.1148, lng: 55.1961 },
  { id: 5, name: 'Layla Ahmed', address: 'Jumeirah Beach Residence, Block C', distance: '2.9 km', status: 'Attempted', type: 'COD', cod: '320.00 AED', lat: 25.0781, lng: 55.1342 },
  { id: 6, name: 'Omar Al Zaabi', address: 'Downtown Dubai, Burj Views', distance: '3.7 km', status: 'Pending', type: 'Return', cod: null, lat: 25.1972, lng: 55.2744 },
];

export function RouteList({ onNavigate, onSelectDelivery, routeData }: RouteListProps) {
  const [filter, setFilter] = useState<'All' | 'Pending' | 'COD' | 'Returns'>('All');
  const [showNavigateModal, setShowNavigateModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<{ address: string; lat: number; lng: number } | null>(null);

  // Use routeData deliveries if available, otherwise use defaultDeliveries
  // Map routeData deliveries to match the component's expected structure if needed
  const deliveries = routeData?.deliveries?.map((d: any) => ({
    id: d.id,
    name: d.customerName || 'Unknown Customer',
    address: d.address || 'No Address',
    distance: '0.0 km', // Placeholder as we don't have real distance calc yet
    status: d.status === 'pending' ? 'Pending' : d.status === 'completed' ? 'Delivered' : d.status,
    type: d.codAmount ? 'COD' : 'Prepaid', // Simple logic for type
    cod: d.codAmount ? `${d.codAmount} AED` : null,
    lat: d.coordinates?.lat || 0,
    lng: d.coordinates?.lng || 0
  })) || defaultDeliveries;

  const filteredDeliveries = deliveries.filter((delivery: any) => {
    if (filter === 'All') return true;
    if (filter === 'Pending') return delivery.status === 'Pending';
    if (filter === 'COD') return delivery.type === 'COD';
    if (filter === 'Returns') return delivery.type === 'Return';
    return true;
  });

  const statusColors: Record<string, string> = {
    Pending: 'bg-[#555555] text-[#f2f4f8]',
    Delivered: 'bg-[#00c853] text-[#f2f4f8]',
    Attempted: 'bg-[#ff9800] text-[#050505]',
  };

  const handleNavigateClick = (e: React.MouseEvent, delivery: any) => {
    e.stopPropagation();
    setSelectedAddress({
      address: delivery.address,
      lat: delivery.lat,
      lng: delivery.lng,
    });
    setShowNavigateModal(true);
  };

  const openGoogleMaps = () => {
    if (!selectedAddress) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedAddress.lat},${selectedAddress.lng}`;
    window.open(url, '_blank');
    setShowNavigateModal(false);
  };

  const openWaze = () => {
    if (!selectedAddress) return;
    const url = `https://waze.com/ul?ll=${selectedAddress.lat},${selectedAddress.lng}&navigate=yes`;
    window.open(url, '_blank');
    setShowNavigateModal(false);
  };

  // Sort deliveries: PENDING first, then ATTEMPTED, then COMPLETED/OTHERS
  const sortedDeliveries = filteredDeliveries.sort((a: any, b: any) => {
    const statusOrder: Record<string, number> = {
      'Pending': 1,
      'Attempted': 2,
      'Delivered': 3,
      'Returned': 3,
      'Cancelled': 3
    };

    const orderA = statusOrder[a.status] || 4;
    const orderB = statusOrder[b.status] || 4;

    return orderA - orderB;
  });

  return (
    <div className="min-h-screen bg-[#0a1128] pb-32">
      {/* Header */}
      <div className="bg-[#050505] px-6 pt-12 pb-6">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => onNavigate('dashboard')} className="text-[#f2f4f8]">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-[#f2f4f8] flex-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Today's Stops</h2>
          <button
            onClick={() => onNavigate('settings')}
            className="w-10 h-10 rounded-full bg-[#0a1128]/60 backdrop-blur-sm border border-[#555555]/20 flex items-center justify-center text-[#f2f4f8] hover:border-[#e10600]/50 transition-all"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Route Summary Info */}
        <div className="bg-[#0a1128]/60 backdrop-blur-sm border border-[#555555]/20 rounded-2xl p-4 mb-6 flex justify-between items-center text-xs">
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 bg-[#e10600]/20 rounded-full flex items-center justify-center mb-1">
              <MapPin className="w-4 h-4 text-[#e10600]" />
            </div>
            <span className="text-[#555555]">Zone</span>
            <span className="text-[#f2f4f8] font-medium">Deira</span>
          </div>
          <div className="w-px h-8 bg-[#555555]/20"></div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 bg-[#e10600]/20 rounded-full flex items-center justify-center mb-1">
              <Truck className="w-4 h-4 text-[#e10600]" />
            </div>
            <span className="text-[#555555]">Vehicle</span>
            <span className="text-[#f2f4f8] font-medium">DXB 4523</span>
          </div>
          <div className="w-px h-8 bg-[#555555]/20"></div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 bg-[#e10600]/20 rounded-full flex items-center justify-center mb-1">
              <Wallet className="w-4 h-4 text-[#e10600]" />
            </div>
            <span className="text-[#555555]">COD Total</span>
            <span className="text-[#f2f4f8] font-medium">0.00 AED</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['All', 'Pending', 'COD', 'Returns'] as const).map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-5 py-2 rounded-full whitespace-nowrap transition-all ${filter === filterOption
                ? 'bg-[#e10600] text-[#f2f4f8]'
                : 'bg-[#0a1128]/60 text-[#555555] border border-[#555555]/30'
                }`}
            >
              {filterOption}
            </button>
          ))}
        </div>
      </div>

      {/* Delivery List */}
      <div className="px-6 pt-4 space-y-3">
        {sortedDeliveries.map((delivery: any) => {
          const isCompleted = ['Delivered', 'Returned', 'Cancelled'].includes(delivery.status);

          return (
            <div
              key={delivery.id}
              onClick={() => !isCompleted && onSelectDelivery(delivery.id)}
              className={`backdrop-blur-sm border rounded-3xl p-5 transition-all ${isCompleted
                  ? 'bg-[#050505]/30 border-[#555555]/10 opacity-60 cursor-not-allowed'
                  : 'bg-[#050505]/60 border-[#555555]/20 cursor-pointer hover:border-[#e10600]/50'
                }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className={`mb-1 ${isCompleted ? 'text-[#555555]' : 'text-[#f2f4f8]'}`} style={{ fontFamily: 'Poppins, sans-serif' }}>{delivery.name}</h3>
                  <p className="text-[#555555]">{delivery.address}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {delivery.type === 'COD' && (
                    <span className="px-3 py-1 bg-[#e10600] text-[#f2f4f8] rounded-full text-xs">COD</span>
                  )}
                  {delivery.type === 'Prepaid' && (
                    <span className="px-3 py-1 bg-[#555555]/40 text-[#f2f4f8] rounded-full text-xs">Prepaid</span>
                  )}
                  {delivery.type === 'Return' && (
                    <span className="px-3 py-1 bg-[#555555]/40 text-[#f2f4f8] rounded-full text-xs">Return</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-[#555555]">{delivery.distance}</span>
                  <span className={`px-3 py-1 rounded-full text-xs ${statusColors[delivery.status] || 'bg-[#555555] text-[#f2f4f8]'}`}>
                    {delivery.status}
                  </span>
                </div>
                {!isCompleted && (
                  <button
                    onClick={(e) => handleNavigateClick(e, delivery)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#e10600] text-[#f2f4f8] rounded-xl hover:bg-[#c10500] transition-all"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Navigate</span>
                  </button>
                )}
              </div>

              {delivery.cod && (
                <div className="mt-3 pt-3 border-t border-[#555555]/20">
                  <span className={`text-[#f2f4f8] ${isCompleted ? 'text-[#555555]' : ''}`} style={{ fontFamily: 'Poppins, sans-serif' }}>COD: {delivery.cod}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <TabBar currentTab="route" onNavigate={onNavigate} />

      {/* Navigation Modal */}
      {showNavigateModal && (
        <div className="fixed inset-0 bg-[#050505]/95 backdrop-blur-sm z-50 flex items-center justify-center px-6">
          <div className="w-full max-w-md">
            <div className="bg-[#0a1128] border border-[#555555]/20 rounded-3xl p-6">
              <h3 className="text-[#f2f4f8] mb-2 text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Choose Navigation App
              </h3>
              <p className="text-[#555555] text-center mb-6">
                {selectedAddress?.address}
              </p>

              <div className="space-y-3 mb-4">
                <button
                  onClick={openGoogleMaps}
                  className="w-full bg-[#050505]/60 backdrop-blur-sm border border-[#555555]/20 text-[#f2f4f8] py-5 rounded-2xl hover:border-[#e10600]/50 transition-all flex items-center justify-center gap-3"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  <div className="w-10 h-10 bg-[#4285F4] rounded-xl flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-white" />
                  </div>
                  Google Maps
                </button>

                <button
                  onClick={openWaze}
                  className="w-full bg-[#050505]/60 backdrop-blur-sm border border-[#555555]/20 text-[#f2f4f8] py-5 rounded-2xl hover:border-[#e10600]/50 transition-all flex items-center justify-center gap-3"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  <div className="w-10 h-10 bg-[#33CCFF] rounded-xl flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-white" />
                  </div>
                  Waze
                </button>
              </div>

              <button
                onClick={() => setShowNavigateModal(false)}
                className="w-full bg-[#555555]/20 text-[#f2f4f8] py-4 rounded-2xl hover:bg-[#555555]/30 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}