import { useState } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { ScannerScreen } from './components/ScannerScreen';
import { VehicleInspection } from './components/VehicleInspection';
import { Dashboard } from './components/Dashboard';
import { RouteList } from './components/RouteList';
import { DeliveryDetail } from './components/DeliveryDetail';
import { ReportIssue } from './components/ReportIssue';
import { Profile } from './components/Profile';
import { Settings } from './components/Settings';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'scanner' | 'inspection' | 'dashboard' | 'route' | 'delivery' | 'issue' | 'profile' | 'settings'>('login');
  const [selectedDelivery, setSelectedDelivery] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [routeScanned, setRouteScanned] = useState(false);
  const [inspectionComplete, setInspectionComplete] = useState(false);
  const [routeData, setRouteData] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [driverInfo, setDriverInfo] = useState<any>(null);

  const handleLogin = (token: string, driver: any) => {
    setIsLoggedIn(true);
    setAuthToken(token);
    setDriverInfo(driver);
    // Store in localStorage for persistence
    localStorage.setItem('authToken', token);
    localStorage.setItem('driverInfo', JSON.stringify(driver));
    setCurrentScreen('scanner');
  };

  const handleScanComplete = (data: any) => {
    setRouteScanned(true);
    setRouteData(data);
    setCurrentScreen('inspection');
  };

  const handleInspectionComplete = () => {
    setInspectionComplete(true);
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
    localStorage.removeItem('authToken');
    localStorage.removeItem('driverInfo');
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

  return (
    <div className="min-h-screen bg-[#0a1128]">
      {currentScreen === 'dashboard' && <Dashboard onNavigate={handleNavigate} routeData={routeData} />}
      {currentScreen === 'route' && <RouteList onNavigate={handleNavigate} onSelectDelivery={handleSelectDelivery} routeData={routeData} />}
      {currentScreen === 'delivery' && <DeliveryDetail onNavigate={handleNavigate} deliveryId={selectedDelivery} routeData={routeData} authToken={authToken!} />}
      {currentScreen === 'issue' && <ReportIssue onNavigate={handleNavigate} authToken={authToken!} />}
      {currentScreen === 'profile' && <Profile onNavigate={handleNavigate} authToken={authToken!} />}
      {currentScreen === 'settings' && <Settings onNavigate={handleNavigate} onLogout={handleLogout} />}
    </div>
  );
}