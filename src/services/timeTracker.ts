// Time Tracking Service
// Manages clock-in/out, breaks, and stop timing
import { api } from './api';

interface ShiftData {
    date: string;
    clockIn: string | null;
    clockOut: string | null;
    breaks: BreakRecord[];
    stops: StopRecord[];
}

interface BreakRecord {
    type: 'lunch' | 'short';
    start: string;
    end: string | null;
    duration?: number; // in seconds
}

interface StopRecord {
    deliveryId: number;
    arrivedAt: string;
    leftAt: string | null;
    duration?: number; // in seconds
}

interface TimeTrackerState {
    isOnDuty: boolean;
    isOnBreak: boolean;
    breakType: 'lunch' | 'short' | null;
    currentStopId: number | null;
    shiftData: ShiftData;
}

const STORAGE_KEY = 'pathxpress_timetracker';

class TimeTrackerService {
    private state: TimeTrackerState;
    private listeners: Set<(state: TimeTrackerState) => void> = new Set();

    constructor() {
        this.state = this.loadState();
    }

    private loadState(): TimeTrackerState {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Reset if it's a new day
                const today = new Date().toISOString().split('T')[0];
                if (parsed.shiftData?.date !== today) {
                    return this.getDefaultState();
                }
                return parsed;
            }
        } catch (e) {
            console.error('Error loading time tracker state:', e);
        }
        return this.getDefaultState();
    }

    private getDefaultState(): TimeTrackerState {
        return {
            isOnDuty: false,
            isOnBreak: false,
            breakType: null,
            currentStopId: null,
            shiftData: {
                date: new Date().toISOString().split('T')[0],
                clockIn: null,
                clockOut: null,
                breaks: [],
                stops: [],
            },
        };
    }

    private saveState(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
            this.notifyListeners();
        } catch (e) {
            console.error('Error saving time tracker state:', e);
        }
    }

    private notifyListeners(): void {
        this.listeners.forEach((listener) => listener(this.state));
    }

    subscribe(listener: (state: TimeTrackerState) => void): () => void {
        this.listeners.add(listener);
        listener(this.state);
        return () => this.listeners.delete(listener);
    }

    getState(): TimeTrackerState {
        return this.state;
    }

    // Clock In/Out
    async clockIn(): Promise<void> {
        if (this.state.isOnDuty) return;

        try {
            await api.post('/shifts/start', {});

            this.state.isOnDuty = true;
            this.state.shiftData.clockIn = new Date().toISOString();
            this.state.shiftData.clockOut = null;
            this.saveState();
        } catch (error) {
            console.error('Failed to clock in:', error);
            // Optionally continue offline or show error
            // For now, we allow local clock-in even if API fails to NOT block the driver
            this.state.isOnDuty = true;
            this.state.shiftData.clockIn = new Date().toISOString();
            this.saveState();
        }
    }

    async clockOut(): Promise<void> {
        if (!this.state.isOnDuty) return;

        try {
            await api.post('/shifts/end', {});

            // End any active break
            if (this.state.isOnBreak) {
                this.endBreak();
            }

            // End any active stop
            if (this.state.currentStopId !== null) {
                this.endStop(this.state.currentStopId);
            }

            this.state.isOnDuty = false;
            this.state.shiftData.clockOut = new Date().toISOString();
            this.saveState();
        } catch (error) {
            console.error('Failed to clock out:', error);
            // Allow local clock-out
            this.state.isOnDuty = false;
            this.state.shiftData.clockOut = new Date().toISOString();
            this.saveState();
        }
    }

    // Breaks
    startBreak(type: 'lunch' | 'short'): void {
        if (!this.state.isOnDuty || this.state.isOnBreak) return;

        this.state.isOnBreak = true;
        this.state.breakType = type;
        this.state.shiftData.breaks.push({
            type,
            start: new Date().toISOString(),
            end: null,
        });
        this.saveState();
    }

    endBreak(): void {
        if (!this.state.isOnBreak) return;

        const currentBreak = this.state.shiftData.breaks[this.state.shiftData.breaks.length - 1];
        if (currentBreak && !currentBreak.end) {
            currentBreak.end = new Date().toISOString();
            currentBreak.duration = Math.floor(
                (new Date(currentBreak.end).getTime() - new Date(currentBreak.start).getTime()) / 1000
            );
        }

        this.state.isOnBreak = false;
        this.state.breakType = null;
        this.saveState();
    }

    // Stop Timing
    startStop(deliveryId: number): void {
        if (!this.state.isOnDuty || this.state.isOnBreak) return;

        // End previous stop if any
        if (this.state.currentStopId !== null) {
            this.endStop(this.state.currentStopId);
        }

        this.state.currentStopId = deliveryId;
        this.state.shiftData.stops.push({
            deliveryId,
            arrivedAt: new Date().toISOString(),
            leftAt: null,
        });
        this.saveState();
    }

    endStop(deliveryId: number): void {
        const stopRecord = this.state.shiftData.stops.find(
            (s) => s.deliveryId === deliveryId && !s.leftAt
        );

        if (stopRecord) {
            stopRecord.leftAt = new Date().toISOString();
            stopRecord.duration = Math.floor(
                (new Date(stopRecord.leftAt).getTime() - new Date(stopRecord.arrivedAt).getTime()) / 1000
            );
        }

        if (this.state.currentStopId === deliveryId) {
            this.state.currentStopId = null;
        }

        this.saveState();
    }

    getStopDuration(deliveryId: number): number {
        const stopRecord = this.state.shiftData.stops.find(
            (s) => s.deliveryId === deliveryId
        );

        if (!stopRecord) return 0;

        if (stopRecord.duration) {
            return stopRecord.duration;
        }

        // Still active
        return Math.floor(
            (new Date().getTime() - new Date(stopRecord.arrivedAt).getTime()) / 1000
        );
    }

    // Stats
    getTotalWorkTime(): number {
        if (!this.state.shiftData.clockIn) return 0;

        const endTime = this.state.shiftData.clockOut
            ? new Date(this.state.shiftData.clockOut).getTime()
            : new Date().getTime();

        const startTime = new Date(this.state.shiftData.clockIn).getTime();
        return Math.floor((endTime - startTime) / 1000);
    }

    getTotalBreakTime(): number {
        return this.state.shiftData.breaks.reduce((total, brk) => {
            if (brk.duration) {
                return total + brk.duration;
            }
            if (brk.end) {
                return total + Math.floor(
                    (new Date(brk.end).getTime() - new Date(brk.start).getTime()) / 1000
                );
            }
            // Active break
            return total + Math.floor(
                (new Date().getTime() - new Date(brk.start).getTime()) / 1000
            );
        }, 0);
    }

    getActiveTime(): number {
        return this.getTotalWorkTime() - this.getTotalBreakTime();
    }

    getAverageStopTime(): number {
        const completedStops = this.state.shiftData.stops.filter((s) => s.duration);
        if (completedStops.length === 0) return 0;

        const totalTime = completedStops.reduce((sum, s) => sum + (s.duration || 0), 0);
        return Math.floor(totalTime / completedStops.length);
    }

    getCompletedStopsCount(): number {
        return this.state.shiftData.stops.filter((s) => s.leftAt).length;
    }

    getCurrentBreakDuration(): number {
        if (!this.state.isOnBreak) return 0;

        const currentBreak = this.state.shiftData.breaks[this.state.shiftData.breaks.length - 1];
        if (!currentBreak) return 0;

        return Math.floor(
            (new Date().getTime() - new Date(currentBreak.start).getTime()) / 1000
        );
    }

    // Format helpers
    formatDuration(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        }
        return `${secs}s`;
    }

    formatTime(isoString: string): string {
        return new Date(isoString).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    }
}

// Singleton instance
export const timeTracker = new TimeTrackerService();
export type { TimeTrackerState, ShiftData, BreakRecord, StopRecord };
