import {
    LayoutDashboard,
    Users,
    Route,
    Package,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Truck,
    LogOut
} from 'lucide-react';
import type { AdminView } from '../AdminApp';

interface SidebarProps {
    currentView: AdminView;
    onNavigate: (view: AdminView) => void;
    collapsed: boolean;
    onToggleCollapse: () => void;
    onLogout: () => void;
}

const menuItems: { id: AdminView; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'drivers', label: 'Drivers', icon: Users },
    { id: 'routes', label: 'Routes', icon: Route },
    { id: 'deliveries', label: 'Deliveries', icon: Package },
    { id: 'reports', label: 'Reports', icon: AlertTriangle },
];

export function Sidebar({ currentView, onNavigate, collapsed, onToggleCollapse, onLogout }: SidebarProps) {
    return (
        <aside
            className="fixed left-0 top-0 h-full bg-[#111118] border-r border-white/5 transition-all duration-300 z-50 flex flex-col"
            style={{ width: collapsed ? '80px' : '260px' }}
        >
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 min-w-[40px] rounded-xl bg-gradient-to-br from-[#e10600] to-[#ff4d4d] flex items-center justify-center shadow-lg shadow-[#e10600]/20">
                        <Truck className="w-5 h-5 text-white" />
                    </div>
                    {!collapsed && (
                        <div className="animate-fadeIn">
                            <h1 className="text-white font-bold text-sm whitespace-nowrap">PathXpress</h1>
                            <p className="text-white/40 text-xs">Admin Panel</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Toggle Button */}
            <button
                onClick={onToggleCollapse}
                className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[#16161f] border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-[#e10600]/50 transition-all z-10"
            >
                {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
            </button>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-gradient-to-r from-[#e10600]/20 to-transparent text-white'
                                    : 'text-white/50 hover:text-white hover:bg-white/5'
                                }`}
                            title={collapsed ? item.label : undefined}
                        >
                            <div className={`w-9 h-9 min-w-[36px] rounded-lg flex items-center justify-center transition-all ${isActive
                                    ? 'bg-[#e10600] text-white shadow-lg shadow-[#e10600]/30'
                                    : 'bg-white/5 group-hover:bg-white/10'
                                }`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            {!collapsed && (
                                <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>
                            )}
                            {isActive && !collapsed && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#e10600]" />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* User Section */}
            <div className="p-3 border-t border-white/5">
                {!collapsed && (
                    <div className="bg-white/5 rounded-xl p-3 mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#e10600] to-[#ff4d4d] flex items-center justify-center text-white font-bold text-sm">
                                A
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">Admin</p>
                                <p className="text-white/40 text-xs">Super Admin</p>
                            </div>
                        </div>
                    </div>
                )}

                <button
                    onClick={onLogout}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all ${collapsed ? 'justify-center' : ''
                        }`}
                    title="Logout"
                >
                    <LogOut className="w-5 h-5" />
                    {!collapsed && <span className="text-sm">Logout</span>}
                </button>
            </div>
        </aside>
    );
}
