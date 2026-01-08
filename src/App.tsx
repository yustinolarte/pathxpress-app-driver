import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { ScannerScreen } from './components/ScannerScreen';
import { VehicleInspection } from './components/VehicleInspection';
import { Dashboard } from './components/Dashboard';
import { RouteList } from './components/RouteList';
import { DeliveryDetail } from './components/DeliveryDetail';
import { ReportIssue } from './components/ReportIssue';
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

export default function App() {
  // Initialize with 'dashboard' to skip login/scan
  const [currentScreen, setCurrentScreen] = useState<'login' | 'scanner' | 'inspection' | 'dashboard' | 'route' | 'delivery' | 'issue' | 'profile' | 'settings'>('dashboard');
  const [selectedDelivery, setSelectedDelivery] = useState<number | null>(null);

  // Set these to true by default to bypass checks
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [routeScanned, setRouteScanned] = useState(true);
  const [inspectionComplete, setInspectionComplete] = useState(true);

  // Initialize with mock data
  const [routeData, setRouteData] = useState<any>(MOCK_ROUTE);
  const [authToken, setAuthToken] = useState<string | null>("mock-token");
  const [driverInfo, setDriverInfo] = useState<any>(MOCK_DRIVER);

  // Load state from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedDriver = localStorage.getItem('driverInfo');
    const storedRoute = localStorage.getItem('routeData');
    const storedInspection = localStorage.getItem('inspectionComplete');

    if (storedToken && storedDriver) {
      setAuthToken(storedToken);
      setDriverInfo(JSON.parse(storedDriver));
      setIsLoggedIn(true);
      // We keep currentScreen as is (mocked) or update if needed, but for now let's rely on the mock state 
      // unless we want real persistence to override. 
      // If we seek "full app", let's prioritize the mocked state if no storage, or storage state if exists.

      // Actually, to force the "hidden" behavior as requested, we should probably stick to the mocked values
      // or ensure that even if we load from storage, we are in a valid state.
      // But for a dev request like "hide login/scan", usually we just want to force it open.

      if (storedRoute) {
        const parsedRoute = JSON.parse(storedRoute);
        setRouteData(parsedRoute);
        setRouteScanned(true);

        if (storedInspection === 'true') {
          setInspectionComplete(true);
        }
      }
    }
  }, []);

  const handleLogin = (token: string, driver: any) => {
    setIsLoggedIn(true);
    setAuthToken(token);
    setDriverInfo(driver);
    localStorage.setItem('authToken', token);
    localStorage.setItem('driverInfo', JSON.stringify(driver));
    setCurrentScreen('scanner');
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

  const handleNavigate = (screen: typeof currentScreen) => {
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

  if (!routeScanned) {
    return <ScannerScreen onScanComplete={handleScanComplete} authToken={authToken!} />;
  }

  if (!inspectionComplete) {
    return <VehicleInspection onComplete={handleInspectionComplete} authToken={authToken!} driverInfo={driverInfo} routeData={routeData} />;
  }

  const handleDeliveryUpdate = (deliveryId: number, status: string) => {
    if (!routeData) return;

    const updatedDeliveries = routeData.deliveries.map((d: any) => {
      if (d.id === deliveryId) {
        let newStatus = 'pending';
        // Normalize status to what RouteList expects
        if (status === 'DELIVERED') newStatus = 'Delivered';
        if (status === 'ATTEMPTED') newStatus = 'Attempted';
        if (status === 'RETURNED') newStatus = 'Returned';

        return { ...d, status: newStatus };
      }
      return d;
    });

    const newRouteData = { ...routeData, deliveries: updatedDeliveries };
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
    <div className="min-h-screen bg-background">
      {currentScreen === 'dashboard' && <Dashboard onNavigate={handleNavigate} routeData={routeData} />}
      {currentScreen === 'route' && <RouteList onNavigate={handleNavigate} onSelectDelivery={handleSelectDelivery} routeData={routeData} authToken={authToken!} onFinishRoute={handleFinishRoute} />}
      {currentScreen === 'delivery' && <DeliveryDetail onNavigate={handleNavigate} deliveryId={selectedDelivery} routeData={routeData} authToken={authToken!} onDeliveryUpdate={handleDeliveryUpdate} />}
      {currentScreen === 'issue' && <ReportIssue onNavigate={handleNavigate} authToken={authToken!} />}
      {currentScreen === 'profile' && <Profile onNavigate={handleNavigate} authToken={authToken!} />}
      {currentScreen === 'settings' && <Settings onNavigate={handleNavigate} onLogout={handleLogout} />}
    </div>
  );
}