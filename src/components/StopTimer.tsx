import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { timeTracker } from '../services/timeTracker';

interface StopTimerProps {
    deliveryId: number;
    isActive: boolean;
}

export function StopTimer({ deliveryId, isActive }: StopTimerProps) {
    const [duration, setDuration] = useState(0);
    const [showAlert, setShowAlert] = useState(false);

    // Start timer when component mounts (delivery opened)
    useEffect(() => {
        if (isActive) {
            timeTracker.startStop(deliveryId);
        }
    }, [deliveryId, isActive]);

    // Update duration every second
    useEffect(() => {
        if (!isActive) return;

        const interval = setInterval(() => {
            const currentDuration = timeTracker.getStopDuration(deliveryId);
            setDuration(currentDuration);

            // Show alert if stop takes more than 10 minutes
            if (currentDuration > 600 && !showAlert) {
                setShowAlert(true);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [deliveryId, isActive, showAlert]);

    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Determine status color
    const getStatusColor = () => {
        if (duration > 900) return 'text-red-600 bg-red-50'; // > 15 min
        if (duration > 600) return 'text-orange-600 bg-orange-50'; // > 10 min
        if (duration > 300) return 'text-yellow-600 bg-yellow-50'; // > 5 min
        return 'text-gray-600 bg-gray-50';
    };

    const getStatusText = () => {
        if (duration > 900) return 'Taking too long';
        if (duration > 600) return 'Longer than usual';
        if (duration > 300) return 'Check progress';
        return 'On track';
    };

    if (!isActive) return null;

    return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${getStatusColor()}`}>
            <Clock className="w-4 h-4" />
            <span className="font-mono font-bold">{formatDuration(duration)}</span>
            {duration > 600 && (
                <AlertTriangle className="w-4 h-4" />
            )}
            <span className="text-xs opacity-75">{getStatusText()}</span>
        </div>
    );
}

// Compact version for list items
export function StopTimerBadge({ deliveryId }: { deliveryId: number }) {
    const duration = timeTracker.getStopDuration(deliveryId);

    if (duration === 0) return null;

    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins > 0) return `${mins}m ${secs}s`;
        return `${secs}s`;
    };

    return (
        <span className="text-xs text-gray-400">
            ⏱️ {formatDuration(duration)}
        </span>
    );
}
