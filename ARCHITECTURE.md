# iPOS - Architecture 100% Hors Ligne

Ce document fournit un aperçu détaillé de l'architecture entièrement hors ligne de l'application iPOS. Il est conçu pour aider à comprendre la structure du projet, le flux de données et les décisions techniques clés après sa refactorisation vers un système basé sur IndexedDB.

## 1. Vue d'ensemble de la technologie

iPOS est construit sur une pile technologique moderne, choisie pour ses performances et son expérience de développement.

- **Framework principal :** [Next.js (App Router)](https://nextjs.org/) - Un framework React utilisé pour son architecture basée sur les composants et son routage basé sur les fichiers.
- **Stockage de données :** **IndexedDB du navigateur** (via [Dexie.js](https://dexie.org/)) - Toutes les données de l'application (produits, ventes, clients, etc.) sont stockées dans une base de données IndexedDB structurée. Cela garantit une persistance robuste des données, des requêtes complexes et des performances élevées, le tout localement sur l'appareil de l'utilisateur.
- **Couche d'accès aux données :**
    - **`database.ts`** (`src/lib/database.ts`) : Ce fichier définit le schéma de la base de données IndexedDB à l'aide de Dexie. Il liste toutes les tables (`products`, `sales`, etc.) et leurs index pour des recherches rapides.
    - **`data-service.ts`** (`src/services/data-service.ts`) : Un service qui fournit des méthodes asynchrones simples (`save`, `getAll`, `update`, etc.) pour abstraire les interactions avec la base de données Dexie.
- **Gestion de l'état et mises à jour de l'interface utilisateur :** La réactivité est obtenue à l'aide du hook **`useLiveQuery`** de `dexie-react-hooks`. Ce hook s'abonne aux requêtes de la base de données et déclenche automatiquement de nouveaux rendus des composants React lorsque les données sous-jacentes sont modifiées, simulant une sensation de temps réel sans serveur.
- **Interface Utilisateur (UI) :**
  - **[ShadCN UI](https://ui.shadcn.com/)**: Une collection de composants d'interface utilisateur réutilisables.
  - **[Tailwind CSS](https://tailwindcss.com/)**: Un framework CSS axé sur les utilitaires pour des conceptions personnalisées rapides.
- **Déploiement et PWA :** Conçu pour être déployé sur des plateformes d'hébergement statique (comme Vercel ou Netlify) et configuré comme une Progressive Web App (PWA) pour une installation sur ordinateur/mobile et une fonctionnalité 100% hors ligne.

---

## 2. Structure du Projet

La structure des fichiers est organisée pour séparer clairement les responsabilités.

```
/
├── public/                 # Fichiers statiques (icônes, manifest.json)
├── src/
│   ├── app/                # Routes de l'application (Next.js App Router)
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── sell/
│   │   ├── ... (autres routes)
│   │   └── layout.tsx      # Mise en page racine de l'application
│   │
│   ├── components/         # Composants React réutilisables
│   │   ├── ui/             # Composants d'interface de base (Button, Card, etc.)
│   │   └── ... (composants spécifiques aux fonctionnalités)
│   │
│   ├── hooks/              # Hooks React personnalisés
│   │   └── useCarts.ts     # Logique de gestion de plusieurs paniers (utilise l'état React)
│   │
│   ├── lib/                # Fonctions utilitaires, types, et config DB
│   │   ├── database.ts     # Définition du schéma de la base de données Dexie.js
│   │   └── types.ts        # Définitions TypeScript pour les structures de données
│   │
│   ├── services/           # Services principaux de l'application
│   │   └── data-service.ts # Le cœur de la logique de persistance des données locales
│
└── ... (fichiers de configuration)
```

---

## 3. Gestion des Données (IndexedDB avec Dexie.js)

C'est le cœur de l'architecture hors ligne.

1.  **`database.ts` (`src/lib/database.ts`):**
    - **Source de vérité unique :** Ce fichier initialise une instance de Dexie, définissant la base de données `posDB`.
    - **Schéma et Tables :** Il déclare toutes les tables de l'application (ex: `products`, `customers`).
    - **Indexation :** Des index sont définis sur les champs fréquemment interrogés (ex: `name` pour les produits, `customerId` pour les ventes) pour garantir des recherches et des filtrages rapides et performants, même avec de grands ensembles de données.
    - **Hooks de Cycle de Vie :** Des hooks `creating` et `updating` sont utilisés pour ajouter et mettre à jour automatiquement les champs `createdAt` et `updatedAt` sur chaque enregistrement.

2.  **`useLiveQuery` pour la lecture des données :**
    - Les composants React utilisent le hook `useLiveQuery` pour lire les données de manière réactive.
    - Exemple : `const products = useLiveQuery(() => db.products.toArray());`
    - `useLiveQuery` s'abonne à la base de données IndexedDB. Chaque fois qu'une modification (ajout, mise à jour, suppression) se produit dans la table `products`, le hook récupère automatiquement les données à jour et déclenche un nouveau rendu du composant. Cela élimine le besoin de gérer manuellement l'état et les rechargements.

3.  **`data-service.ts` pour l'écriture des données :**
    - Pour maintenir une séparation claire des préoccupations, toutes les opérations d'écriture (`save`, `update`, `remove`) sont centralisées dans le `data-service`.
    - Les composants appellent ces méthodes pour modifier les données. Par exemple, `dataService.save('products', newProduct)`.
    - Le service exécute l'opération Dexie correspondante (ex: `db.products.add(...)`).
    - Une fois l'écriture terminée, `useLiveQuery` dans les composants concernés détecte le changement et met à jour l'interface utilisateur automatiquement.

4.  **Exemple de flux de données (Page Produits) :**
    - Le composant `ProductsPage` utilise `useLiveQuery(() => db.products.toArray())` pour obtenir la liste des produits.
    - Lorsqu'un utilisateur ajoute un nouveau produit via `ProductDialog`, le dialogue appelle `dataService.save('products', newProduct)`.
    - `dataService` appelle `db.products.add(newProduct)`.
    - `useLiveQuery` dans `ProductsPage` est notifié du changement dans la table `products`, il ré-exécute la requête et fournit la nouvelle liste de produits au composant.
    - Le composant se met à jour pour afficher le nouveau produit.

---

## 4. Logique des fonctionnalités clés

### A. Point de Vente (Checkout) (`/sell`)

- **État du Panier :** Le hook `useCarts` gère plusieurs paniers en utilisant `React.useState`. L'état est temporaire et **non persistant** lors du rechargement de la page, conformément aux exigences.
- **Finalisation d'une Vente :**
    - La fonction `handleFinalizeSale` (via `dataService.addSale`) est l'opération la plus critique.
    - Elle appelle `db.transaction()`, une fonctionnalité puissante de Dexie.
    - À l'intérieur du bloc de transaction, elle effectue plusieurs actions principales de manière atomique :
        1.  Crée un nouvel enregistrement de vente dans la table `sales`.
        2.  Pour chaque article vendu, décrémente le stock dans la table `products`.
        3.  Crée un journal d'inventaire (`inventoryLogs`) pour chaque article.
        4.  Met à jour le solde impayé et le total dépensé du client dans la table `customers` si un client est associé.
    - L'utilisation d'une transaction garantit que toutes les opérations réussissent ou échouent ensemble, empêchant les incohérences de données (par exemple, vendre un produit sans réduire son stock).

### B. Gestion des Retours (`/returns`)

-   **Processus de Retour :** Permet d'enregistrer un retour basé sur une vente existante. L'utilisateur recherche une facture, sélectionne les articles à retourner et spécifie la quantité.
-   **Transaction Atomique (`dataService.addReturn`):**
    -   Crée un enregistrement `ProductReturn`.
    -   Si un article est marqué pour être réintégré, met à jour la quantité dans la table `products`.
    -   Crée un journal d'inventaire (`inventoryLogs`) avec la raison `return`.
    -   Ajuste le solde du client (`outstandingBalance`) en fonction de la valeur du retour et du montant remboursé.
-   **Annulation :** L'annulation d'un retour (`dataService.deleteReturn`) exécute une transaction inverse pour restaurer l'état précédent du stock et du solde client.

### C. Réception de Stock (`/stock/intake`)

Cette page est essentielle pour la gestion de l'inventaire en amont.

-   **Interface de Saisie :** L'utilisateur peut sélectionner un fournisseur existant ou en créer un nouveau, puis ajouter des produits existants ou créer des articles à la volée.
-   **Transaction Atomique de Sauvegarde (`dataService.addStockIntake`):**
    -   Utilise `db.transaction()` pour garantir la cohérence des données.
    -   À l'intérieur de la transaction :
        1.  Crée ou récupère un enregistrement de `suppliers`.
        2.  Crée un enregistrement `StockIntake` pour l'historique.
        3.  Pour chaque article **nouveau**, un nouvel enregistrement est créé dans la table `products`.
        4.  Pour chaque article, la quantité (`quantity`) et le prix d'achat (`purchasePrice`) sont mis à jour dans `products`.
        5.  Un enregistrement est ajouté dans `inventoryLogs` pour chaque produit, traçant l'augmentation du stock avec la raison `stock_intake`.

### D. Calcul des Coûts (`/costing`)

Cet outil d'analyse financière prolonge la fonctionnalité de réception de stock.

-   **Logique de Calcul :** Le système répartit des frais annexes (comme le transport) sur chaque article d'une réception, proportionnellement à sa valeur d'achat.
-   **Mise à Jour des Prix :** Une fonction `applyNewPurchasePrices` met à jour le champ `purchasePrice` de chaque produit concerné, garantissant que les futurs calculs de bénéfices seront basés sur le coût réel d'acquisition.

### E. Gestion des Commandes de Pain (`/bread`)

Un module spécialisé pour gérer les commandes récurrentes de pain.

-   **Tables dédiées :** Utilise les tables `clients_pain` et `commandes_pain` pour séparer cette logique.
-   **Génération Automatique :** La fonction `createDayOrders` s'exécute au chargement de la page pour un jour donné. Elle vérifie les clients actifs et leurs règles de récurrence (`quotidien` ou `jours_specifiques`) pour créer automatiquement les `BreadOrder` du jour s'ils n'existent pas.
-   **Conversion en Vente (`dataService.convertBreadOrdersToSales`):**
    -   C'est une transaction atomique qui prend un tableau d'IDs de `BreadOrder`.
    -   Pour chaque commande, elle crée une nouvelle `Sale`.
    -   Elle met à jour le `outstandingBalance` du client principal (s'il est lié) dans la table `customers`.
    -   Elle marque la `BreadOrder` comme payée (`est_paye: true`) et y associe l'ID de la nouvelle vente (`vente_id`).

### F. Sauvegarde et Restauration (`/profile`)

- **Sauvegarde :** La fonction `handleBackup` (via `dataService.exportData`) récupère toutes les données de toutes les tables Dexie, les transforme en une chaîne JSON et déclenche le téléchargement d'un fichier.
- **Restauration :** La fonction `handleRestore` (via `BackupPreview` et `dataService.restoreTables`) lit un fichier JSON, permet à l'utilisateur de prévisualiser et sélectionner les tables à restaurer, puis vide complètement ces tables et insère en masse les données du fichier de sauvegarde.

Cette architecture offre une expérience robuste, rapide et entièrement hors ligne en traitant la base de données IndexedDB du navigateur comme la base de données principale.
