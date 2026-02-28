'use client';

import { v4 as uuidv4 } from 'uuid';
import { CollectionName, DB, initialData } from './initial-data';

let store: DataService;

class DataService {
    private db: DB;
    private listeners: Set<() => void> = new Set();
    private readonly storageKey = 'iPOS_data';

    constructor() {
        this.db = this.loadFromLocalStorage();
    }
    
    // --- Subscription System for React integration ---
    subscribe = (callback: () => void): (() => void) => {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    };

    getSnapshot = () => {
        return this.db;
    };
    
    private notify = () => {
        this.saveToLocalStorage();
        this.listeners.forEach(listener => listener());
    };

    // --- Local Storage Persistence ---
    private loadFromLocalStorage = (): DB => {
        if (typeof window === 'undefined') {
            return initialData;
        }
        try {
            const storedData = window.localStorage.getItem(this.storageKey);
            return storedData ? JSON.parse(storedData) : initialData;
        } catch (error) {
            console.error("Error loading data from localStorage:", error);
            return initialData;
        }
    };
    
    private saveToLocalStorage = () => {
        try {
            const dataToStore = JSON.stringify(this.db);
            window.localStorage.setItem(this.storageKey, dataToStore);
        } catch (error) {
            console.error("Error saving data to localStorage:", error);
        }
    };

    // --- Public Data Access / Mutation API ---

    public getCollection<T>(collectionName: CollectionName): T[] {
        return (this.db[collectionName] as T[]) || [];
    }

    public getDoc<T>(collectionName: CollectionName, id: string): T | undefined {
        return this.getCollection<T & { id: string }>(collectionName).find(item => item.id === id);
    }
    
    public addDoc<T>(collectionName: CollectionName, data: Omit<T, 'id' | 'createdAt'>): T {
        const newItem = {
            ...data,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
        } as T;
        (this.db[collectionName] as T[]).push(newItem);
        this.notify();
        return newItem;
    }

    public updateDoc<T extends { id: string }>(collectionName: CollectionName, updatedData: Partial<T> & { id: string }): T | undefined {
        const collection = this.getCollection<T>(collectionName);
        const itemIndex = collection.findIndex(item => item.id === updatedData.id);
        if (itemIndex > -1) {
            const updatedItem = { ...collection[itemIndex], ...updatedData };
            collection[itemIndex] = updatedItem;
            this.notify();
            return updatedItem;
        }
        return undefined;
    }
    
    public setDoc<T extends { id: string }>(collectionName: CollectionName, data: T): T {
        const collection = this.getCollection<T>(collectionName);
        const itemIndex = collection.findIndex(item => item.id === data.id);
        if (itemIndex > -1) {
            // Update existing
            collection[itemIndex] = data;
        } else {
            // Add new
            collection.push(data);
        }
        this.notify();
        return data;
    }

    public deleteDoc(collectionName: CollectionName, id: string): void {
        const collection = this.db[collectionName];
        const initialLength = collection.length;
        this.db[collectionName] = collection.filter((item: any) => item.id !== id);
        if (this.db[collectionName].length < initialLength) {
            this.notify();
        }
    }
    
    public runTransaction = <T>(updateFunction: (db: DB) => T): T => {
        // Create a deep copy of the database to pass to the transaction
        const dbCopy = JSON.parse(JSON.stringify(this.db));
        
        try {
            // Run the user's update function on the copy
            const result = updateFunction(dbCopy);

            // If the function completes without error, update the main database state
            this.db = dbCopy;
            this.notify();
            return result;
        } catch (error) {
            // If an error occurs, discard the changes and re-throw
            console.error("Transaction failed:", error);
            throw error;
        }
    };
    
     public exportData = (): string => {
        return JSON.stringify(this.db, null, 2);
    };

    public importData = (jsonData: string): { success: boolean; error?: any } => {
        try {
            const parsedData = JSON.parse(jsonData);
            // Basic validation
            if (typeof parsedData !== 'object' || Array.isArray(parsedData)) {
                throw new Error("Invalid backup format: not an object.");
            }
            // You might want to add more thorough validation here
            this.db = parsedData;
            this.notify();
            return { success: true };
        } catch (error) {
            console.error("Error importing data:", error);
            return { success: false, error };
        }
    };

    public resetData = () => {
        this.db = initialData;
        this.notify();
    };
}


// Singleton pattern to ensure only one instance of DataService exists
export function getDataService(): DataService {
    if (typeof window === 'undefined') {
        // On the server, return a dummy service that does nothing.
        return new DataService();
    }
    if (!store) {
        store = new DataService();
    }
    return store;
}
