import { ScreenName, TabBar } from './TabBar';
import { PODCapture } from './PODCapture';
import { DeliveryMiniMap } from './DeliveryMiniMap';
import { QuickMessage } from './QuickMessage';
import { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { timeTracker } from '../services/timeTracker';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

interface DeliveryDetailProps {
  onNavigate: (screen: ScreenName) => void;
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

  const isCompleted = (() => {
    if (actionTaken) return true;
    if (!routeData) return false;
    const stops = routeData?.stops || routeData?.deliveries || [];
    const stop = stops.find((d: any) => d.id === deliveryId);
    const status = stop?.status?.toLowerCase();
    return ['delivered', 'picked_up', 'returned', 'cancelled'].includes(status);
  })();

  const [showPODCapture, setShowPODCapture] = useState(false);
  const [showQuickMessage, setShowQuickMessage] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const sliderBtnRef = useRef<HTMLDivElement>(null);
  const [showCODConfirm, setShowCODConfirm] = useState(false);
  const [collectedAmount, setCollectedAmount] = useState<string>('');
  const [showActionSheet, setShowActionSheet] = useState(false);

  const stops = routeData?.stops || routeData?.deliveries || [];
  const foundStop = stops.find((d: any) => d.id === deliveryId);
  const isPickup = foundStop?.stopType === 'pickup';

  const delivery = foundStop ? {
    name: foundStop.contactName || foundStop.customerName || 'Unknown',
    phone: foundStop.contactPhone || foundStop.customerPhone || foundStop.phone || '+971 50 000 0000',
    address: foundStop.address || 'No Address',
    weight: foundStop.weight || '1.0 kg',
    dimensions: foundStop.dimensions || '10 x 10 x 10 cm',
    reference: foundStop.waybillNumber || foundStop.packageRef || foundStop.reference || `PKG-${foundStop.id}`,
    cod: foundStop.codAmount ? `${foundStop.codAmount} AED` : 'Prepaid',
    codAmount: Number(foundStop.codAmount) || 0,
    lat: foundStop.latitude || foundStop.coordinates?.lat || 0,
    lng: foundStop.longitude || foundStop.coordinates?.lng || 0,
    type: foundStop.codRequired || foundStop.codAmount ? 'COD' : 'Prepaid',
    shipperName: foundStop.shipperName,
    shipperPhone: foundStop.shipperPhone,
    shipperAddress: foundStop.shipperAddress,
    customerName: foundStop.customerName,
    customerPhone: foundStop.customerPhone,
    // FIXED: Aggregate notes from ALL related stops (e.g. pickup notes showing on delivery)
    specialInstructions: (() => {
      const currentNotes = foundStop.specialInstructions || foundStop.notes || foundStop.instructions || foundStop.special_instructions || foundStop.SpecialInstructions || foundStop.Instruction || foundStop.comment || '';

      // If we have an orderId, check other stops in the same order
      if (foundStop.orderId) {
        const relatedStops = stops.filter((s: any) => s.orderId === foundStop.orderId && s.id !== foundStop.id);
        const relatedNotes = relatedStops
          .map((s: any) => s.specialInstructions || s.notes || s.instructions || s.special_instructions || '')
          .filter((n: string) => n && n !== currentNotes) // Dedup
          .join('. ');

        return [currentNotes, relatedNotes].filter(Boolean).join('. ');
      }
      return currentNotes;
    })(),
  } : {
    name: 'Unknown', phone: '+971 50 000 0000', address: 'No Address',
    weight: '1.0 kg', dimensions: '10 x 10 x 10 cm', reference: 'PKG-0000',
    cod: 'Prepaid', codAmount: 0, lat: 25.1124, lng: 55.1390, type: 'Prepaid',
    specialInstructions: '',
  };

  useEffect(() => {
    if (delivery.cod) {
      const match = delivery.cod.match(/[\d.]+/);
      if (match) setCollectedAmount(match[0]);
    }
  }, [delivery.cod]);

  useEffect(() => {
    if (deliveryId) timeTracker.startStop(deliveryId);
  }, [deliveryId]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const updateStatus = async (status: string, customPhoto?: string, notes?: string) => {
    if (!deliveryId) return;
    try {
      await api.updateStopStatus(deliveryId, status, authToken, customPhoto || photo || undefined, notes || '', parseFloat(collectedAmount) || undefined);
      setActionTaken(true);
      onDeliveryUpdate(deliveryId, status);
      setTimeout(() => onNavigate('route'), 500);
    } catch (error) {
      console.error('Error updating status:', error);
      onDeliveryUpdate(deliveryId, status);
      setTimeout(() => onNavigate('route'), 500);
    }
  };

  const handleScanPickup = async () => {
    try {
      setScanError(null);
      const { camera } = await BarcodeScanner.checkPermissions();
      if (camera !== 'granted') {
        const permResult = await BarcodeScanner.requestPermissions();
        if (permResult.camera !== 'granted') { setScanError('Camera permission required'); return; }
      }
      setIsScanning(true);
      const { barcodes } = await BarcodeScanner.scan();
      setIsScanning(false);
      if (barcodes.length > 0) {
        const scannedCode = barcodes[0].rawValue;
        if (scannedCode === delivery.reference) {
          if (deliveryId) timeTracker.endStop(deliveryId);
          setActionTaken(true);
          updateStatus('picked_up');
        } else {
          setScanError(`Wrong package! Expected: ${delivery.reference}`);
        }
      }
    } catch (err: any) {
      setIsScanning(false);
      if (!err.message?.includes('canceled')) setScanError('Failed to scan barcode');
    }
  };

  const handleNavigateTo = () => {
    const hasCoords = delivery.lat && delivery.lng && delivery.lat !== 0 && delivery.lng !== 0;
    const url = hasCoords
      ? `https://www.google.com/maps/dir/?api=1&destination=${delivery.lat},${delivery.lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(delivery.address)}`;
    window.open(url, '_blank');
  };

  const handleCall = () => { window.location.href = `tel:${delivery.phone}`; };
  const handleWhatsApp = () => {
    const cleanPhone = delivery.phone.replace(/\s/g, '').replace(/^\+/, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  // Slider logic
  const handleTouchStart = () => { if (!isCompleted) setIsDragging(true); };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || isCompleted || !sliderRef.current || !sliderBtnRef.current) return;
    const sliderRect = sliderRef.current.getBoundingClientRect();
    const btnRect = sliderBtnRef.current.getBoundingClientRect();
    let clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const maxDrag = sliderRect.width - btnRect.width - 8;
    let newDragX = clientX - sliderRect.left - (btnRect.width / 2);
    setDragX(Math.max(0, Math.min(newDragX, maxDrag)));
  };

  const handleTouchEnd = () => {
    if (!isDragging || isCompleted || !sliderRef.current || !sliderBtnRef.current) return;
    setIsDragging(false);
    const sliderRect = sliderRef.current.getBoundingClientRect();
    const btnRect = sliderBtnRef.current.getBoundingClientRect();
    const maxDrag = sliderRect.width - btnRect.width - 8;
    if (dragX > maxDrag * 0.8) {
      setDragX(maxDrag);
      if (isPickup) { handleScanPickup(); setDragX(0); }
      else if (delivery.type === 'COD') { setShowCODConfirm(true); setDragX(0); }
      else { setShowPODCapture(true); setDragX(0); }
    } else { setDragX(0); }
  };

  const handlePODComplete = (podData: any) => {
    if (deliveryId) timeTracker.endStop(deliveryId);
    setShowPODCapture(false);
    setActionTaken(true);
    updateStatus('delivered', podData.photoWithStamp || podData.signature || undefined);
  };

  useEffect(() => {
    document.body.style.overflow = isDragging ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isDragging]);

  const statusColor = foundStop?.status?.toLowerCase() === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
    ['delivered', 'picked_up'].includes(foundStop?.status?.toLowerCase()) ? 'bg-green-500/20 text-green-400' :
      'bg-gray-700 text-gray-300';

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      {/* Map section */}
      <div className="relative">
        <DeliveryMiniMap
          destinationLat={delivery.lat}
          destinationLng={delivery.lng}
          customerName={delivery.name}
          address={delivery.address}
          onNavigate={handleNavigateTo}
        />

        {/* Top nav overlay */}
        <div className="absolute top-0 left-0 right-0 p-5 pt-[calc(1.5rem+env(safe-area-inset-top))] flex justify-between items-start z-[1000]">
          <button onClick={() => onNavigate('route')} className="w-10 h-10 bg-surface-dark/90 backdrop-blur-sm rounded-full flex items-center justify-center border border-gray-700/50">
            <span className="material-symbols-rounded text-white text-xl">arrow_back</span>
          </button>
          <div className={`px-3 py-1.5 rounded-full font-bold text-xs ${isPickup ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-primary/20 text-primary border border-primary/30'
            }`}>
            {isPickup ? 'PICKUP' : 'DELIVERY'}
          </div>
        </div>
      </div>

      {/* Content Sheet */}
      <div className="-mt-6 bg-background rounded-t-3xl flex-1 px-5 pt-6 pb-4 z-10 relative flex flex-col border-t border-gray-800/50">
        {/* Handle Bar */}
        <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-5 flex-shrink-0" />

        {/* Order ID + Status */}
        <div className="text-center mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">Order #{deliveryId}</p>
          <span className={`inline-block mt-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
            {foundStop?.status || 'Pending'}
          </span>
        </div>

        {/* COD Highlight Card */}
        {delivery.type === 'COD' && !isPickup && (
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-rounded text-primary text-xl">payments</span>
                </div>
                <div>
                  <p className="text-xs text-primary/80 font-medium">To Collect (COD)</p>
                  <p className="text-2xl font-bold text-primary">{delivery.cod}</p>
                </div>
              </div>
              <span className="material-symbols-rounded text-primary/40 text-3xl">monetization_on</span>
            </div>
          </div>
        )}

        {/* Scrollable content area */}
        <div className="space-y-3 mb-4 overflow-y-auto flex-1">
          {/* Customer Card */}
          <div className="bg-card rounded-xl p-4 border border-gray-800/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-darker flex items-center justify-center">
                  <span className="material-symbols-rounded text-gray-400">person</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{isPickup ? 'Shipper' : 'Customer'}</p>
                  <h3 className="text-base font-bold text-foreground">{delivery.name}</h3>
                </div>
              </div>
            </div>
            {/* Quick contact actions */}
            <div className="flex gap-2">
              <button onClick={handleCall} className="flex-1 bg-surface-darker rounded-lg py-2.5 flex items-center justify-center gap-2 active:scale-95 transition-transform border border-gray-800/50">
                <span className="material-symbols-rounded text-blue-400 text-lg">call</span>
                <span className="text-xs font-medium text-gray-300">Call</span>
              </button>
              <button onClick={() => setShowQuickMessage(true)} className="flex-1 bg-surface-darker rounded-lg py-2.5 flex items-center justify-center gap-2 active:scale-95 transition-transform border border-gray-800/50">
                <span className="material-symbols-rounded text-green-400 text-lg">chat</span>
                <span className="text-xs font-medium text-gray-300">WhatsApp</span>
              </button>
              <button onClick={() => window.open(`sms:${delivery.phone}`, '_blank')} className="flex-1 bg-surface-darker rounded-lg py-2.5 flex items-center justify-center gap-2 active:scale-95 transition-transform border border-gray-800/50">
                <span className="material-symbols-rounded text-purple-400 text-lg">sms</span>
                <span className="text-xs font-medium text-gray-300">SMS</span>
              </button>
            </div>
          </div>

          {/* Address Card */}
          <div className="bg-card rounded-xl p-4 border border-gray-800/50" onClick={handleNavigateTo}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-darker flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-rounded text-primary">location_on</span>
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">{isPickup ? 'Pickup Address' : 'Delivery Address'}</p>
                <p className="text-sm font-medium text-foreground mt-0.5 leading-relaxed">{delivery.address}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-rounded text-primary text-lg">navigation</span>
              </div>
            </div>
          </div>

          {/* Special Instructions - FIXED: High contrast visibility */}
          {delivery.specialInstructions && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-3">
              <div className="flex items-start gap-3">
                <span className="material-symbols-rounded text-yellow-500 text-xl">info</span>
                <div>
                  <p className="text-xs text-yellow-500 font-bold uppercase tracking-wider mb-1">Special Instructions</p>
                  <p className="text-sm text-foreground leading-relaxed">{delivery.specialInstructions}</p>
                </div>
              </div>
            </div>
          )}

          {/* Package Details Card */}
          <div className="bg-card rounded-xl p-4 border border-gray-800/50">
            <p className="text-xs text-gray-500 font-medium mb-3">Package Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-darker rounded-lg p-3">
                <span className="material-symbols-rounded text-gray-500 text-lg mb-1 block">scale</span>
                <p className="text-xs text-gray-500">Weight</p>
                <p className="text-sm font-bold text-foreground">{delivery.weight}</p>
              </div>
              <div className="bg-surface-darker rounded-lg p-3">
                <span className="material-symbols-rounded text-gray-500 text-lg mb-1 block">straighten</span>
                <p className="text-xs text-gray-500">Dims</p>
                <p className="text-sm font-bold text-foreground">{delivery.dimensions}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="material-symbols-rounded text-gray-600 text-sm">qr_code</span>
              <p className="text-xs text-gray-500 font-mono">{delivery.reference}</p>
            </div>
          </div>

          {/* Scan Error */}
          {scanError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <span className="material-symbols-rounded text-red-400">error</span>
              <div className="flex-1">
                <p className="text-sm text-red-400 font-medium">{scanError}</p>
                <button onClick={() => setScanError(null)} className="text-red-500/70 text-xs mt-1 underline">Dismiss</button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Sheet */}
        {isPickup ? (
          <div className="flex-shrink-0 pb-[env(safe-area-inset-bottom)]">
            <button
              onClick={handleScanPickup}
              disabled={isCompleted || isScanning}
              className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${isCompleted ? 'bg-green-600 text-white' : 'bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.98]'
                } ${isScanning ? 'opacity-70' : ''}`}
            >
              <span className="material-symbols-rounded text-xl">{isCompleted ? 'check_circle' : 'qr_code_scanner'}</span>
              {isCompleted ? 'Picked Up!' : isScanning ? 'Scanning...' : 'Scan to Pickup'}
            </button>
          </div>
        ) : (
          <div className="flex-shrink-0 pb-[env(safe-area-inset-bottom)]">
            {/* Main Slider */}
            <div
              ref={sliderRef}
              className={`relative w-full h-14 rounded-xl flex items-center px-1 mb-3 transition-colors ${isCompleted ? 'bg-green-600' : 'bg-primary'}`}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleTouchStart}
              onMouseMove={handleTouchMove}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
            >
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className={`font-bold text-base ${isCompleted ? 'text-white' : 'text-white/60'}`}>
                  {isCompleted ? 'Delivered!' : 'Slide to Deliver'}
                </span>
              </div>
              <div
                ref={sliderBtnRef}
                style={{ transform: `translateX(${dragX}px)` }}
                className={`absolute left-1 w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-md transition-transform duration-75 cursor-grab z-10 ${isDragging ? 'scale-105' : ''}`}
              >
                <span className="material-symbols-rounded text-xl text-gray-900">
                  {isCompleted ? 'check' : 'chevron_right'}
                </span>
              </div>
            </div>

            {/* Secondary Actions */}
            {!isCompleted && (
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => updateStatus('attempted')}
                  className="py-2.5 text-[10px] font-semibold text-gray-400 rounded-lg bg-surface-dark border border-gray-800/50 flex flex-col items-center gap-1 active:scale-95 transition-transform"
                >
                  <span className="material-symbols-rounded text-yellow-500 text-lg">door_front</span>
                  No Answer
                </button>
                <button
                  onClick={() => updateStatus('on_hold')}
                  className="py-2.5 text-[10px] font-semibold text-gray-400 rounded-lg bg-surface-dark border border-gray-800/50 flex flex-col items-center gap-1 active:scale-95 transition-transform"
                >
                  <span className="material-symbols-rounded text-blue-400 text-lg">schedule</span>
                  Reschedule
                </button>
                <button
                  onClick={() => updateStatus('returned')}
                  className="py-2.5 text-[10px] font-semibold text-gray-400 rounded-lg bg-surface-dark border border-gray-800/50 flex flex-col items-center gap-1 active:scale-95 transition-transform"
                >
                  <span className="material-symbols-rounded text-orange-400 text-lg">undo</span>
                  Rejected
                </button>
                <button
                  onClick={() => {
                    const reason = window.prompt('Reason for failure?');
                    if (reason !== null) updateStatus('failed', undefined, reason);
                  }}
                  className="py-2.5 text-[10px] font-semibold text-gray-400 rounded-lg bg-surface-dark border border-gray-800/50 flex flex-col items-center gap-1 active:scale-95 transition-transform"
                >
                  <span className="material-symbols-rounded text-red-400 text-lg">cancel</span>
                  FOD
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />

      {/* POD Capture Modal */}
      {showPODCapture && deliveryId && !isPickup && (
        <PODCapture
          deliveryId={deliveryId}
          customerName={delivery.name}
          deliveryType={delivery.type}
          onComplete={handlePODComplete}
          onCancel={() => { setShowPODCapture(false); setDragX(0); }}
        />
      )}

      {/* Quick Message */}
      {showQuickMessage && (
        <QuickMessage
          customerName={delivery.name}
          customerPhone={delivery.phone}
          onClose={() => setShowQuickMessage(false)}
        />
      )}

      {/* COD Confirmation Modal */}
      {showCODConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[2000] flex items-end sm:items-center justify-center p-4">
          <div className="bg-surface-dark w-full max-w-sm rounded-2xl p-6 border border-gray-800">
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-rounded text-primary text-2xl">payments</span>
              </div>
              <h3 className="text-xl font-bold text-foreground">Confirm Collection</h3>
              <p className="text-gray-500 mt-1 text-sm">Confirm the cash amount collected.</p>
            </div>

            <div className="bg-surface-darker rounded-xl p-4 mb-5 border border-gray-800/50">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Collected Amount (AED)</label>
              <input
                type="number"
                value={collectedAmount}
                onChange={(e) => setCollectedAmount(e.target.value)}
                className="w-full bg-background border border-gray-700 rounded-xl px-4 py-3 text-2xl font-bold text-center text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                placeholder="0.00"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowCODConfirm(false)} className="py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-800 transition-colors border border-gray-700">
                Cancel
              </button>
              <button
                onClick={() => { setShowCODConfirm(false); setShowPODCapture(true); }}
                disabled={!collectedAmount || parseFloat(collectedAmount) <= 0}
                className="py-3 bg-primary text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}