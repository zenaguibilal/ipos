/**
 * @fileOverview THE API GATEWAY (Nuclear Cleaned)
 * PHASE 16: Purged redundant logs and enforced clean error normalization.
 */

class ApiClient {
    private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
        const response = await fetch(`/api/${path}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        const result = await response.json();
        
        if (!response.ok) {
            const errorMessage = result.error || `GATEWAY_VIOLATION_${response.status}`;
            throw new Error(errorMessage);
        }

        return result.data;
    }

    get = <T>(path: string) => this.request<T>(path, { method: 'GET' });
    post = <T>(path: string, data: any) => this.request<T>(path, { method: 'POST', body: JSON.stringify(data) });
    put = <T>(path: string, data: any) => this.request<T>(path, { method: 'PUT', body: JSON.stringify(data) });
    delete = <T>(path: string) => this.request<T>(path, { method: 'DELETE' });
}

export const api = new ApiClient();