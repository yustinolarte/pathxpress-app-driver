import { useState, useEffect } from 'react';
import { timeTracker, TimeTrackerState } from '../services/timeTracker';

interface ShiftTrackerProps {
    onClockOutAttempt?: () => void;
}

export function ShiftTracker({ onClockOutAttempt }: ShiftTrackerProps) {
    const [state, setState] = useState<TimeTrackerState>(timeTracker.getState());
    const [currentTime, setCurrentTime] = useState(0);
    const [breakTime, setBreakTime] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isClockingOut, setIsClockingOut] = useState(false);

    useEffect(() => {
        const unsubscribe = timeTracker.subscribe(setState);
        return unsubscribe;
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (state.isOnDuty) setCurrentTime(timeTracker.getTotalWorkTime());
            if (state.isOnBreak) setBreakTime(timeTracker.getCurrentBreakDuration());
        }, 1000);
        return () => clearInterval(interval);
    }, [state.isOnDuty, state.isOnBreak]);

    const handleClockIn = () => { timeTracker.clockIn(); };

    const handleClockOut = async () => {
        if (onClockOutAttempt) { onClockOutAttempt(); return; }
        if (confirm('Are you sure you want to clock out?')) {
            setIsClockingOut(true);
            try { await timeTracker.clockOut(); } finally { setIsClockingOut(false); }
        }
    };

    const handleStartBreak = (type: 'lunch' | 'short') => {
        timeTracker.startBreak(type);
        setIsExpanded(false);
    };

    const handleEndBreak = () => { timeTracker.endBreak(); };

    const LUNCH_LIMIT = 30 * 60;
    const SHORT_LIMIT = 15 * 60;
    const isBreakExceeded = state.isOnBreak && (
        (state.breakType === 'lunch' && breakTime > LUNCH_LIMIT) ||
        (state.breakType === 'short' && breakTime > SHORT_LIMIT)
    );

    // Not clocked in
    if (!state.isOnDuty) {
        return (
            <button
                onClick={handleClockIn}
                className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-green-900/30 active:scale-[0.98] transition-all"
            >
                <span className="material-symbols-rounded text-xl">play_arrow</span>
                Clock In to Start Shift
            </button>
        );
    }

    // On Break
    if (state.isOnBreak) {
        return (
            <div className={`rounded-xl p-4 flex items-center justify-between ${isBreakExceeded ? 'bg-red-500/10 border border-red-500/30' : 'bg-orange-500/10 border border-orange-500/30'
                }`}>
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isBreakExceeded ? 'bg-red-500/20' : 'bg-orange-500/20'
                        }`}>
                        <span className={`material-symbols-rounded text-xl ${isBreakExceeded ? 'text-red-400' : 'text-orange-400'}`}>
                            {state.breakType === 'lunch' ? 'restaurant' : 'coffee'}
                        </span>
                    </div>
                    <div>
                        <p className={`font-bold text-sm ${isBreakExceeded ? 'text-red-400' : 'text-orange-400'}`}>
                            {state.breakType === 'lunch' ? 'Lunch' : 'Break'} • {timeTracker.formatDuration(breakTime)}
                        </p>
                        {isBreakExceeded && (
                            <p className="text-[10px] text-red-500 flex items-center gap-1">
                                <span className="material-symbols-rounded text-xs">warning</span> Time exceeded
                            </p>
                        )}
                    </div>
                </div>
                <button
                    onClick={handleEndBreak}
                    className={`px-4 py-2 rounded-lg font-bold text-white text-sm active:scale-95 transition-transform ${isBreakExceeded ? 'bg-red-500' : 'bg-orange-500'
                        }`}
                >
                    End Break
                </button>
            </div>
        );
    }

    // On Duty
    return (
        <div className="bg-green-500/10 rounded-xl border border-green-500/30 overflow-hidden">
            <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <span className="material-symbols-rounded text-green-400 text-xl">schedule</span>
                    </div>
                    <div>
                        <p className="font-bold text-green-400 text-sm">On Duty • {timeTracker.formatDuration(currentTime)}</p>
                        <p className="text-[10px] text-green-600">
                            Since {state.shiftData.clockIn ? timeTracker.formatTime(state.shiftData.clockIn) : '--'}
                        </p>
                    </div>
                </div>
                <span className="material-symbols-rounded text-green-600">
                    {isExpanded ? 'expand_less' : 'expand_more'}
                </span>
            </div>

            {isExpanded && (
                <div className="px-4 pb-4 space-y-2 border-t border-green-500/20 pt-3">
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleStartBreak('lunch')}
                            disabled={isClockingOut}
                            className="flex-1 py-2.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-lg font-medium flex items-center justify-center gap-1.5 text-xs disabled:opacity-50 active:scale-95 transition-transform"
                        >
                            <span className="material-symbols-rounded text-base">restaurant</span>
                            Lunch
                        </button>
                        <button
                            onClick={() => handleStartBreak('short')}
                            disabled={isClockingOut}
                            className="flex-1 py-2.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-lg font-medium flex items-center justify-center gap-1.5 text-xs disabled:opacity-50 active:scale-95 transition-transform"
                        >
                            <span className="material-symbols-rounded text-base">coffee</span>
                            Break
                        </button>
                    </div>
                    <button
                        onClick={handleClockOut}
                        disabled={isClockingOut}
                        className={`w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${isClockingOut ? 'bg-gray-700 text-gray-400 cursor-wait' : 'bg-red-500/20 border border-red-500/30 text-red-400'
                            }`}
                    >
                        {isClockingOut ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Clocking Out...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-rounded text-base">stop</span>
                                Clock Out
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
