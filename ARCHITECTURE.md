# iPOS - Local Storage Architecture

This document provides a detailed overview of the offline-first architecture of the iPOS application. It is designed to help understand the project structure, data flow, and key technical decisions after its refactoring away from Firebase to a purely local storage-based system.

## 1. Technology Overview

iPOS is built on a modern technology stack, chosen for its performance and development experience.

- **Core Framework:** [Next.js (App Router)](https://nextjs.org/) - A React framework used for its component-based architecture and file-based routing.
- **Data Storage:** **Browser's Local Storage** - All application data (products, sales, customers, etc.) is stored in a single JSON object within the browser's `localStorage`. This ensures data persistence across page reloads and browser sessions on a single device.
- **Data Access Layer:** A custom `DataService` (`src/services/data-service.ts`) abstracts all interactions with `localStorage`. It provides CRUD-like methods (`getAll`, `getById`, `save`, `remove`) and a subscription model to notify the UI of changes.
- **State Management & UI Updates:** Reactivity is achieved using React's `useSyncExternalStore` hook. Custom hooks like `useData` and `useCollection` subscribe to the `DataService` and trigger re-renders when data is modified, simulating the real-time feel of the previous architecture.
- **User Interface (UI):**
  - **[ShadCN UI](https://ui.shadcn.com/)**: A collection of reusable UI components.
  - **[Tailwind CSS](https://tailwindcss.com/)**: A utility-first CSS framework for rapid custom designs.
- **Deployment & PWA:** Designed to be deployed on static hosting platforms (like Vercel or Netlify) and configured as a Progressive Web App (PWA) for desktop/mobile installation and 100% offline functionality.

---

## 2. Project Structure

The file structure is organized to separate concerns clearly.

```
/
├── public/                 # Static files (icons, manifest.json)
├── src/
│   ├── app/                # Application routes (Next.js App Router)
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── sell/
│   │   ├── ... (other routes)
│   │   └── layout.tsx      # Root layout of the application
│   │
│   ├── components/         # Reusable React components
│   │   ├── ui/             # Base UI components (Button, Card, etc.)
│   │   ├── layout/         # Layout components (Header, Sidebar)
│   │   └── ... (feature-specific components)
│   │
│   ├── context/            # React Context providers
│   │   └── DataProvider.tsx# Provides the DataService instance to the app
│   │
│   ├── hooks/              # Custom React hooks
│   │   ├── useData.ts      # Hook to access the DataService and its methods
│   │   └── useCarts.ts     # Logic for managing multiple shopping carts (also uses localStorage)
│   │
│   ├── services/           # Core application services
│   │   └── data-service.ts # The heart of the local data persistence logic
│   │
│   └── lib/                # Utility functions, types, etc.
│       ├── types.ts        # TypeScript definitions for data structures
│       └── utils.ts        # Helper functions
│
└── ... (configuration files)
```

---

## 3. Data Management (Local Storage)

This is the core of the offline architecture.

1.  **`DataService` (`src/services/data-service.ts`):**
    - **Single Source of Truth:** Manages all application data under a single key in `localStorage` (e.g., `iPOS_data`).
    - **In-Memory Cache:** On initialization, it loads the entire dataset from `localStorage` into an in-memory object for fast access.
    - **CRUD Operations:** Provides methods like `getAll`, `getById`, `save`, and `remove`.
    - **"Transactions":** The `runTransaction` method simulates a database transaction by operating on the in-memory cache and then writing the entire state back to `localStorage` atomically. This is crucial for operations like finalizing a sale, where multiple data points (stock and sales records) must be updated together.
    - **Subscription Model:** Implements a simple pub/sub pattern (`subscribe`, `notify`) that allows UI components to be notified of any data changes.

2.  **`DataProvider.tsx` & `useData()`:**
    - The `DataProvider` creates a single instance of the `DataService`.
    - Components use the `useData()` hook to get access to this service instance.
    - To react to data changes, components use the `useSyncExternalStore` hook, which connects React's lifecycle to the `DataService`'s subscription model. This is the modern and correct way to integrate an external, mutable data source with React.

3.  **Data Flow Example (Products Page):**
    - The `ProductsPage` component calls `useData()`.
    - It uses `useSyncExternalStore` along with `dataService.getSnapshot()` and `dataService.subscribe` to get the latest list of products.
    - When a user adds a new product through `ProductDialog`, the dialog calls `dataService.save('products', newProduct)`.
    - The `save` method updates the in-memory cache, writes to `localStorage`, and then calls `notify()`.
    - The `notify()` call triggers the subscription in the `ProductsPage`, which causes `useSyncExternalStore` to re-run and get the new snapshot, leading to a UI update with the new product.

---

## 4. Key Feature Logic

### A. The Checkout (`/sell`)

- **Cart State:** The `useCarts` hook manages multiple shopping carts using a separate `localStorage` key. This is a temporary, session-based state.
- **Finalizing a Sale:**
    - The `handleFinalizeSale` function is the most critical operation.
    - It calls `dataService.runTransaction`.
    - Inside the transaction callback, it performs two main actions:
        1.  Decrements the stock for each product sold.
        2.  Creates a new sales record.
    - Because this happens within the `runTransaction` block, it's guaranteed that both operations succeed together, preventing data inconsistencies (e.g., selling a product without reducing its stock).

### B. Management Pages (Products, Customers)

These pages follow a similar pattern:
1.  **Display Data:** Use `useSyncExternalStore` to get and display lists of items.
2.  **Filtering and Searching:** Client-side filtering and searching is performed on the data array retrieved from the service using `React.useMemo`.
3.  **Creation/Modification:** Dialogs call `dataService.save()` to add or update items.

### C. Backup and Restore (`/profile`)

- **Backup:** The `handleBackup` function calls `dataService.exportData()`, which simply stringifies the entire in-memory database and triggers a file download.
- **Restore:** The `handleRestore` function reads a user-selected JSON file, then calls `dataService.importData()`. This method overwrites the entire in-memory database and `localStorage`, then triggers a `notify()` call to update the entire application UI. This is a destructive but effective way to manage data locally.

This architecture provides a robust, fast, and fully offline experience by treating the browser's local storage as the primary database.
