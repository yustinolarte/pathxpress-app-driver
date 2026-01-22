import { ArrowLeft, Camera, MessageSquare, Phone, Package, MapPin, Settings, Navigation, ChevronRight, User, Check, QrCode } from 'lucide-react';
import { TabBar } from './TabBar';
import { PODCapture } from './PODCapture';
import { DeliveryMiniMap } from './DeliveryMiniMap';
import { QuickMessage } from './QuickMessage';
import { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { timeTracker } from '../services/timeTracker';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

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
  const [actionTaken, setActionTaken] = useState(false);

  // Create derived state for completion to handle both initial load and immediate updates
  const isCompleted = (() => {
    if (actionTaken) return true;
    if (!routeData) return false;
    const stops = routeData?.stops || routeData?.deliveries || [];
    const stop = stops.find((d: any) => d.id === deliveryId);
    const status = stop?.status?.toLowerCase();
    // Added 'attempted' to the list
    return ['delivered', 'picked_up', 'returned', 'cancelled', 'attempted'].includes(status);
  })();
  const [showPODCapture, setShowPODCapture] = useState(false);
  const [showQuickMessage, setShowQuickMessage] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const sliderBtnRef = useRef<HTMLDivElement>(null);

  // Start stop timer silently in background
  useEffect(() => {
    if (deliveryId) {
      timeTracker.startStop(deliveryId);
    }
  }, [deliveryId]);

  // Find stop from routeData (check stops first, then deliveries for backward compat)
  const stops = routeData?.stops || routeData?.deliveries || [];
  const foundStop = stops.find((d: any) => d.id === deliveryId);

  // Determine if this is a pickup or delivery
  const isPickup = foundStop?.stopType === 'pickup';

  const delivery = foundStop ? {
    name: foundStop.contactName || foundStop.customerName || 'Unknown',
    phone: foundStop.contactPhone || foundStop.customerPhone || foundStop.phone || '+971 50 000 0000',
    address: foundStop.address || 'No Address',
    weight: foundStop.weight || '1.0 kg',
    dimensions: foundStop.dimensions || '10 x 10 x 10 cm',
    reference: foundStop.waybillNumber || foundStop.packageRef || foundStop.reference || `PKG-${foundStop.id}`,
    cod: foundStop.codAmount ? `${foundStop.codAmount} AED` : 'Prepaid',
    lat: foundStop.latitude || foundStop.coordinates?.lat || 0,
    lng: foundStop.longitude || foundStop.coordinates?.lng || 0,
    type: foundStop.codRequired || foundStop.codAmount ? 'COD' : 'Prepaid',
    // Shipper info for pickups
    shipperName: foundStop.shipperName,
    shipperPhone: foundStop.shipperPhone,
    shipperAddress: foundStop.shipperAddress,
    // Customer info for deliveries
    customerName: foundStop.customerName,
    customerPhone: foundStop.customerPhone,
  } : {
    name: 'Unknown',
    phone: '+971 50 000 0000',
    address: 'No Address',
    weight: '1.0 kg',
    dimensions: '10 x 10 x 10 cm',
    reference: 'PKG-0000',
    cod: 'Prepaid',
    lat: 25.1124,
    lng: 55.1390,
    type: 'Prepaid'
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
      // Use the new stops endpoint
      await api.updateStopStatus(
        deliveryId,
        status,
        authToken,
        customPhoto || photo || undefined,
        ''
      );

      setActionTaken(true); // Immediate local update
      onDeliveryUpdate(deliveryId, status);

      // Delay navigation to show success state
      setTimeout(() => {
        onNavigate('route');
      }, 500);

    } catch (error) {
      console.error('Error updating status:', error);
      onDeliveryUpdate(deliveryId, status);
      setTimeout(() => {
        onNavigate('route');
      }, 500);
    }
  };

  // Handle barcode scan for pickups
  const handleScanPickup = async () => {
    try {
      setScanError(null);

      // Check permission
      const { camera } = await BarcodeScanner.checkPermissions();
      if (camera !== 'granted') {
        const permResult = await BarcodeScanner.requestPermissions();
        if (permResult.camera !== 'granted') {
          setScanError('Camera permission required');
          return;
        }
      }

      setIsScanning(true);
      const { barcodes } = await BarcodeScanner.scan();
      setIsScanning(false);

      if (barcodes.length > 0) {
        const scannedCode = barcodes[0].rawValue;

        // Verify scanned code matches this package
        if (scannedCode === delivery.reference) {
          // End timer and mark as picked up
          if (deliveryId) {
            timeTracker.endStop(deliveryId);
          }
          setActionTaken(true);
          updateStatus('PICKED_UP');
        } else {
          setScanError(`Wrong package! Expected: ${delivery.reference}`);
        }
      }
    } catch (err: any) {
      setIsScanning(false);
      if (!err.message?.includes('canceled')) {
        setScanError('Failed to scan barcode');
      }
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

    const maxDrag = sliderRect.width - btnRect.width - 8;
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
      if (isPickup) {
        // For pickups, trigger scan instead of POD capture
        handleScanPickup();
        setDragX(0);
      } else {
        // For deliveries, show POD capture
        setShowPODCapture(true);
        setDragX(0);
      }
    } else {
      setDragX(0);
    }
  };

  const handlePODComplete = (podData: any) => {
    if (deliveryId) {
      timeTracker.endStop(deliveryId);
    }
    setShowPODCapture(false);
    setActionTaken(true);
    updateStatus('DELIVERED', podData.photoWithStamp || podData.signature || undefined);
  };

  useEffect(() => {
    if (isDragging) {
      document.body.style.overflow = 'hidden';
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
          {/* Pickup/Delivery indicator */}
          <div className={`px-4 py-2 rounded-full font-bold text-sm ${isPickup ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
            {isPickup ? 'PICKUP' : 'DELIVERY'}
          </div>
        </div>
      </div>

      {/* Content Sheet */}
      <div className="-mt-8 bg-white rounded-t-[2.5rem] flex-1 px-6 pt-8 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-10 relative flex flex-col">
        {/* Handle Bar */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 flex-shrink-0"></div>

        <div className="flex justify-between items-start mb-4 flex-shrink-0">
          <div>
            <span className="text-gray-400 font-bold text-xs uppercase tracking-widest block mb-1 flex items-center gap-1">
              {isPickup ? <Package className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
              {isPickup ? 'Pickup' : 'Drop Off'} #{deliveryId}
            </span>
            <h2 className="text-2xl font-bold font-heading text-gray-900 leading-tight">
              {isPickup ? 'Pickup Order' : `${delivery.type} Order`}
            </h2>
          </div>
          {!isPickup && (
            <div className="text-right">
              <span className="block text-xl font-bold font-heading text-primary">{delivery.cod !== 'Prepaid' ? delivery.cod : 'Paid'}</span>
              <span className="text-gray-400 text-xs font-medium">Amount to Collect</span>
            </div>
          )}
        </div>

        {/* Details List */}
        <div className="space-y-6 mb-8 overflow-y-auto flex-1">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-accent-purple flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-accent-purple-foreground" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">{isPickup ? 'Shipper' : 'Client'}</h4>
              <p className="text-gray-500 text-sm">{delivery.name}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">{isPickup ? 'Pickup Address' : 'Delivery Address'}</h4>
              <p className="text-gray-500 text-sm leading-relaxed">{delivery.address}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Package Details</h4>
              <p className="text-gray-500 text-sm">{delivery.weight}</p>
              <p className="text-gray-400 text-xs mt-1 font-mono">{delivery.reference}</p>
            </div>
          </div>

          {/* Scan Error Message */}
          {scanError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <p className="text-red-600 font-medium">{scanError}</p>
              <button
                onClick={() => setScanError(null)}
                className="text-red-500 text-sm mt-2"
              >
                Dismiss
              </button>
            </div>
          )}
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

        {/* Pickup: Scan Button instead of Slider */}
        {isPickup ? (
          <div className="mt-auto flex-shrink-0 pb-[calc(2rem+env(safe-area-inset-bottom))]">
            <button
              onClick={handleScanPickup}
              disabled={isCompleted || isScanning}
              className={`w-full py-5 rounded-[2rem] font-bold text-lg shadow-xl flex items-center justify-center gap-3 transition-all ${isCompleted
                ? 'bg-green-500 text-white'
                : 'bg-orange-500 text-white hover:bg-orange-600'
                } ${isScanning ? 'opacity-70' : ''}`}
            >
              {isCompleted ? (
                <>
                  <Check className="w-6 h-6" />
                  Picked Up!
                </>
              ) : (
                <>
                  <QrCode className="w-6 h-6" />
                  {isScanning ? 'Scanning...' : 'Scan to Pickup'}
                </>
              )}
            </button>
          </div>
        ) : (
          /* Delivery: Slide to Complete */
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
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className={`font-bold text-lg transition-opacity ${isCompleted ? 'text-white' : 'text-white/40'}`}>
                  {isCompleted ? 'Delivered!' : 'Slide to complete'}
                </span>
              </div>

              <div
                ref={sliderBtnRef}
                style={{ transform: `translateX(${dragX}px)` }}
                className={`absolute left-1 w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-md transition-transform duration-75 cursor-grab z-10 ${isDragging ? 'scale-105' : 'scale-100'}`}
              >
                {isCompleted ? <Check className="w-6 h-6 text-green-600" /> : <ChevronRight className="w-6 h-6 text-black" />}
              </div>
            </div>

            {/* Only show these actions if NOT completed */}
            {!isCompleted && (
              <div className="flex gap-2">
                <button onClick={() => updateStatus('ATTEMPTED')} className="flex-1 py-3 text-sm font-semibold text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-50">
                  Mark Attempted
                </button>
                <button onClick={() => updateStatus('RETURNED')} className="flex-1 py-3 text-sm font-semibold text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-50">
                  Mark Returned
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* POD Capture Modal (only for deliveries) */}
      {showPODCapture && deliveryId && !isPickup && (
        <PODCapture
          deliveryId={deliveryId}
          customerName={delivery.name}
          deliveryType={delivery.type}
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