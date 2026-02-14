import { CheckCircle, Code, Camera as CameraIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { api } from '../services/api';

interface ScannerScreenProps {
  onScanComplete: (data: any) => void;
  authToken: string;
}

export function ScannerScreen({ onScanComplete, authToken }: ScannerScreenProps) {
  const [scanned, setScanned] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualJson, setManualJson] = useState('');
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if scanner is supported
    BarcodeScanner.isSupported().then((result) => {
      if (!result.supported) {
        setError('Scanner not supported on this device');
      }
    });
  }, []);

  const fetchRouteData = async (routeId: string) => {
    try {
      setIsLoading(true);
      setError('');

      // Call real backend API - CLAIM the route to assign it to this driver
      const data = await api.claimRoute(routeId, authToken);

      // Validate the data structure - Relaxed check + Auto-fetch if missing details
      if (!data.id) {
        console.error('Invalid route data:', data);
        throw new Error("Invalid route data from server (No ID)");
      }

      // If deliveries are missing (e.g. backend didn't include them in the claim response), fetch them now
      if (!data.deliveries) {
        console.log('Claim successful but missing deliveries. Fetching full route details...');
        try {
          const fullRoute = await api.getRoute(routeId, authToken);
          if (fullRoute && fullRoute.id) {
            // Use the full route data instead
            data.deliveries = fullRoute.deliveries || [];
            Object.assign(data, fullRoute);
          }
        } catch (fetchErr) {
          console.warn('Failed to fetch full route details after claim:', fetchErr);
          // Continue with what we have, or throw? 
          // If we don't have deliveries, the UI might crash later. 
          // Let's assume empty array if still missing.
          data.deliveries = [];
        }
      }

      // Check if route is already completed
      if (data.status === 'COMPLETED') {
        throw new Error("This route has already been finished");
      }

      setScanned(true);
      setIsLoading(false);

      setTimeout(() => {
        onScanComplete(data);
      }, 1500);

    } catch (e) {
      setIsLoading(false);
      setError('Failed to load route: ' + (e as Error).message);
    }
  };


  const startScan = async () => {
    try {
      // Check permission
      const { camera } = await BarcodeScanner.checkPermissions();

      if (camera !== 'granted') {
        const { camera: newStatus } = await BarcodeScanner.requestPermissions();
        if (newStatus !== 'granted') {
          setError('Camera permission denied');
          return;
        }
      }

      setIsScanning(true);
      setError('');

      // Start scanning
      const { barcodes } = await BarcodeScanner.scan();

      setIsScanning(false);

      if (barcodes.length > 0) {
        const content = barcodes[0].rawValue;

        try {
          // The QR code should only contain the route ID (e.g., "DXB-2025-001")
          let routeId = content.trim();

          // Try to parse as JSON first (in case it's {"routeId": "..."})
          try {
            const parsed = JSON.parse(routeId);
            if (parsed.routeId) {
              routeId = parsed.routeId;
            }
          } catch {
            // Not JSON, use as-is
          }

          if (!routeId) {
            throw new Error("Invalid route code");
          }

          // Fetch route data from server
          await fetchRouteData(routeId);

        } catch (e) {
          setError('Invalid QR Code: ' + (e as Error).message);
        }
      }
    } catch (e) {
      console.error('Scan error:', e);
      setError('Failed to scan: ' + (e as Error).message);
      setIsScanning(false);
    }
  };

  const stopScan = async () => {
    // ML Kit scan() is a promise that resolves when scan is done or cancelled.
    // To cancel programmatically is harder, usually the UI handles it.
    // But we can try to install the listener if needed, but scan() is simpler.
    // For now, we just reset state.
    setIsScanning(false);
  };

  const handleManualSubmit = () => {
    try {
      let routeId = manualJson.trim();

      // Try to parse as JSON first
      try {
        const data = JSON.parse(routeId);
        if (data.routeId) {
          routeId = data.routeId;
        }
      } catch {
        // Not JSON, assume it's just the ID string
      }

      if (!routeId) {
        throw new Error("Please enter a Route ID");
      }

      fetchRouteData(routeId);
      setShowManualInput(false);
    } catch (e) {
      setError('Invalid input');
    }
  };

  return (
    <div className="scanner-ui min-h-screen bg-background flex flex-col items-center justify-center px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-[calc(2rem+env(safe-area-inset-bottom))] relative overflow-hidden">
      {/* Decorative accents */}
      <div className="absolute top-20 right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-40 left-10 w-60 h-60 bg-primary/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block flex flex-col items-center">
            {/* Logo placeholder if needed, or just text */}
            <div className="w-16 h-16 bg-surface-dark border border-gray-800 rounded-2xl flex items-center justify-center mb-4">
              <span className="material-symbols-rounded text-3xl text-primary">local_shipping</span>
            </div>
            <div className="text-primary tracking-[0.3em] text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
              DRIVER
            </div>
          </div>
        </div>

        {/* Scanner Area */}
        <div className="bg-card border border-gray-800 shadow-sm rounded-3xl p-6 mb-8 overflow-hidden relative">
          <div className="text-center mb-6">
            <h2 className="text-foreground text-lg font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {scanned ? 'Route Scanned!' : isLoading ? 'Loading Route...' : isScanning ? 'Scanning...' : 'Scan Your Route'}
            </h2>
            <p className="text-gray-400 text-sm">
              {scanned ? 'Loading your deliveries...' : isLoading ? 'Fetching route details from server...' : isScanning ? 'Point your camera at the QR code' : 'Tap the button below to start scanning'}
            </p>
          </div>

          {/* Scanner Icon/Status */}
          <div className="flex items-center justify-center mb-6 relative">
            {scanned ? (
              <div className="w-64 h-64 bg-green-500/10 rounded-3xl flex items-center justify-center animate-pulse border border-green-500/30">
                <CheckCircle className="w-24 h-24 text-green-500" />
              </div>
            ) : showManualInput ? (
              <div className="w-64 h-64 bg-surface-dark border border-gray-700 rounded-3xl flex items-center justify-center">
                <Code className="w-16 h-16 text-gray-500" />
              </div>
            ) : (
              <div className="w-64 h-64 bg-surface-dark border-4 border-dotted border-gray-700 rounded-3xl flex items-center justify-center relative">
                <CameraIcon className={`w-24 h-24 text-primary ${isScanning ? 'animate-pulse' : 'opacity-80'}`} />

                {isScanning && (
                  <>
                    {/* Viewfinder Corners */}
                    <div className="absolute top-8 left-8 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl"></div>
                    <div className="absolute top-8 right-8 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl"></div>
                    <div className="absolute bottom-8 left-8 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl"></div>
                    <div className="absolute bottom-8 right-8 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl"></div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && !scanned && (
            <div className="text-red-400 text-xs text-center mb-4 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
              {error}
            </div>
          )}

          {/* Scan Button */}
          {!scanned && !showManualInput && !isScanning && (
            <button
              onClick={startScan}
              className="w-full bg-primary hover:bg-red-700 active:scale-[0.98] text-white py-4 rounded-2xl transition-all shadow-lg shadow-red-900/20 mb-4 font-bold"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              START SCANNING
            </button>
          )}

          {/* Stop Scan Button */}
          {isScanning && (
            <button
              onClick={stopScan}
              className="w-full bg-gray-700 hover:bg-gray-600 active:scale-[0.98] text-white py-4 rounded-2xl transition-all shadow-lg mb-4"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              CANCEL SCANNING
            </button>
          )}

          {/* Manual Input Toggle */}
          {!scanned && !isScanning && (
            <div className="mt-4 border-t border-gray-800 pt-4">
              <button
                onClick={() => setShowManualInput(!showManualInput)}
                className="text-gray-400 text-sm flex items-center justify-center gap-2 w-full hover:text-white transition-colors py-2 font-medium"
              >
                {showManualInput ? (
                  <>
                    <CameraIcon className="w-4 h-4" />
                    Back to Scanner
                  </>
                ) : (
                  <>
                    <Code className="w-4 h-4" />
                    Enter Route Code Manually
                  </>
                )}
              </button>
            </div>
          )}

          {/* Manual Input Form */}
          {showManualInput && !scanned && (
            <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-surface-dark p-4 rounded-2xl border border-gray-700">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Route ID
                </label>
                <input
                  type="text"
                  value={manualJson}
                  onChange={(e) => setManualJson(e.target.value)}
                  placeholder="e.g. DXB-2025-001"
                  className="w-full bg-background border border-gray-700 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-lg"
                />
                <p className="text-gray-500 text-xs mt-2">
                  Enter the Route ID provided by your dispatcher.
                </p>
              </div>

              <button
                onClick={handleManualSubmit}
                className="w-full bg-white hover:bg-gray-200 text-black py-4 rounded-xl transition-all font-bold shadow-lg"
              >
                Load Route
              </button>
            </div>
          )}

          {scanned && (
            <div className="text-center text-green-500 font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
              ✓ Route Loaded
            </div>
          )}
        </div>

        {/* Info */}
        <div className="text-center text-gray-500 text-sm">
          {isScanning ? 'Align the QR code within the frame' : 'Make sure the QR code is clearly visible and well-lit'}
        </div>
      </div>

      <style>{`
        .scanner-active {
          --background: transparent;
          --ion-background-color: transparent;
          background: transparent !important;
        }

        body.scanner-active {
          opacity: 0;
        }

        ion-content.scanner-active {
          --background: transparent;
        }
      `}</style>
    </div>
  );
}
