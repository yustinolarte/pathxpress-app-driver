import { useState, useEffect } from 'react';
import { Users, Route, Package, AlertTriangle, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { adminApi } from '../services/adminApi';

interface DashboardStats {
    drivers: { total: number; active: number };
    routes: { total: number; today: number };
    deliveries: { total: number; today: number; delivered: number; attempted: number; pending: number };
    reports: { pending: number };
    cod: { collectedToday: number };
}

export function DashboardView() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await adminApi.getDashboard();
            setStats(data);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-6">
                <div className="h-8 w-48 bg-white/5 rounded-lg" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-white/5 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    const statCards = [
        {
            title: 'Active Drivers',
            value: stats?.drivers.active || 0,
            subtitle: `${stats?.drivers.total || 0} total`,
            icon: Users,
            color: 'from-emerald-500 to-emerald-600',
            bgColor: 'bg-emerald-500/10',
            iconColor: 'text-emerald-400'
        },
        {
            title: 'Today\'s Routes',
            value: stats?.routes.today || 0,
            subtitle: `${stats?.routes.total || 0} total`,
            icon: Route,
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-500/10',
            iconColor: 'text-blue-400'
        },
        {
            title: 'Delivered Today',
            value: stats?.deliveries.delivered || 0,
            subtitle: `${stats?.deliveries.today || 0} assigned`,
            icon: Package,
            color: 'from-[#e10600] to-[#ff4d4d]',
            bgColor: 'bg-[#e10600]/10',
            iconColor: 'text-[#e10600]'
        },
        {
            title: 'COD Collected',
            value: `AED ${(stats?.cod.collectedToday || 0).toLocaleString()}`,
            subtitle: 'Today\'s collection',
            icon: DollarSign,
            color: 'from-amber-500 to-amber-600',
            bgColor: 'bg-amber-500/10',
            iconColor: 'text-amber-400'
        }
    ];

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                    <p className="text-white/50 mt-1">Welcome back, Admin</p>
                </div>
                <div className="flex items-center gap-2 text-white/40 text-sm">
                    <Clock className="w-4 h-4" />
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={index}
                            className="bg-[#16161f]/80 backdrop-blur-sm border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all duration-300 card-hover"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center`}>
                                    <Icon className={`w-6 h-6 ${card.iconColor}`} />
                                </div>
                                <div className="flex items-center gap-1 text-emerald-400 text-sm">
                                    <TrendingUp className="w-4 h-4" />
                                    <span>+12%</span>
                                </div>
                            </div>
                            <p className="text-white/40 text-sm mb-1">{card.title}</p>
                            <p className="text-white text-2xl font-bold mb-1">{card.value}</p>
                            <p className="text-white/30 text-xs">{card.subtitle}</p>
                        </div>
                    );
                })}
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Delivery Status */}
                <div className="bg-[#16161f]/80 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
                    <h3 className="text-white font-semibold mb-4">Delivery Status</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                <span className="text-white/70 text-sm">Delivered</span>
                            </div>
                            <span className="text-white font-semibold">{stats?.deliveries.delivered || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-amber-500" />
                                <span className="text-white/70 text-sm">Attempted</span>
                            </div>
                            <span className="text-white font-semibold">{stats?.deliveries.attempted || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                                <span className="text-white/70 text-sm">Pending</span>
                            </div>
                            <span className="text-white font-semibold">{stats?.deliveries.pending || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Pending Reports */}
                <div className="bg-[#16161f]/80 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold">Pending Reports</h3>
                        <div className={`w-10 h-10 rounded-xl ${stats?.reports.pending ? 'bg-red-500/20' : 'bg-emerald-500/20'} flex items-center justify-center`}>
                            <AlertTriangle className={`w-5 h-5 ${stats?.reports.pending ? 'text-red-400' : 'text-emerald-400'}`} />
                        </div>
                    </div>
                    <p className="text-4xl font-bold text-white mb-2">{stats?.reports.pending || 0}</p>
                    <p className="text-white/40 text-sm">
                        {stats?.reports.pending
                            ? 'Reports need attention'
                            : 'All reports resolved'}
                    </p>
                </div>

                {/* Overview */}
                <div className="bg-[#16161f]/80 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
                    <h3 className="text-white font-semibold mb-4">System Overview</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-white/50">Total Drivers</span>
                            <span className="text-white">{stats?.drivers.total || 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-white/50">Total Routes</span>
                            <span className="text-white">{stats?.routes.total || 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-white/50">Total Deliveries</span>
                            <span className="text-white">{stats?.deliveries.total || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
