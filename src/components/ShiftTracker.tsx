import { useState, useEffect } from 'react';
import { Clock, Play, Square, Coffee, UtensilsCrossed, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { timeTracker, TimeTrackerState } from '../services/timeTracker';

export function ShiftTracker() {
    const [state, setState] = useState<TimeTrackerState>(timeTracker.getState());
    const [currentTime, setCurrentTime] = useState(0);
    const [breakTime, setBreakTime] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isClockingOut, setIsClockingOut] = useState(false);

    useEffect(() => {
        const unsubscribe = timeTracker.subscribe(setState);
        return unsubscribe;
    }, []);

    // Update timers every second
    useEffect(() => {
        const interval = setInterval(() => {
            if (state.isOnDuty) {
                setCurrentTime(timeTracker.getTotalWorkTime());
            }
            if (state.isOnBreak) {
                setBreakTime(timeTracker.getCurrentBreakDuration());
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [state.isOnDuty, state.isOnBreak]);

    const handleClockIn = () => {
        timeTracker.clockIn();
    };

    const handleClockOut = async () => {
        if (confirm('Are you sure you want to clock out?')) {
            setIsClockingOut(true);
            try {
                await timeTracker.clockOut();
            } finally {
                setIsClockingOut(false);
            }
        }
    };

    const handleStartBreak = (type: 'lunch' | 'short') => {
        timeTracker.startBreak(type);
        setIsExpanded(false);
    };

    const handleEndBreak = () => {
        timeTracker.endBreak();
    };

    // Break time limits (in seconds)
    const LUNCH_LIMIT = 30 * 60;
    const SHORT_LIMIT = 15 * 60;

    const isBreakExceeded = state.isOnBreak && (
        (state.breakType === 'lunch' && breakTime > LUNCH_LIMIT) ||
        (state.breakType === 'short' && breakTime > SHORT_LIMIT)
    );

    // Not clocked in - show Clock In button
    if (!state.isOnDuty) {
        return (
            <button
                onClick={handleClockIn}
                className="w-full py-4 bg-green-500 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-green-200 hover:bg-green-600 transition-all"
            >
                <Play className="w-5 h-5" fill="white" />
                Clock In to Start Shift
            </button>
        );
    }

    // On Break - show break status (compact)
    if (state.isOnBreak) {
        return (
            <div className={`rounded-2xl p-4 flex items-center justify-between ${isBreakExceeded ? 'bg-red-100 border border-red-300' : 'bg-orange-100 border border-orange-300'}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isBreakExceeded ? 'bg-red-200' : 'bg-orange-200'}`}>
                        {state.breakType === 'lunch' ? (
                            <UtensilsCrossed className={`w-5 h-5 ${isBreakExceeded ? 'text-red-600' : 'text-orange-600'}`} />
                        ) : (
                            <Coffee className={`w-5 h-5 ${isBreakExceeded ? 'text-red-600' : 'text-orange-600'}`} />
                        )}
                    </div>
                    <div>
                        <p className={`font-bold ${isBreakExceeded ? 'text-red-700' : 'text-orange-700'}`}>
                            {state.breakType === 'lunch' ? 'Lunch' : 'Break'} • {timeTracker.formatDuration(breakTime)}
                        </p>
                        {isBreakExceeded && (
                            <p className="text-xs text-red-600 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Time exceeded
                            </p>
                        )}
                    </div>
                </div>
                <button
                    onClick={handleEndBreak}
                    className={`px-4 py-2 rounded-xl font-bold text-white ${isBreakExceeded ? 'bg-red-500' : 'bg-orange-500'}`}
                >
                    End Break
                </button>
            </div>
        );
    }

    // On Duty - Compact view (default) or Expanded
    return (
        <div className="bg-green-100 rounded-2xl border border-green-300 overflow-hidden">
            {/* Compact View - Always visible */}
            <div
                className="p-4 flex items-center justify-between cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-200 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <p className="font-bold text-green-700">
                            On Duty
                        </p>
                        <p className="text-xs text-green-600">
                            Since {state.shiftData.clockIn ? timeTracker.formatTime(state.shiftData.clockIn) : '--'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-green-600" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-green-600" />
                    )}
                </div>
            </div>

            {/* Expanded View - Break & Clock Out options */}
            {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-green-200 pt-3">
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleStartBreak('lunch')}
                            disabled={isClockingOut}
                            className="flex-1 py-2.5 bg-orange-100 border border-orange-300 text-orange-700 rounded-xl font-medium flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                        >
                            <UtensilsCrossed className="w-4 h-4" />
                            Lunch
                        </button>
                        <button
                            onClick={() => handleStartBreak('short')}
                            disabled={isClockingOut}
                            className="flex-1 py-2.5 bg-orange-100 border border-orange-300 text-orange-700 rounded-xl font-medium flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                        >
                            <Coffee className="w-4 h-4" />
                            Break
                        </button>
                    </div>
                    <button
                        onClick={handleClockOut}
                        disabled={isClockingOut}
                        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isClockingOut ? 'bg-gray-400 text-white cursor-wait' : 'bg-red-500 text-white hover:bg-red-600'}`}
                    >
                        {isClockingOut ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Clocking Out...
                            </>
                        ) : (
                            <>
                                <Square className="w-4 h-4" fill="white" />
                                Clock Out
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
