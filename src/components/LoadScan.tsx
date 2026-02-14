import { useState, useEffect } from 'react';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { CheckCircle, XCircle, Search, Box } from 'lucide-react';

interface LoadScanProps {
    routeData: any;
    onComplete: () => void;
    onCancel: () => void;
}

export function LoadScan({ routeData, onComplete, onCancel }: LoadScanProps) {
    const [scannedRefs, setScannedRefs] = useState<Set<string>>(new Set());
    const [isScanning, setIsScanning] = useState(false);
    const [lastScanned, setLastScanned] = useState<string | null>(null);
    const [scanStatus, setScanStatus] = useState<'success' | 'error' | null>(null);
    const [errorMessage, setErrorMessage] = useState('');

    // Filter for actual packages (deliveries)
    const packages = (routeData?.stops || routeData?.deliveries || []).filter((s: any) =>
        (s.stopType === 'delivery' || s.type === 'delivery' || !s.stopType) && s.status !== 'cancelled'
    );

    const totalPackages = packages.length;
    const scannedCount = scannedRefs.size;
    const progress = totalPackages > 0 ? (scannedCount / totalPackages) * 100 : 0;

    const handleScan = async () => {
        try {
            const { camera } = await BarcodeScanner.requestPermissions();
            if (camera !== 'granted') {
                alert('Camera permission required');
                return;
            }

            setIsScanning(true);
            const { barcodes } = await BarcodeScanner.scan();
            setIsScanning(false);

            if (barcodes.length > 0) {
                processBarcode(barcodes[0].rawValue);
            }
        } catch (error) {
            console.error('Scan error:', error);
            setIsScanning(false);
        }
    };

    const processBarcode = (code: string) => {
        // Find package with this reference or waybill
        const pkg = packages.find((p: any) =>
            p.reference === code || p.waybillNumber === code || p.id.toString() === code
        );

        if (pkg) {
            if (scannedRefs.has(pkg.reference)) {
                setScanStatus('error');
                setErrorMessage('Already scanned!');
            } else {
                setScannedRefs(prev => new Set(prev).add(pkg.reference));
                setScanStatus('success');
                setLastScanned(pkg.reference);
            }
        } else {
            setScanStatus('error');
            setErrorMessage('Package not in route!');
        }

        // Reset status after 2 seconds
        setTimeout(() => {
            setScanStatus(null);
            setErrorMessage('');
        }, 2000);
    };

    // Group packages by status for list
    const pendingPackages = packages.filter((p: any) => !scannedRefs.has(p.reference));
    const scannedPackages = packages.filter((p: any) => scannedRefs.has(p.reference));

    return (
        <div className="min-h-screen bg-background flex flex-col relative font-sans">
            {/* Header */}
            <div className="px-5 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-4 bg-surface-dark border-b border-gray-800 z-10 sticky top-0">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-bold text-white">Load Manifest</h1>
                    <button
                        onClick={onCancel}
                        className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400"
                    >
                        <span className="material-symbols-rounded">close</span>
                    </button>
                </div>

                {/* Progress */}
                <div className="mb-2 flex justify-between items-end">
                    <div>
                        <p className="text-sm text-gray-400">Loading Vehicle</p>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-2xl font-bold ${scannedCount === totalPackages ? 'text-green-500' : 'text-white'}`}>
                                {scannedCount}
                            </span>
                            <span className="text-sm text-gray-500">/ {totalPackages}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500">{Math.round(progress)}%</p>
                    </div>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-300 ${scannedCount === totalPackages ? 'bg-green-500' : 'bg-primary'}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 pb-32">
                {/* Scan Status Feedback */}
                {scanStatus && (
                    <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${scanStatus === 'success'
                            ? 'bg-green-500/10 border-green-500/30 text-green-400'
                            : 'bg-red-500/10 border-red-500/30 text-red-400'
                        }`}>
                        {scanStatus === 'success' ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                        <div>
                            <p className="font-bold">{scanStatus === 'success' ? 'Scanned Successfully' : 'Scan Error'}</p>
                            {errorMessage && <p className="text-xs opacity-80">{errorMessage}</p>}
                            {lastScanned && scanStatus === 'success' && <p className="text-xs opacity-80">{lastScanned}</p>}
                        </div>
                    </div>
                )}

                {/* Missing Packages List */}
                {pendingPackages.length > 0 && (
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Pending ({pendingPackages.length})</h3>
                        <div className="space-y-2">
                            {pendingPackages.map((p: any) => (
                                <div key={p.id} className="bg-card p-3 rounded-xl border border-gray-800/50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-500">
                                            <Box className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{p.name}</p>
                                            <p className="text-xs text-gray-500">{p.reference}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => processBarcode(p.reference)} // Manual override
                                        className="text-xs text-primary font-medium px-2 py-1 rounded hover:bg-primary/10"
                                    >
                                        Manual
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Scanned Packages List */}
                {scannedPackages.length > 0 && (
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-4">Loaded ({scannedPackages.length})</h3>
                        <div className="space-y-2">
                            {scannedPackages.map((p: any) => (
                                <div key={p.id} className="bg-card p-3 rounded-xl border border-green-900/20 bg-green-500/5 flex items-center justify-between opacity-70">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-green-900/30 flex items-center justify-center text-green-500">
                                            <CheckCircle className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-300">{p.name}</p>
                                            <p className="text-xs text-gray-600">{p.reference}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-5 bg-background border-t border-gray-800 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
                <div className="flex gap-3">
                    <button
                        onClick={handleScan}
                        className="flex-1 bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                        <span className="material-symbols-rounded">qr_code_scanner</span>
                        {isScanning ? 'Scanning...' : 'Scan Package'}
                    </button>
                    <button
                        onClick={onComplete}
                        className="flex-1 bg-surface-darker border border-gray-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                        <span className="material-symbols-rounded">check</span>
                        Finish
                    </button>
                </div>
            </div>
        </div>
    );
}
