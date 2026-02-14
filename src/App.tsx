import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { ScannerScreen } from './components/ScannerScreen';
import { VehicleInspection } from './components/VehicleInspection';
import { Dashboard } from './components/Dashboard';
import { RouteList } from './components/RouteList';
import { DeliveryDetail } from './components/DeliveryDetail';
import { DriverWallet } from './components/DriverWallet';
import { LoadScan } from './components/LoadScan';

import { Profile } from './components/Profile';
import { Settings } from './components/Settings';
import { api } from './services/api';

// Mock data for development/testing to bypass login and scanning
const MOCK_DRIVER = {
  id: 1,
  name: "Test Driver",
  username: "driver1",
  vehicleId: "DXB-001"
};

const MOCK_ROUTE = {
  id: 999,
  zone: 'Dubai Hills Estate',
  vehicleInfo: 'DXB-999 (Ford Transit)',
  deliveries: [
    {
      id: 101,
      customerName: 'Sultan Al Qasimi',
      address: 'Maple 2, Villa 154, Dubai Hills',
      status: 'pending',
      codAmount: 1250.00,
      type: 'COD',
      phone: '+971 50 111 2233',
      weight: '5.2 kg',
      dimensions: '40x30x20 cm',
      reference: 'EXP-999-001',
      coordinates: { lat: 25.1124, lng: 55.1390 }
    },
    {
      id: 102,
      customerName: 'Emma Watson',
      address: 'Sidra 1, Villa 45, Dubai Hills',
      status: 'pending',
      codAmount: 0,
      type: 'PREPAID',
      phone: '+971 55 444 5566',
      weight: '1.0 kg',
      dimensions: '20x15x5 cm',
      reference: 'AMZ-555-123',
      coordinates: { lat: 25.0805, lng: 55.1410 }
    },
    {
      id: 103,
      customerName: 'Raj Patel',
      address: 'Park Heights, Tower A, Apt 902',
      status: 'pending',
      codAmount: 45.50,
      type: 'COD',
      phone: '+971 52 777 8899',
      weight: '0.5 kg',
      dimensions: '10x10x10 cm',
      reference: 'EXP-999-003',
      coordinates: { lat: 25.1872, lng: 55.2631 }
    },
    {
      id: 104,
      customerName: 'Maria Rodriguez',
      address: 'Mulberry Apartments, Block B, 304',
      status: 'completed',
      codAmount: 0,
      type: 'PREPAID',
      phone: '+971 56 000 1122',
      weight: '2.3 kg',
      dimensions: '35x25x15 cm',
      reference: 'SHP-111-222',
      coordinates: { lat: 25.1148, lng: 55.1961 }
    },
    {
      id: 105,
      customerName: 'John Doe',
      address: 'Collective 2.0, Unit 1205',
      status: 'attempted',
      codAmount: 320.00,
      type: 'COD',
      phone: '+971 50 999 8877',
      weight: '8.0 kg',
      dimensions: '50x50x50 cm',
      reference: 'LGT-000-555',
      coordinates: { lat: 25.0781, lng: 55.1342 }
    },
    {
      id: 106,
      customerName: 'Li Wei',
      address: 'Golf Place, Villa 88',
      status: 'pending',
      codAmount: 0,
      type: 'RETURN',
      phone: '+971 58 123 4567',
      weight: '1.5 kg',
      dimensions: '25x20x10 cm',
      reference: 'RET-999-888',
      coordinates: { lat: 25.1972, lng: 55.2744 }
    },
    {
      id: 107,
      customerName: 'Khalid Bin Walid',
      address: 'Acacia, Building C, Apt 202',
      status: 'pending',
      codAmount: 150.00,
      type: 'COD',
      phone: '+971 54 555 6666',
      weight: '3.0 kg',
      dimensions: '30x30x10 cm',
      reference: 'EXP-999-007',
      coordinates: { lat: 25.1972, lng: 55.2744 }
    },
  ]
};

import { ReportIssue } from './components/ReportIssue';
import { ScreenName } from './components/TabBar';

