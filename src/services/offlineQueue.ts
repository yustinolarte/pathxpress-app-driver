import { api } from './api';

export interface QueuedRequest {
    id: string;
    type: 'UPDATE_DELIVERY' | 'UPDATE_STOP' | 'FINISH_ROUTE' | 'CREATE_REPORT';
    payload: any;
    timestamp: number;
    retryCount: number;
}

class OfflineQueueService {
    private queue: QueuedRequest[] = [];
    private STORAGE_KEY = 'offlineQueue';
    private isProcessing = false;

    constructor() {
        this.loadQueue();
    }

    private loadQueue() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            try {
                this.queue = JSON.parse(stored);
            } catch (e) {
                console.error('Failed to parse offline queue', e);
                this.queue = [];
            }
        }
    }

    private saveQueue() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
    }

    public addToQueue(type: QueuedRequest['type'], payload: any) {
        const request: QueuedRequest = {
            id: crypto.randomUUID(),
            type,
            payload,
            timestamp: Date.now(),
            retryCount: 0
        };
        this.queue.push(request);
        this.saveQueue();
        console.log(`Added to offline queue: ${type}`, payload);
    }

    public getQueueSize(): number {
        return this.queue.length;
    }

    public getQueue(): QueuedRequest[] {
        return [...this.queue];
    }

    public async processQueue(token: string) {
        if (this.isProcessing || this.queue.length === 0) return;

        this.isProcessing = true;
        console.log(`Processing offline queue: ${this.queue.length} items`);

        const tempQueue = [...this.queue];
        const remainingQueue: QueuedRequest[] = [];

        for (const request of tempQueue) {
            try {
                console.log(`Processing request ${request.id} (${request.type})`);

                switch (request.type) {
                    case 'UPDATE_DELIVERY':
                        await api.updateDeliveryStatus(
                            request.payload.deliveryId,
                            request.payload.status,
                            token,
                            request.payload.photoBase64,
                            request.payload.notes
                        );
                        break;

                    case 'UPDATE_STOP':
                        await api.updateStopStatus(
                            request.payload.stopId,
                            request.payload.status,
                            token,
                            request.payload.photo,
                            request.payload.notes,
                            request.payload.collectedAmount
                        );
                        break;

                    case 'FINISH_ROUTE':
                        await api.finishRoute(
                            request.payload.routeId,
                            token
                        );
                        break;

                    case 'CREATE_REPORT':
                        await api.createReport(
                            request.payload.reportData,
                            token
                        );
                        break;
                }

                console.log(`Successfully processed ${request.id}`);
                // Request succeeded, don't add back to remainingQueue

            } catch (error) {
                console.error(`Failed to process request ${request.id}`, error);
                // Request failed, keep in queue
                request.retryCount++;
                remainingQueue.push(request);
            }
        }

        this.queue = remainingQueue;
        this.saveQueue();
        this.isProcessing = false;
    }
}

export const offlineQueue = new OfflineQueueService();
