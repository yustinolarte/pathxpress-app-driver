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

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'scanner' | 'inspection' | 'dashboard' | 'route' | 'delivery' | 'issue' | 'profile' | 'settings'>('login');
  const [selectedDelivery, setSelectedDelivery] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [routeScanned, setRouteScanned] = useState(false);
  const [inspectionComplete, setInspectionComplete] = useState(false);
  const [routeData, setRouteData] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [driverInfo, setDriverInfo] = useState<any>(null);

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
      setCurrentScreen('scanner');

      if (storedRoute) {
        const parsedRoute = JSON.parse(storedRoute);
        setRouteData(parsedRoute);
        setRouteScanned(true);
        setCurrentScreen('inspection');

        if (storedInspection === 'true') {
          setInspectionComplete(true);
          setCurrentScreen('dashboard');
        }

        // Background refresh: Fetch latest route data to ensure stats are up to date
        if (parsedRoute.id) {
          api.getRoute(parsedRoute.id, storedToken)
            .then(freshRoute => {
              console.log('🔄 Route data refreshed from server');
              setRouteData(freshRoute);
              localStorage.setItem('routeData', JSON.stringify(freshRoute));
            })
            .catch(err => console.error('Failed to refresh route data:', err));
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
    return <VehicleInspection onComplete={handleInspectionComplete} authToken={authToken!} />;
  }

  const handleDeliveryUpdate = (deliveryId: number, status: string) => {
    if (!routeData) return;

    const updatedDeliveries = routeData.deliveries.map((d: any) => {
      if (d.id === deliveryId) {
        let newStatus = 'pending';
        if (status === 'DELIVERED') newStatus = 'completed'; // or 'Delivered' depending on what RouteList expects
        else if (status === 'ATTEMPTED') newStatus = 'Attempted';
        else if (status === 'RETURNED') newStatus = 'Returned';

        // Actually, RouteList expects: 'Pending', 'Delivered', 'Attempted', 'Returned' (capitalized)
        // Let's normalize to what RouteList expects
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
    <div className="min-h-screen bg-[#0a1128]">
      {currentScreen === 'dashboard' && <Dashboard onNavigate={handleNavigate} routeData={routeData} />}
      {currentScreen === 'route' && <RouteList onNavigate={handleNavigate} onSelectDelivery={handleSelectDelivery} routeData={routeData} authToken={authToken!} onFinishRoute={handleFinishRoute} />}
      {currentScreen === 'delivery' && <DeliveryDetail onNavigate={handleNavigate} deliveryId={selectedDelivery} routeData={routeData} authToken={authToken!} onDeliveryUpdate={handleDeliveryUpdate} />}
      {currentScreen === 'issue' && <ReportIssue onNavigate={handleNavigate} authToken={authToken!} />}
      {currentScreen === 'profile' && <Profile onNavigate={handleNavigate} authToken={authToken!} />}
      {currentScreen === 'settings' && <Settings onNavigate={handleNavigate} onLogout={handleLogout} />}
    </div>
  );
}