
type SyncAction = {
  id: string;
  type: 'inspection' | 'damage';
  data: any;
  timestamp: number;
};

const SYNC_STORAGE_KEY = 'rentmaster_offline_sync_queue';

export const offlineSync = {
  getQueue: (): SyncAction[] => {
    const data = localStorage.getItem(SYNC_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveToQueue: (type: 'inspection' | 'damage', data: any) => {
    const queue = offlineSync.getQueue();
    const newItem: SyncAction = {
      id: `sync_${Date.now()}`,
      type,
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify([...queue, newItem]));
  },

  clearQueue: () => {
    localStorage.removeItem(SYNC_STORAGE_KEY);
  },

  sync: async (onSuccess: (item: SyncAction) => void) => {
    const queue = offlineSync.getQueue();
    if (queue.length === 0) return;

    console.log(`Synchronisation de ${queue.length} éléments...`);
    
    // Simuler l'envoi vers le serveur pour chaque élément
    for (const item of queue) {
      await new Promise(resolve => setTimeout(resolve, 800)); // Simuler délai réseau
      onSuccess(item);
    }

    offlineSync.clearQueue();
  }
};
