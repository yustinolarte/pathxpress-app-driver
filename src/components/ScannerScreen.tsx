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

      // Call real backend API
      const data = await api.getRoute(routeId, authToken);

      // Validate the data structure
      if (!data.id || !data.deliveries) {
        throw new Error("Invalid route data from server");
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
    <div className="scanner-ui min-h-screen bg-gradient-to-br from-[#0a1128] via-[#0a1128] to-[#1a0808] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Decorative accents */}
      <div className="absolute top-20 right-10 w-40 h-40 bg-[#e10600] opacity-10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-40 left-10 w-60 h-60 bg-[#e10600] opacity-5 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block flex flex-col items-center">
            <img src="/logo.png" alt="PathXpress Logo" className="h-16 mb-4 object-contain" />
            <div className="text-[#e10600] tracking-[0.3em] text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
              DRIVER
            </div>
          </div>
        </div>

        {/* Scanner Area */}
        <div className="bg-[#050505]/60 backdrop-blur-sm border border-[#555555]/20 rounded-3xl p-6 mb-8 overflow-hidden relative">
          <div className="text-center mb-6">
            <h2 className="text-[#f2f4f8] mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {scanned ? 'Route Scanned!' : isLoading ? 'Loading Route...' : isScanning ? 'Scanning...' : 'Scan Your Route'}
            </h2>
            <p className="text-[#555555] text-sm">
              {scanned ? 'Loading your deliveries...' : isLoading ? 'Fetching route details from server...' : isScanning ? 'Point your camera at the QR code' : 'Tap the button below to start scanning'}
            </p>
          </div>

          {/* Scanner Icon/Status */}
          <div className="flex items-center justify-center mb-6 relative">
            {scanned ? (
              <div className="w-64 h-64 bg-[#00c853]/20 rounded-3xl flex items-center justify-center animate-pulse">
                <CheckCircle className="w-24 h-24 text-[#00c853]" />
              </div>
            ) : showManualInput ? (
              <div className="w-64 h-64 bg-[#0a1128] border border-[#555555]/30 rounded-3xl flex items-center justify-center">
                <Code className="w-16 h-16 text-[#555555]" />
              </div>
            ) : (
              <div className="w-64 h-64 bg-[#0a1128] border-4 border-[#e10600]/30 rounded-3xl flex items-center justify-center relative">
                <CameraIcon className={`w-24 h-24 text-[#e10600] ${isScanning ? 'animate-pulse' : ''}`} />

                {isScanning && (
                  <>
                    {/* Viewfinder Corners */}
                    <div className="absolute top-8 left-8 w-8 h-8 border-t-4 border-l-4 border-[#e10600] rounded-tl-xl"></div>
                    <div className="absolute top-8 right-8 w-8 h-8 border-t-4 border-r-4 border-[#e10600] rounded-tr-xl"></div>
                    <div className="absolute bottom-8 left-8 w-8 h-8 border-b-4 border-l-4 border-[#e10600] rounded-bl-xl"></div>
                    <div className="absolute bottom-8 right-8 w-8 h-8 border-b-4 border-r-4 border-[#e10600] rounded-br-xl"></div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && !scanned && (
            <div className="text-[#e10600] text-xs text-center mb-4 bg-[#e10600]/10 p-2 rounded-lg">
              {error}
            </div>
          )}

          {/* Scan Button */}
          {!scanned && !showManualInput && !isScanning && (
            <button
              onClick={startScan}
              className="w-full bg-[#e10600] hover:bg-[#c10500] active:scale-[0.98] text-[#f2f4f8] py-4 rounded-2xl transition-all shadow-lg shadow-[#e10600]/20 mb-4"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              START SCANNING
            </button>
          )}

          {/* Stop Scan Button */}
          {isScanning && (
            <button
              onClick={stopScan}
              className="w-full bg-[#555555] hover:bg-[#666666] active:scale-[0.98] text-[#f2f4f8] py-4 rounded-2xl transition-all shadow-lg mb-4"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              CANCEL SCANNING
            </button>
          )}

          {/* Manual Input Toggle */}
          {!scanned && !isScanning && (
            <div className="mt-2">
              <button
                onClick={() => setShowManualInput(!showManualInput)}
                className="text-[#555555] text-sm flex items-center justify-center gap-2 w-full hover:text-[#f2f4f8] transition-colors py-2"
              >
                {showManualInput ? <CameraIcon className="w-4 h-4" /> : <Code className="w-4 h-4" />}
                {showManualInput ? 'Back to Scanner' : 'Enter Route JSON (Debug)'}
              </button>
            </div>
          )}

          {/* Manual Input Form */}
          {showManualInput && !scanned && (
            <div className="mt-4 space-y-4">
              <textarea
                value={manualJson}
                onChange={(e) => setManualJson(e.target.value)}
                placeholder='{"routeId": "...", "deliveries": []}'
                className="w-full h-32 bg-[#0a1128] border border-[#555555]/30 rounded-xl p-4 text-[#f2f4f8] text-xs font-mono focus:outline-none focus:border-[#e10600]"
              />
              <button
                onClick={handleManualSubmit}
                className="w-full bg-[#555555]/20 hover:bg-[#555555]/40 text-[#f2f4f8] py-3 rounded-xl transition-all"
              >
                Load Route Data
              </button>
            </div>
          )}

          {scanned && (
            <div className="text-center text-[#00c853]" style={{ fontFamily: 'Poppins, sans-serif' }}>
              ✓ Route Loaded
            </div>
          )}
        </div>

        {/* Info */}
        <div className="text-center text-[#555555] text-sm">
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
