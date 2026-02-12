import { useState } from 'react';
import { ArrowLeft, QrCode, CheckCircle, X, Package, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { TabBar } from './TabBar';

interface PickupProps {
    onNavigate: (screen: 'dashboard' | 'route' | 'delivery' | 'profile' | 'settings' | 'pickup') => void;
    authToken: string;
}

interface PickupResult {
    success: boolean;
    waybillNumber: string;
    shipperName: string;
    customerName: string;
    pieces: number;
    weight: string;
}

export function Pickup({ onNavigate, authToken }: PickupProps) {
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<PickupResult | null>(null);

    const handleScan = async () => {
        try {
            setError(null);
            setResult(null);

            // Check permission
            const { camera } = await BarcodeScanner.checkPermissions();
            if (camera !== 'granted') {
                const permResult = await BarcodeScanner.requestPermissions();
                if (permResult.camera !== 'granted') {
                    setError('Camera permission is required to scan barcodes');
                    return;
                }
            }

            setScanning(true);
            const { barcodes } = await BarcodeScanner.scan();
            setScanning(false);

            if (barcodes.length > 0) {
                const scannedCode = barcodes[0].rawValue;

                // Call API to mark as picked up
                try {
                    const response = await api.markPickedUp(scannedCode, authToken);
                    setResult({
                        success: true,
                        waybillNumber: response.waybillNumber,
                        shipperName: response.shipperName,
                        customerName: response.customerName,
                        pieces: response.pieces,
                        weight: response.weight,
                    });
                } catch (err: any) {
                    setError(err.message || 'Failed to mark as picked up');
                }
            }
        } catch (err: any) {
            setScanning(false);
            if (!err.message?.includes('canceled')) {
                setError('Failed to scan barcode');
            }
        }
    };

    const handleScanAnother = () => {
        setResult(null);
        setError(null);
        handleScan();
    };

    return (
        <div className="min-h-screen bg-background pb-32 font-sans">
            {/* Header */}
            <div className="px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-4">
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => onNavigate('dashboard')}
                        className="p-2 hover:bg-white rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-800" />
                    </button>
                    <h1 className="text-2xl font-bold font-heading">Pickup Package</h1>
                </div>

                {/* Main Content */}
                <div className="flex flex-col items-center justify-center py-8">

                    {/* Success Result */}
                    {result && (
                        <div className="w-full bg-white rounded-3xl p-6 shadow-sm border border-green-200 mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-green-100 p-3 rounded-2xl">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg text-gray-900">Pickup Confirmed!</h2>
                                    <p className="text-green-600 font-medium">{result.waybillNumber}</p>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">From</span>
                                    <span className="font-medium">{result.shipperName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">To</span>
                                    <span className="font-medium">{result.customerName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Pieces</span>
                                    <span className="font-medium">{result.pieces}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Weight</span>
                                    <span className="font-medium">{result.weight} kg</span>
                                </div>
                            </div>

                            <button
                                onClick={handleScanAnother}
                                className="w-full mt-4 py-4 rounded-2xl font-bold bg-primary text-white hover:bg-black/90 transition-all"
                            >
                                Scan Another Package
                            </button>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="w-full bg-white rounded-3xl p-6 shadow-sm border border-red-200 mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-red-100 p-3 rounded-2xl">
                                    <AlertCircle className="w-8 h-8 text-red-600" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg text-gray-900">Error</h2>
                                    <p className="text-red-600">{error}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setError(null)}
                                className="w-full py-3 rounded-2xl font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {/* Scan Instructions (when no result/error) */}
                    {!result && !error && (
                        <div className="text-center mb-8">
                            <div className="bg-orange-50 p-6 rounded-3xl mb-6 inline-block">
                                <Package className="w-16 h-16 text-orange-500" />
                            </div>
                            <h2 className="text-xl font-bold font-heading text-gray-900 mb-2">
                                Ready to Pickup
                            </h2>
                            <p className="text-gray-500 max-w-xs mx-auto">
                                Scan the waybill barcode or QR code to mark the package as picked up
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Scan Button */}
            {!result && (
                <div className="fixed bottom-[calc(7rem+env(safe-area-inset-bottom))] left-0 right-0 px-6 z-30">
                    <button
                        onClick={handleScan}
                        disabled={scanning}
                        className="w-full py-5 rounded-[2rem] font-bold text-lg shadow-xl bg-primary text-white hover:bg-black/90 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                    >
                        <QrCode className="w-6 h-6" />
                        {scanning ? 'Scanning...' : 'Scan Package'}
                    </button>
                </div>
            )}

            <TabBar currentTab="route" onNavigate={onNavigate} />
        </div>
    );
}
