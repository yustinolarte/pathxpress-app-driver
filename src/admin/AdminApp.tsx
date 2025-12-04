import { useState, useEffect } from 'react';
import { adminApi } from './services/adminApi';
import { LoginScreen } from './components/LoginScreen';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { DriversView } from './views/DriversView';
import { RoutesView } from './views/RoutesView';
import { DeliveriesView } from './views/DeliveriesView';
import { ReportsView } from './views/ReportsView';

export type AdminView = 'dashboard' | 'drivers' | 'routes' | 'deliveries' | 'reports';

export function AdminApp() {
    const [isAuthenticated, setIsAuthenticated] = useState(adminApi.isAuthenticated());
    const [currentView, setCurrentView] = useState<AdminView>('dashboard');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const handleLogin = () => {
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        adminApi.logout();
        setIsAuthenticated(false);
    };

    if (!isAuthenticated) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return <DashboardView />;
            case 'drivers':
                return <DriversView />;
            case 'routes':
                return <RoutesView />;
            case 'deliveries':
                return <DeliveriesView />;
            case 'reports':
                return <ReportsView />;
            default:
                return <DashboardView />;
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] flex">
            <Sidebar
                currentView={currentView}
                onNavigate={setCurrentView}
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                onLogout={handleLogout}
            />
            <main
                className="flex-1 transition-all duration-300"
                style={{ marginLeft: sidebarCollapsed ? '80px' : '260px' }}
            >
                <div className="p-6 min-h-screen">
                    {renderView()}
                </div>
            </main>
        </div>
    );
}
