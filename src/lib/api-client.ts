/**
 * @fileOverview API WALL - CLIENT BOUNDARY
 * The only authorized pathway for UI -> Backend communication.
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
            throw new Error(result.error || 'System API Hard Boundary Violation');
        }
        return result.data;
    }

    // Core Entities
    getProducts = () => this.request<any[]>('products');
    getCustomers = () => this.request<any[]>('customers');
    getSales = () => this.request<any[]>('sales');
    getDashboard = (from: string, to: string) => this.request<any>(`dashboard?from=${from}&to=${to}`);

    // Generic Operations
    post = (path: string, data: any) => this.request(path, { method: 'POST', body: JSON.stringify(data) });
    put = (path: string, data: any) => this.request(path, { method: 'PUT', body: JSON.stringify(data) });
    delete = (path: string) => this.request(path, { method: 'DELETE' });
}

export const api = new ApiClient();
