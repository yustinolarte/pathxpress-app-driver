import { useState, useEffect } from 'react';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { SignaturePad } from './SignaturePad';

type DeliveryMode = 'handed' | 'left_at_door' | null;

interface PODData {
    photo: string | null;
    photoWithStamp: string | null;
    signature: string | null;
    location: { lat: number; lng: number; address?: string };
    timestamp: string;
    deliveryId: number;
    customerName: string;
    deliveryMode: DeliveryMode;
}

interface PODCaptureProps {
    deliveryId: number;
    customerName: string;
    deliveryType?: string;
    onComplete: (podData: PODData) => void;
    onCancel: () => void;
}

export function PODCapture({ deliveryId, customerName, deliveryType, onComplete, onCancel }: PODCaptureProps) {
    const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>(null);
    const [photo, setPhoto] = useState<string | null>(null);
    const [signature, setSignature] = useState<string | null>(null);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [showSignaturePad, setShowSignaturePad] = useState(false);
    const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);

    useEffect(() => {
        const getLocation = async () => {
            try {
                const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
                setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
            } catch (error) {
                console.error('Location error:', error);
                setLocationError('Unable to get location');
                setLocation({ lat: 25.2048, lng: 55.2708 });
            }
        };
        getLocation();
    }, []);

    const handleTakePhoto = async () => {
        setIsCapturingPhoto(true);
        try {
            const image = await CapacitorCamera.getPhoto({
                quality: 80, allowEditing: false, resultType: CameraResultType.DataUrl,
                source: CameraSource.Camera, correctOrientation: true,
            });
            if (image.dataUrl) {
                const stampedPhoto = await addStampToPhoto(image.dataUrl);
                setPhoto(stampedPhoto);
            }
        } catch (error) {
            console.error('Camera error:', error);
        } finally {
            setIsCapturingPhoto(false);
        }
    };

    const addStampToPhoto = async (photoDataUrl: string): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) { resolve(photoDataUrl); return; }

                ctx.drawImage(img, 0, 0);
                const overlayHeight = 100;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(0, img.height - overlayHeight, img.width, overlayHeight);

                const now = new Date();
                const timestamp = now.toLocaleString('en-AE', { dateStyle: 'medium', timeStyle: 'short' });

                ctx.fillStyle = 'white';
                ctx.font = 'bold 24px Arial';
                ctx.fillText(`📅 ${timestamp}`, 20, img.height - 65);

                if (location) {
                    ctx.font = '20px Arial';
                    ctx.fillText(`📍 ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`, 20, img.height - 35);
                }

                const modeText = deliveryMode === 'left_at_door' ? '🚪 Left at Door' : '🤝 Handed to Customer';
                ctx.font = 'bold 20px Arial';
                ctx.fillText(modeText, 20, img.height - 10);

                ctx.font = 'bold 18px Arial';
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.textAlign = 'right';
                ctx.fillText('PATHXPRESS POD', img.width - 20, img.height - 65);

                resolve(canvas.toDataURL('image/jpeg', 0.85));
            };
            img.src = photoDataUrl;
        });
    };

    const handleSignatureSave = (signatureData: string) => {
        setSignature(signatureData);
        setShowSignaturePad(false);
    };

    const handleConfirmDelivery = () => {
        if (!deliveryMode || !location) return;
        if (deliveryMode === 'left_at_door' && !photo) return;
        if (deliveryMode === 'handed' && !signature) return;

        const podData: PODData = {
            photo, photoWithStamp: photo, signature,
            location: { lat: location.lat, lng: location.lng },
            timestamp: new Date().toISOString(),
            deliveryId, customerName, deliveryMode,
        };
        savePODToHistory(podData);
        onComplete(podData);
    };

    const savePODToHistory = (podData: PODData) => {
        try {
            const existingHistory = localStorage.getItem('podHistory');
            const history: PODData[] = existingHistory ? JSON.parse(existingHistory) : [];
            history.unshift(podData);
            if (history.length > 50) history.pop();
            localStorage.setItem('podHistory', JSON.stringify(history));
        } catch (error) {
            console.error('Error saving POD to history:', error);
        }
    };

    const isComplete = () => {
        if (!deliveryMode || !location) return false;
        if (deliveryMode === 'left_at_door') return !!photo;
        if (deliveryMode === 'handed') return !!signature;
        return false;
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-end">
                <div className="w-full bg-background rounded-t-3xl p-5 pb-[calc(2rem+env(safe-area-inset-bottom))] max-h-[90vh] overflow-y-auto border-t border-gray-800/50">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                        <button onClick={onCancel} className="w-10 h-10 rounded-full bg-surface-dark flex items-center justify-center border border-gray-800/50">
                            <span className="material-symbols-rounded text-gray-400 text-xl">close</span>
                        </button>
                        <h3 className="text-lg font-bold text-foreground">Proof of Delivery</h3>
                        <div className="w-10" />
                    </div>

                    {/* Order Summary */}
                    <div className="bg-card rounded-xl p-3 mb-5 border border-gray-800/50 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="material-symbols-rounded text-primary">inventory_2</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500">Order #{deliveryId}</p>
                            <p className="text-sm font-bold text-foreground">{customerName}</p>
                        </div>
                        {deliveryType === 'COD' && (
                            <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold">COD</span>
                        )}
                    </div>

                    {/* Step 1: Mode Selection */}
                    {!deliveryMode && (
                        <div className="space-y-3">
                            <p className="text-center text-gray-500 text-sm mb-3">How was the package delivered?</p>

                            <button
                                onClick={() => setDeliveryMode('handed')}
                                className="w-full p-4 rounded-xl border border-gray-800/50 bg-card flex items-center gap-4 hover:border-primary/30 transition-all active:scale-[0.98]"
                            >
                                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                    <span className="material-symbols-rounded text-blue-400 text-2xl">handshake</span>
                                </div>
                                <div className="flex-1 text-left">
                                    <h4 className="font-bold text-foreground">Handed to Customer</h4>
                                    <p className="text-xs text-gray-500">Customer signature required</p>
                                </div>
                                <span className="material-symbols-rounded text-gray-600">chevron_right</span>
                            </button>

                            {deliveryType !== 'COD' && (
                                <button
                                    onClick={() => setDeliveryMode('left_at_door')}
                                    className="w-full p-4 rounded-xl border border-gray-800/50 bg-card flex items-center gap-4 hover:border-primary/30 transition-all active:scale-[0.98]"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                                        <span className="material-symbols-rounded text-orange-400 text-2xl">door_front</span>
                                    </div>
                                    <div className="flex-1 text-left">
                                        <h4 className="font-bold text-foreground">Left at Door</h4>
                                        <p className="text-xs text-gray-500">Photo proof required</p>
                                    </div>
                                    <span className="material-symbols-rounded text-gray-600">chevron_right</span>
                                </button>
                            )}

                            {deliveryType === 'COD' && (
                                <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20 flex items-center gap-3">
                                    <span className="material-symbols-rounded text-yellow-500">info</span>
                                    <p className="text-xs text-yellow-300 font-medium">COD orders cannot be left at door.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Capture POD */}
                    {deliveryMode && (
                        <div className="space-y-3">
                            {/* Mode indicator */}
                            <div className="flex items-center justify-center gap-2 mb-3">
                                <button
                                    onClick={() => { setDeliveryMode(null); setPhoto(null); setSignature(null); }}
                                    className="text-xs text-gray-500 underline"
                                >
                                    Change
                                </button>
                                <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${deliveryMode === 'handed' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
                                    }`}>
                                    {deliveryMode === 'handed' ? 'Handed to Customer' : 'Left at Door'}
                                </span>
                            </div>

                            {/* Signature Capture */}
                            <div
                                onClick={() => setShowSignaturePad(true)}
                                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${signature ? 'border-green-500/50 bg-green-500/5' :
                                    deliveryMode === 'handed' ? 'border-dashed border-blue-500/30 bg-blue-500/5' :
                                        'border-dashed border-gray-700 bg-surface-dark'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${signature ? 'bg-green-500' : deliveryMode === 'handed' ? 'bg-blue-500' : 'bg-gray-700'
                                        }`}>
                                        <span className="material-symbols-rounded text-white text-xl">
                                            {signature ? 'check' : 'draw'}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-white text-sm">{signature ? 'Signature Captured' : 'Customer Signature'}</h4>
                                        <p className="text-xs text-gray-500">
                                            {deliveryMode === 'handed'
                                                ? (signature ? 'Tap to redo' : `Required — ${customerName} needs to sign`)
                                                : (signature ? 'Tap to redo' : 'Optional')}
                                        </p>
                                    </div>
                                    {signature && (
                                        <img src={signature} alt="Signature" className="w-16 h-10 rounded-lg object-contain bg-white border border-gray-700" />
                                    )}
                                </div>
                            </div>

                            {/* Photo Capture */}
                            <div
                                onClick={handleTakePhoto}
                                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${photo ? 'border-green-500/50 bg-green-500/5' :
                                    deliveryMode === 'left_at_door' ? 'border-dashed border-orange-500/30 bg-orange-500/5' :
                                        'border-dashed border-gray-700 bg-surface-dark'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${photo ? 'bg-green-500' : deliveryMode === 'left_at_door' ? 'bg-orange-500' : 'bg-gray-700'
                                        }`}>
                                        <span className={`material-symbols-rounded text-white text-xl ${isCapturingPhoto ? 'animate-pulse' : ''}`}>
                                            {photo ? 'check' : 'photo_camera'}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-white text-sm">{photo ? 'Photo Captured' : 'Photo Evidence'}</h4>
                                        <p className="text-xs text-gray-500">
                                            {deliveryMode === 'left_at_door'
                                                ? (photo ? 'Tap to retake' : 'Required — Photo of package at door')
                                                : (photo ? 'Tap to retake' : 'Optional')}
                                        </p>
                                    </div>
                                    {photo && (
                                        <img src={photo} alt="POD" className="w-14 h-14 rounded-lg object-cover border border-gray-700" />
                                    )}
                                </div>
                            </div>

                            {/* GPS Location */}
                            <div className={`p-4 rounded-xl border-2 ${location ? 'border-green-500/50 bg-green-500/5' : 'border-dashed border-gray-700 bg-surface-dark'
                                }`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${location ? 'bg-green-500' : 'bg-gray-700'}`}>
                                        <span className={`material-symbols-rounded text-white text-xl ${!location ? 'animate-pulse' : ''}`}>
                                            {location ? 'check' : 'my_location'}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-white text-sm">{location ? 'GPS Stamped' : 'Getting Location...'}</h4>
                                        <p className="text-xs text-gray-500">
                                            {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Automatic GPS stamp'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Submit POD Button */}
                            <button
                                onClick={handleConfirmDelivery}
                                disabled={!isComplete()}
                                className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all mt-4 ${isComplete() ? 'bg-primary text-white active:scale-[0.98]' : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                <span className="material-symbols-rounded text-xl">verified</span>
                                SUBMIT POD
                            </button>

                            {!isComplete() && (
                                <p className="text-center text-xs text-gray-600">
                                    {deliveryMode === 'left_at_door' ? 'Take a photo of the package at the door' : 'Get customer signature to continue'}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Signature Pad Modal */}
            {showSignaturePad && (
                <SignaturePad
                    customerName={customerName}
                    onSave={handleSignatureSave}
                    onCancel={() => setShowSignaturePad(false)}
                />
            )}
        </>
    );
}
