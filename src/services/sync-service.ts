import { dataService } from './data-service';
import { toast } from 'sonner';

export async function saveScriptUrl(url: string): Promise<void> {
    if (!url || !url.startsWith('https://script.google.com/macros/s/')) {
        throw new Error("L'URL du script Google Apps semble invalide.");
    }
    await dataService.setSetting('googleScriptUrl', url);
}

export async function getScriptUrl(): Promise<string | null> {
    return dataService.getSetting('googleScriptUrl');
}

export async function syncAllData(): Promise<void> {
    const url = await getScriptUrl();
    if (!url) {
        throw new Error("L'URL du script Google Apps n'est pas configurée.");
    }

    const dataJson = await dataService.exportData();

    const response = await fetch(url, {
        method: 'POST',
        mode: 'no-cors', // Important for simple triggers in Apps Script
        headers: {
            'Content-Type': 'text/plain;charset=utf-8', // Send as text/plain to be parsed in Apps Script
        },
        body: dataJson,
    });
    
    // As we are using no-cors, we can't read the response body.
    // We assume success if the request doesn't throw a network error.
    if (response.type === 'opaque') {
        await dataService.setSetting('lastSyncDate', new Date().toISOString());
    } else {
        // This part might not be reachable with 'no-cors', but is here for completeness
        if (!response.ok) {
            throw new Error(`Erreur réseau: ${response.statusText} (${response.status})`);
        }
    }
}
