import { useState, useEffect } from 'react';
import { Camera, MapPin, Check, X, Pen, AlertCircle, DoorOpen, User } from 'lucide-react';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { SignaturePad } from './SignaturePad';

type DeliveryMode = 'handed' | 'left_at_door' | null;

interface PODData {
    photo: string | null;
    photoWithStamp: string | null;
    signature: string | null;
    location: {
        lat: number;
        lng: number;
        address?: string;
    };
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

    // Get current location on mount
    useEffect(() => {
        const getLocation = async () => {
            try {
                const position = await Geolocation.getCurrentPosition({
                    enableHighAccuracy: true,
                    timeout: 10000,
                });
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
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
                quality: 80,
                allowEditing: false,
                resultType: CameraResultType.DataUrl,
                source: CameraSource.Camera,
                correctOrientation: true,
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

                if (!ctx) {
                    resolve(photoDataUrl);
                    return;
                }

                ctx.drawImage(img, 0, 0);

                const overlayHeight = 100;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(0, img.height - overlayHeight, img.width, overlayHeight);

                const now = new Date();
                const timestamp = now.toLocaleString('en-AE', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                });

                ctx.fillStyle = 'white';
                ctx.font = 'bold 24px Arial';
                ctx.fillText(`📅 ${timestamp}`, 20, img.height - 65);

                if (location) {
                    ctx.font = '20px Arial';
                    ctx.fillText(
                        `📍 ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`,
                        20,
                        img.height - 35
                    );
                }

                // Add delivery mode
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

        // Validate based on mode
        if (deliveryMode === 'left_at_door' && !photo) return;
        if (deliveryMode === 'handed' && !signature) return;

        const podData: PODData = {
            photo: photo,
            photoWithStamp: photo,
            signature: signature,
            location: {
                lat: location.lat,
                lng: location.lng,
            },
            timestamp: new Date().toISOString(),
            deliveryId: deliveryId,
            customerName: customerName,
            deliveryMode: deliveryMode,
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

    // Check if complete based on delivery mode
    const isComplete = () => {
        if (!deliveryMode || !location) return false;
        if (deliveryMode === 'left_at_door') return !!photo;
        if (deliveryMode === 'handed') return !!signature;
        return false;
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-end">
                <div className="w-full bg-white rounded-t-[2rem] p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={onCancel}
                            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
                        >
                            <X className="w-5 h-5 text-gray-600" />
                        </button>
                        <h3 className="text-lg font-bold text-gray-900">Confirm Delivery</h3>
                        <div className="w-10" />
                    </div>

                    {/* Step 1: Select Delivery Mode */}
                    {!deliveryMode && (
                        <div className="space-y-4">
                            <p className="text-center text-gray-500 mb-4">How was the package delivered?</p>

                            <button
                                onClick={() => setDeliveryMode('handed')}
                                className="w-full p-5 rounded-2xl border-2 border-gray-200 bg-gray-50 flex items-center gap-4 hover:border-black hover:bg-white transition-all"
                            >
                                <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center">
                                    <User className="w-7 h-7 text-blue-600" />
                                </div>
                                <div className="flex-1 text-left">
                                    <h4 className="font-bold text-gray-900 text-lg">Handed to Customer</h4>
                                    <p className="text-sm text-gray-500">Customer signature required</p>
                                </div>
                            </button>

                            {deliveryType !== 'COD' && (
                                <button
                                    onClick={() => setDeliveryMode('left_at_door')}
                                    className="w-full p-5 rounded-2xl border-2 border-gray-200 bg-gray-50 flex items-center gap-4 hover:border-black hover:bg-white transition-all"
                                >
                                    <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center">
                                        <DoorOpen className="w-7 h-7 text-orange-600" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <h4 className="font-bold text-gray-900 text-lg">Left at Door</h4>
                                        <p className="text-sm text-gray-500">Photo proof required</p>
                                    </div>
                                </button>
                            )}

                            {deliveryType === 'COD' && (
                                <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-200 flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                                    <p className="text-sm text-yellow-700 font-medium">
                                        COD orders cannot be left at door. Please collect payment.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Capture POD based on mode */}
                    {deliveryMode && (
                        <div className="space-y-4">
                            {/* Mode indicator */}
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <button
                                    onClick={() => {
                                        setDeliveryMode(null);
                                        setPhoto(null);
                                        setSignature(null);
                                    }}
                                    className="text-sm text-gray-500 underline"
                                >
                                    Change
                                </button>
                                <span className={`px-4 py-2 rounded-full text-sm font-bold ${deliveryMode === 'handed'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-orange-100 text-orange-700'
                                    }`}>
                                    {deliveryMode === 'handed' ? '🤝 Handed to Customer' : '🚪 Left at Door'}
                                </span>
                            </div>

                            {/* Photo - Required for left_at_door, Optional for handed */}
                            <div
                                onClick={handleTakePhoto}
                                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${photo
                                    ? 'border-green-500 bg-green-50'
                                    : deliveryMode === 'left_at_door'
                                        ? 'border-dashed border-orange-300 bg-orange-50'
                                        : 'border-dashed border-gray-200 bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${photo ? 'bg-green-500' : deliveryMode === 'left_at_door' ? 'bg-orange-400' : 'bg-gray-200'
                                        }`}>
                                        {photo ? (
                                            <Check className="w-6 h-6 text-white" />
                                        ) : (
                                            <Camera className={`w-6 h-6 ${isCapturingPhoto ? 'animate-pulse' : ''} text-white`} />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-900">
                                            {photo ? 'Photo Captured' : 'Take Photo'}
                                        </h4>
                                        <p className="text-sm text-gray-500">
                                            {deliveryMode === 'left_at_door'
                                                ? (photo ? 'Tap to retake' : 'Required - Photo of package at door')
                                                : (photo ? 'Tap to retake' : 'Optional')
                                            }
                                        </p>
                                    </div>
                                    {photo && (
                                        <img src={photo} alt="POD" className="w-16 h-16 rounded-lg object-cover" />
                                    )}
                                </div>
                            </div>

                            {/* Signature - Required for handed, Optional for left_at_door */}
                            <div
                                onClick={() => setShowSignaturePad(true)}
                                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${signature
                                    ? 'border-green-500 bg-green-50'
                                    : deliveryMode === 'handed'
                                        ? 'border-dashed border-blue-300 bg-blue-50'
                                        : 'border-dashed border-gray-200 bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${signature ? 'bg-green-500' : deliveryMode === 'handed' ? 'bg-blue-500' : 'bg-gray-200'
                                        }`}>
                                        {signature ? (
                                            <Check className="w-6 h-6 text-white" />
                                        ) : (
                                            <Pen className="w-6 h-6 text-white" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-900">
                                            {signature ? 'Signature Captured' : 'Get Signature'}
                                        </h4>
                                        <p className="text-sm text-gray-500">
                                            {deliveryMode === 'handed'
                                                ? (signature ? 'Tap to redo' : `Required - ${customerName} needs to sign`)
                                                : (signature ? 'Tap to redo' : 'Optional')
                                            }
                                        </p>
                                    </div>
                                    {signature && (
                                        <img src={signature} alt="Signature" className="w-16 h-12 rounded-lg object-contain bg-white border" />
                                    )}
                                </div>
                            </div>

                            {/* Location - Always automatic */}
                            <div className={`p-4 rounded-2xl border-2 ${location ? 'border-green-500 bg-green-50' : 'border-dashed border-gray-300 bg-gray-50'
                                }`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${location ? 'bg-green-500' : 'bg-gray-200'
                                        }`}>
                                        {location ? (
                                            <Check className="w-6 h-6 text-white" />
                                        ) : (
                                            <MapPin className="w-6 h-6 text-gray-500 animate-pulse" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-900">
                                            {location ? 'Location Captured' : 'Getting Location...'}
                                        </h4>
                                        <p className="text-sm text-gray-500">
                                            {location
                                                ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                                                : 'Automatic GPS stamp'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Confirm Button */}
                            <button
                                onClick={handleConfirmDelivery}
                                disabled={!isComplete()}
                                className={`w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all mt-6 ${isComplete()
                                    ? 'bg-green-500 text-white shadow-lg shadow-green-200'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                <Check className="w-6 h-6" />
                                Confirm Delivery
                            </button>

                            {!isComplete() && (
                                <p className="text-center text-sm text-gray-400">
                                    {deliveryMode === 'left_at_door'
                                        ? 'Take a photo of the package at the door'
                                        : 'Get customer signature to continue'
                                    }
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
