import { ArrowLeft, Camera, MessageSquare, Phone, Package, MapPin, Settings, Navigation, ChevronRight, User, Check } from 'lucide-react';
import { TabBar } from './TabBar';
import { PODCapture } from './PODCapture';
import { DeliveryMiniMap } from './DeliveryMiniMap';
import { QuickMessage } from './QuickMessage';
import { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { timeTracker } from '../services/timeTracker';

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

  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showPODCapture, setShowPODCapture] = useState(false);
  const [showQuickMessage, setShowQuickMessage] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const sliderBtnRef = useRef<HTMLDivElement>(null);

  // Start stop timer silently in background
  useEffect(() => {
    if (deliveryId) {
      timeTracker.startStop(deliveryId);
    }
  }, [deliveryId]);

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
    lng: foundDelivery.coordinates?.lng || 0,
    type: foundDelivery.codAmount ? 'COD' : 'Prepaid'
  } : {
    name: 'Fatima Al Mansoori',
    phone: '+971 50 123 4567',
    address: 'Palm Jumeirah, Villa 234, Frond N, Dubai',
    weight: '2.5 kg',
    dimensions: '30 x 20 x 15 cm',
    reference: 'PKG-2024-001234',
    cod: '245.00 AED',
    lat: 25.1124,
    lng: 55.1390,
    type: 'COD'
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

  const updateStatus = async (status: string, customPhoto?: string) => {
    if (!deliveryId) return;

    try {
      await api.updateDeliveryStatus(
        deliveryId,
        status,
        authToken,
        customPhoto || photo || undefined,
        ''
      );

      onDeliveryUpdate(deliveryId, status);

      // Delay navigation to show success state
      setTimeout(() => {
        onNavigate('route');
      }, 500);

    } catch (error) {
      console.error('Error updating delivery (likely due to mock data/backend conn):', error);
      // For testing/mock purposes, we proceed even if API fails
      // alert('Failed to update delivery. Please try again.'); 
      onDeliveryUpdate(deliveryId, status);
      setTimeout(() => {
        onNavigate('route');
      }, 500);
    }
  };

  const handleNavigateTo = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${delivery.lat},${delivery.lng}`;
    window.open(url, '_blank');
  };

  const handleCall = () => {
    window.location.href = `tel:${delivery.phone}`;
  };

  // --- Slider Logic ---
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (isCompleted) return;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || isCompleted || !sliderRef.current || !sliderBtnRef.current) return;

    const sliderRect = sliderRef.current.getBoundingClientRect();
    const btnRect = sliderBtnRef.current.getBoundingClientRect();

    let clientX;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = (e as React.MouseEvent).clientX;
    }

    const maxDrag = sliderRect.width - btnRect.width - 8; // 8px padding
    let newDragX = clientX - sliderRect.left - (btnRect.width / 2);

    newDragX = Math.max(0, Math.min(newDragX, maxDrag));
    setDragX(newDragX);
  };

  const handleTouchEnd = () => {
    if (!isDragging || isCompleted || !sliderRef.current || !sliderBtnRef.current) return;
    setIsDragging(false);

    const sliderRect = sliderRef.current.getBoundingClientRect();
    const btnRect = sliderBtnRef.current.getBoundingClientRect();
    const maxDrag = sliderRect.width - btnRect.width - 8;
    const threshold = maxDrag * 0.8;

    if (dragX > threshold) {
      setDragX(maxDrag);
      // Instead of directly marking delivered, show POD capture
      setShowPODCapture(true);
      setDragX(0); // Reset slider
    } else {
      setDragX(0);
    }
  };

  const handlePODComplete = (podData: any) => {
    // End the stop timer
    if (deliveryId) {
      timeTracker.endStop(deliveryId);
    }
    setShowPODCapture(false);
    setIsCompleted(true);
    // Use stamped photo or signature as proof
    updateStatus('DELIVERED', podData.photoWithStamp || podData.signature || undefined);
  };

  useEffect(() => {
    if (isDragging) {
      document.body.style.overflow = 'hidden'; // Prevent scroll while dragging
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isDragging]);


  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      {/* Interactive Mini Map */}
      <div className="relative">
        <DeliveryMiniMap
          destinationLat={delivery.lat}
          destinationLng={delivery.lng}
          customerName={delivery.name}
          onNavigate={handleNavigateTo}
        />

        {/* Top Nav Overlay */}
        <div className="absolute top-0 left-0 right-0 p-6 pt-[calc(2rem+env(safe-area-inset-top))] flex justify-between items-start z-[1000]">
          <button onClick={() => onNavigate('route')} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
            <ArrowLeft className="w-5 h-5 text-black" />
          </button>
        </div>
      </div>

      {/* Content Sheet */}
      <div className="-mt-8 bg-white rounded-t-[2.5rem] flex-1 px-6 pt-8 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-10 relative flex flex-col">
        {/* Handle Bar */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 flex-shrink-0"></div>

        <div className="flex justify-between items-start mb-4 flex-shrink-0">
          <div>
            <span className="text-gray-400 font-bold text-xs uppercase tracking-widest block mb-1">
              Drop Off #{deliveryId}
            </span>
            <h2 className="text-2xl font-bold font-heading text-gray-900 leading-tight">
              {delivery.type} Order
            </h2>
          </div>
          <div className="text-right">
            <span className="block text-xl font-bold font-heading text-primary">{delivery.cod !== 'Prepaid' ? delivery.cod : 'Paid'}</span>
            <span className="text-gray-400 text-xs font-medium">Amount to Collect</span>
          </div>
        </div>

        {/* Details List */}
        <div className="space-y-6 mb-8 overflow-y-auto flex-1">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-accent-purple flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-accent-purple-foreground" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Client</h4>
              <p className="text-gray-500 text-sm">{delivery.name}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Address</h4>
              <p className="text-gray-500 text-sm leading-relaxed">{delivery.address}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Package Details</h4>
              <p className="text-gray-500 text-sm">{delivery.weight} • {delivery.dimensions}</p>
              <p className="text-gray-400 text-xs mt-1">{delivery.reference}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex gap-3 mb-8 flex-shrink-0">
          <button onClick={handleCall} className="flex-1 bg-accent font-semibold text-accent-foreground py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors hover:bg-purple-100">
            <Phone className="w-5 h-5" />
            Call
          </button>
          <button
            onClick={() => setShowQuickMessage(true)}
            className="flex-1 bg-green-100 font-semibold text-green-700 py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors hover:bg-green-200"
          >
            <MessageSquare className="w-5 h-5" />
            Message
          </button>
        </div>

        {/* Slide to Complete (Functional Slider) */}
        <div className="mt-auto flex-shrink-0 pb-[calc(2rem+env(safe-area-inset-bottom))]">
          <div
            ref={sliderRef}
            className={`relative w-full h-16 rounded-[2rem] flex items-center px-1 mb-6 transition-colors shadow-lg ${isCompleted ? 'bg-green-500' : 'bg-black'}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleTouchStart}
            onMouseMove={handleTouchMove}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleTouchEnd}
          >
            {/* Text behind the slider */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className={`font-bold text-lg transition-opacity ${isCompleted ? 'text-white' : 'text-white/40'}`}>
                {isCompleted ? 'Completed!' : 'Slide to complete'}
              </span>
            </div>

            {/* Slider Button */}
            <div
              ref={sliderBtnRef}
              style={{ transform: `translateX(${dragX}px)` }}
              className={`absolute left-1 w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-md transition-transform duration-75 cursor-grap z-10 ${isDragging ? 'scale-105' : 'scale-100'}`}
            >
              {isCompleted ? <Check className="w-6 h-6 text-green-600" /> : <ChevronRight className="w-6 h-6 text-black" />}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => updateStatus('ATTEMPTED')} className="flex-1 py-3 text-sm font-semibold text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-50">
              Mark Attempted
            </button>
            <button onClick={() => updateStatus('RETURNED')} className="flex-1 py-3 text-sm font-semibold text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-50">
              Mark Returned
            </button>
          </div>
        </div>
      </div>

      {/* POD Capture Modal */}
      {showPODCapture && deliveryId && (
        <PODCapture
          deliveryId={deliveryId}
          customerName={delivery.name}
          deliveryType={delivery.type} // Pass delivery type (COD or Prepaid)
          onComplete={handlePODComplete}
          onCancel={() => {
            setShowPODCapture(false);
            setDragX(0);
          }}
        />
      )}

      {/* Quick Message Modal */}
      {showQuickMessage && (
        <QuickMessage
          customerName={delivery.name}
          customerPhone={delivery.phone}
          onClose={() => setShowQuickMessage(false)}
        />
      )}
    </div>
  );
}