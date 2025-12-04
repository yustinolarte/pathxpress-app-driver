import { ArrowLeft, Camera, MessageSquare, Phone, Package, MapPin, Settings, Navigation } from 'lucide-react';
import { TabBar } from './TabBar';
import { useState, useRef } from 'react';
import { api } from '../services/api';

interface DeliveryDetailProps {
  onNavigate: (screen: 'dashboard' | 'route' | 'delivery' | 'issue' | 'profile' | 'settings') => void;
  deliveryId: number | null;
  routeData?: any;
  authToken: string;
  onDeliveryUpdate: (deliveryId: number, status: string) => void;
}

export function DeliveryDetail({ onNavigate, deliveryId, routeData, authToken, onDeliveryUpdate }: DeliveryDetailProps) {
  const [photo, setPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Find delivery from routeData or use mock fallback
  const foundDelivery = routeData?.deliveries?.find((d: any) => d.id === deliveryId);

  const delivery = foundDelivery ? {
    name: foundDelivery.customerName || 'Unknown Customer',
    phone: foundDelivery.phone || '+971 50 000 0000',
    address: foundDelivery.address || 'No Address',
    weight: foundDelivery.weight || '1.0 kg',
    dimensions: foundDelivery.dimensions || '10 x 10 x 10 cm',
    reference: foundDelivery.reference || `PKG-${foundDelivery.id}`,
    cod: foundDelivery.codAmount ? `${foundDelivery.codAmount} AED` : 'Prepaid',
    lat: foundDelivery.coordinates?.lat || 0,
    lng: foundDelivery.coordinates?.lng || 0
  } : {
    name: 'Fatima Al Mansoori',
    phone: '+971 50 123 4567',
    address: 'Palm Jumeirah, Villa 234, Frond N, Dubai',
    weight: '2.5 kg',
    dimensions: '30 x 20 x 15 cm',
    reference: 'PKG-2024-001234',
    cod: '245.00 AED',
    lat: 25.1124,
    lng: 55.1390
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    if (!deliveryId) return;

    try {
      await api.updateDeliveryStatus(
        deliveryId,
        status,
        authToken,
        photo || undefined,
        '' // notes if needed
      );

      alert(`Delivery marked as ${status}`);
      onDeliveryUpdate(deliveryId, status);
      onNavigate('route');
    } catch (error) {
      console.error('Error updating delivery:', error);
      alert('Failed to update delivery. Please try again.');
    }
  };

  const handleCall = () => {
    window.location.href = `tel:${delivery.phone}`;
  };

  const handleNavigateTo = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${delivery.lat},${delivery.lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#0a1128] pb-32">
      {/* Header */}
      <div className="bg-[#050505] px-6 pt-12 pb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('route')} className="text-[#f2f4f8]">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-[#f2f4f8] flex-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Delivery Details</h2>
          <button
            onClick={() => onNavigate('settings')}
            className="w-10 h-10 rounded-full bg-[#0a1128]/60 backdrop-blur-sm border border-[#555555]/20 flex items-center justify-center text-[#f2f4f8] hover:border-[#e10600]/50 transition-all"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-6 pt-6 space-y-4">
        {/* Customer Info Card */}
        <div className="bg-[#050505]/60 backdrop-blur-sm border border-[#555555]/20 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[#f2f4f8]" style={{ fontFamily: 'Poppins, sans-serif' }}>{delivery.name}</h3>
            <div className="flex gap-2">
              <button onClick={handleNavigateTo} className="w-10 h-10 bg-[#e10600]/20 rounded-xl flex items-center justify-center hover:bg-[#e10600]/40 transition-all">
                <Navigation className="w-5 h-5 text-[#e10600]" />
              </button>
              <button onClick={handleCall} className="w-10 h-10 bg-[#00c853]/20 rounded-xl flex items-center justify-center hover:bg-[#00c853]/40 transition-all">
                <Phone className="w-5 h-5 text-[#00c853]" />
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-[#555555] mt-1 flex-shrink-0" />
            <div>
              <div className="text-[#555555] mb-1">Delivery Address</div>
              <div className="text-[#f2f4f8]">{delivery.address}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-[#555555] mt-1 flex-shrink-0" />
            <div>
              <div className="text-[#555555] mb-1">Contact Number</div>
              <div className="text-[#f2f4f8]">{delivery.phone}</div>
            </div>
          </div>
        </div>

        {/* Package Info Card */}
        <div className="bg-[#050505]/60 backdrop-blur-sm border border-[#555555]/20 rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-[#e10600]" />
            <span className="text-[#f2f4f8]" style={{ fontFamily: 'Poppins, sans-serif' }}>Package Information</span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-[#555555]">Reference</span>
              <span className="text-[#f2f4f8]">{delivery.reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#555555]">Weight</span>
              <span className="text-[#f2f4f8]">{delivery.weight}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#555555]">Dimensions</span>
              <span className="text-[#f2f4f8]">{delivery.dimensions}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#555555]/20">
            <div className="flex justify-between items-center">
              <span className="text-[#f2f4f8]">COD Amount</span>
              <span className="text-[#e10600]" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.5rem' }}>{delivery.cod}</span>
            </div>
          </div>
        </div>

        {/* Proof of Delivery */}
        <div className="bg-[#050505]/60 backdrop-blur-sm border border-[#555555]/20 rounded-3xl p-6">
          <h3 className="text-[#f2f4f8] mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Proof of Delivery</h3>

          {/* Photo Upload */}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            onChange={handlePhotoChange}
            className="hidden"
          />

          <div
            onClick={handlePhotoClick}
            className={`border-2 border-dashed ${photo ? 'border-[#00c853]' : 'border-[#555555]/30'} rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[#e10600]/50 transition-all mb-4 overflow-hidden relative`}
          >
            {photo ? (
              <img src={photo} alt="Proof of delivery" className="absolute inset-0 w-full h-full object-cover rounded-2xl opacity-50" />
            ) : null}

            <div className={`w-16 h-16 ${photo ? 'bg-[#00c853]/20' : 'bg-[#555555]/20'} rounded-full flex items-center justify-center mb-3 z-10`}>
              <Camera className={`w-8 h-8 ${photo ? 'text-[#00c853]' : 'text-[#555555]'}`} />
            </div>
            <span className={`z-10 ${photo ? 'text-[#00c853] font-bold' : 'text-[#555555]'}`}>
              {photo ? 'Photo Added (Tap to retake)' : 'Take Photo (Camera Only)'}
            </span>
          </div>

          {/* Add Note Button */}
          <button className="w-full bg-[#0a1128]/60 border border-[#555555]/30 text-[#f2f4f8] py-3 rounded-2xl flex items-center justify-center gap-2 hover:border-[#e10600]/50 transition-all">
            <MessageSquare className="w-5 h-5" />
            Add Note
          </button>
        </div>

        {/* Action Buttons - Minimalist Glass Style */}
        <div className="space-y-3 mt-6">
          {/* Delivered */}
          <button
            onClick={() => handleStatusUpdate('DELIVERED')}
            className="w-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 rounded-3xl py-4 px-5 flex items-center gap-4 hover:bg-emerald-500/30 hover:border-emerald-400/50 transition-all active:scale-[0.98]"
          >
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-emerald-400 font-semibold flex-1 text-left" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Delivered
            </span>
            <svg className="w-5 h-5 text-emerald-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Attempted */}
          <button
            onClick={() => handleStatusUpdate('ATTEMPTED')}
            className="w-full bg-amber-500/15 backdrop-blur-md border border-amber-500/25 rounded-3xl py-4 px-5 flex items-center gap-4 hover:bg-amber-500/25 hover:border-amber-400/40 transition-all active:scale-[0.98]"
          >
            <div className="w-11 h-11 rounded-2xl bg-amber-500/25 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-amber-400 font-semibold flex-1 text-left" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Attempted
            </span>
            <svg className="w-5 h-5 text-amber-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Return */}
          <button
            onClick={() => handleStatusUpdate('RETURNED')}
            className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl py-4 px-5 flex items-center gap-4 hover:bg-white/10 hover:border-white/20 transition-all active:scale-[0.98]"
          >
            <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </div>
            <span className="text-white/70 font-semibold flex-1 text-left" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Return
            </span>
            <svg className="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <TabBar currentTab="route" onNavigate={onNavigate} />
    </div>
  );
}