export default function App() {
  // Start at login screen - REAL FLOW ENABLED
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('login');
  const [selectedDelivery, setSelectedDelivery] = useState<number | null>(null);

  // Default to false - require real login and scanning
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [routeScanned, setRouteScanned] = useState(false);
  const [inspectionComplete, setInspectionComplete] = useState(false);

  // Initialize with null - will be set after login/scan
  const [routeData, setRouteData] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [driverInfo, setDriverInfo] = useState<any>(null);

  // Loading state to prevent rendering before state restoration is complete
  const [isInitializing, setIsInitializing] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });

  // Apply theme to root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Load state from localStorage on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        const storedDriver = localStorage.getItem('driverInfo');
        const storedRoute = localStorage.getItem('routeData');
        const storedInspection = localStorage.getItem('inspectionComplete');

        // Validate stored data before using
        if (storedToken && storedDriver) {
          let parsedDriver;
          try {
            parsedDriver = JSON.parse(storedDriver);
          } catch (e) {
            console.error('Failed to parse stored driver info, clearing session');
            localStorage.removeItem('authToken');
            localStorage.removeItem('driverInfo');
            localStorage.removeItem('routeData');
            localStorage.removeItem('inspectionComplete');
            setIsInitializing(false);
            return;
          }

          // Validate token is still valid by checking with the server
          try {
            await api.getDriverProfile(storedToken);
          } catch (e) {
            console.error('Token validation failed, session expired');
            localStorage.removeItem('authToken');
            localStorage.removeItem('driverInfo');
            localStorage.removeItem('routeData');
            localStorage.removeItem('inspectionComplete');
            setIsInitializing(false);
            return;
          }

          setAuthToken(storedToken);
          setDriverInfo(parsedDriver);
          setIsLoggedIn(true);

          if (storedRoute) {
            let parsedRoute;
            try {
              parsedRoute = JSON.parse(storedRoute);
            } catch (e) {
              console.error('Failed to parse stored route, going to scanner');
              localStorage.removeItem('routeData');
              localStorage.removeItem('inspectionComplete');
              setCurrentScreen('scanner');
              setIsInitializing(false);
              return;
            }

            setRouteData(parsedRoute);
            setRouteScanned(true);

            if (storedInspection === 'true') {
              setInspectionComplete(true);
              setCurrentScreen('dashboard');
            } else {
              setCurrentScreen('inspection');
            }
          } else {
            // NEW: Go to dashboard even without a route
            setCurrentScreen('dashboard');
          }
        }
      } catch (error) {
        console.error('Error restoring session:', error);
        // Clear all storage on error to prevent stuck state
        localStorage.removeItem('authToken');
        localStorage.removeItem('driverInfo');
        localStorage.removeItem('routeData');
        localStorage.removeItem('inspectionComplete');
      } finally {
        setIsInitializing(false);
      }
    };

    restoreSession();
  }, []);

  // Show loading screen while initializing to prevent white screen
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const handleLogin = (token: string, driver: any) => {
    setIsLoggedIn(true);
    setAuthToken(token);
    setDriverInfo(driver);
    localStorage.setItem('authToken', token);
    localStorage.setItem('driverInfo', JSON.stringify(driver));
    // NEW: Go to dashboard instead of scanner
    setCurrentScreen('dashboard');
  };

  const handleScanComplete = (data: any) => {
    setRouteScanned(true);
    setRouteData(data);
    localStorage.setItem('routeData', JSON.stringify(data));
    setCurrentScreen('inspection');
  };

  const handleInspectionComplete = () => {
    setInspectionComplete(true);
    localStorage.setItem('inspectionComplete', 'true');
    setCurrentScreen('dashboard');
  };

  // NEW: Handler to start route scanning from dashboard
  const handleStartRoute = () => {
    setCurrentScreen('scanner');
  };

  const handleNavigate = (screen: ScreenName) => {
    setCurrentScreen(screen);
  };

  const handleSelectDelivery = (id: number) => {
    setSelectedDelivery(id);
    setCurrentScreen('delivery');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setRouteScanned(false);
    setInspectionComplete(false);
    setRouteData(null);
    setAuthToken(null);
    setDriverInfo(null);

    // Clear all storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('driverInfo');
    localStorage.removeItem('routeData');
    localStorage.removeItem('inspectionComplete');

    setCurrentScreen('login');
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // NEW: If on scanner screen, show it
  if (currentScreen === 'scanner') {
    return <ScannerScreen onScanComplete={handleScanComplete} authToken={authToken!} />;
  }

  // NEW: If route scanned but inspection not complete, show inspection
  if (routeScanned && !inspectionComplete && currentScreen === 'inspection') {
    return <VehicleInspection onComplete={handleInspectionComplete} authToken={authToken!} driverInfo={driverInfo} routeData={routeData} />;
  }

  const handleDeliveryUpdate = (deliveryId: number, status: string) => {
    if (!routeData) return;

    let updatedStops = (routeData.stops || routeData.deliveries).map((d: any) => {
      // Update the modified stop
      if (d.id === deliveryId) {
        let newStatus = 'pending';
        const normalizedStatus = status.toLowerCase();
        if (normalizedStatus === 'delivered') newStatus = 'delivered';
        if (normalizedStatus === 'attempted') newStatus = 'attempted';
        if (normalizedStatus === 'returned') newStatus = 'returned';
        if (normalizedStatus === 'picked_up') newStatus = 'picked_up';
        if (normalizedStatus === 'failed') newStatus = 'failed';
        if (normalizedStatus === 'on_hold') newStatus = 'on_hold';
        return { ...d, status: newStatus };
      }
      return d;
    });

    // Handling dependent stops (Unlock delivery if pickup is completed)
    const modifiedStop = updatedStops.find((d: any) => d.id === deliveryId);
    if (modifiedStop && modifiedStop.stopType === 'pickup' &&
      (modifiedStop.status === 'picked_up' || modifiedStop.status === 'PICKED_UP' || modifiedStop.status === 'Picked Up')) {
      const orderId = modifiedStop.orderId;
      // Find corresponding delivery stop and unlock it
      updatedStops = updatedStops.map((d: any) => {
        if (d.orderId === orderId && d.stopType === 'delivery') {
          return { ...d, isDisabled: false };
        }
        return d;
      });
    }

    // Update both stops and deliveries to keep them in sync
    const newRouteData = {
      ...routeData,
      stops: updatedStops,
      deliveries: updatedStops
    };
    setRouteData(newRouteData);
    localStorage.setItem('routeData', JSON.stringify(newRouteData));
  };

  const handleFinishRoute = () => {
    setRouteScanned(false);
    setRouteData(null);
    setInspectionComplete(false); // Optional: require inspection for next route? Usually yes.
    localStorage.removeItem('routeData');
    localStorage.removeItem('inspectionComplete');
    setCurrentScreen('dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-background relative shadow-2xl">
        {currentScreen === 'dashboard' && <Dashboard onNavigate={handleNavigate} routeData={routeData} onStartRoute={handleStartRoute} hasActiveRoute={routeScanned && inspectionComplete} driverInfo={driverInfo} />}
        {currentScreen === 'route' && <RouteList onNavigate={handleNavigate} onSelectDelivery={handleSelectDelivery} routeData={routeData} authToken={authToken!} onFinishRoute={handleFinishRoute} />}
        {currentScreen === 'delivery' && <DeliveryDetail onNavigate={handleNavigate} deliveryId={selectedDelivery} routeData={routeData} authToken={authToken!} onDeliveryUpdate={handleDeliveryUpdate} />}
        {currentScreen === 'issue' && <ReportIssue onNavigate={handleNavigate} authToken={authToken!} hasRoute={routeScanned} />}
        {currentScreen === 'profile' && <Profile onNavigate={handleNavigate} authToken={authToken!} hasRoute={routeScanned} />}
        {currentScreen === 'settings' && <Settings onNavigate={handleNavigate} onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} />}
        {currentScreen === 'wallet' && <DriverWallet onNavigate={handleNavigate} authToken={authToken!} onLogout={handleLogout} />}
        {currentScreen === 'load_scan' && <LoadScan routeData={routeData} onComplete={() => setCurrentScreen('dashboard')} onCancel={() => setCurrentScreen('dashboard')} />}
      </div>
    </div>
  );
}