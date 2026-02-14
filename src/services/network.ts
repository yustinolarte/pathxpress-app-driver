import { Network } from '@capacitor/network';

class NetworkService {
    private static instance: NetworkService;
    private online: boolean = true;
    private listeners: ((online: boolean) => void)[] = [];

    private constructor() {
        this.init();
    }

    public static getInstance(): NetworkService {
        if (!NetworkService.instance) {
            NetworkService.instance = new NetworkService();
        }
        return NetworkService.instance;
    }

    private async init() {
        const status = await Network.getStatus();
        this.online = status.connected;

        Network.addListener('networkStatusChange', (status) => {
            console.log('Network status changed', status);
            this.online = status.connected;
            this.notifyListeners();
        });
    }

    public isOnline(): boolean {
        return this.online;
    }

    public addListener(callback: (online: boolean) => void) {
        this.listeners.push(callback);
        // Immediately notify current status
        callback(this.online);
    }

    public removeListener(callback: (online: boolean) => void) {
        this.listeners = this.listeners.filter(l => l !== callback);
    }

    private notifyListeners() {
        this.listeners.forEach(listener => listener(this.online));
    }
}

export const networkService = NetworkService.getInstance();
