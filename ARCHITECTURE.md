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
    - La fonction `handleFinalizeSale` est l'opération la plus critique.
    - Elle appelle `db.transaction()`, une fonctionnalité puissante de Dexie.
    - À l'intérieur du bloc de transaction, elle effectue deux actions principales de manière atomique :
        1.  Décrémente le stock pour chaque produit vendu.
        2.  Crée un nouvel enregistrement de vente.
    - L'utilisation d'une transaction garantit que les deux opérations réussissent ensemble ou échouent ensemble. Cela empêche les incohérences de données (par exemple, vendre un produit sans réduire son stock).

### B. Réception de Stock (`/stock/intake`)

Cette page est essentielle pour la gestion de l'inventaire en amont. Elle permet d'enregistrer de manière structurée l'arrivée de nouvelles marchandises provenant des fournisseurs.

-   **Interface de Saisie :** L'utilisateur commence par saisir les informations de base de la réception : le nom du fournisseur, le numéro de la facture ou du bon de livraison, et la date.
-   **Ajout d'Articles :**
    -   Un champ de recherche intelligent (`Combobox`) permet de trouver rapidement des produits existants par nom ou code-barres.
    -   Si un produit n'est pas trouvé, l'interface offre la possibilité de le **créer à la volée** en saisissant simplement son nom. Ce nouveau produit est marqué comme `isNew: true`.
    -   Pour chaque article (existant ou nouveau), l'utilisateur saisit la quantité reçue et le **prix d'achat unitaire**. Pour les nouveaux produits, le prix de vente est également requis.
-   **Transaction Atomique de Sauvegarde :**
    -   La fonction `addStockIntake` dans `data-service.ts` orchestre l'opération.
    -   Elle utilise une transaction Dexie (`db.transaction()`) pour garantir que toutes les opérations suivantes réussissent ou échouent ensemble.
    -   À l'intérieur de la transaction :
        1.  Un enregistrement `StockIntake` est créé pour l'historique.
        2.  Pour chaque article **nouveau** (`isNew: true`), un nouvel enregistrement est créé dans la table `products`.
        3.  Pour chaque article **existant**, la quantité (`quantity`) et le prix d'achat (`purchasePrice`) sont mis à jour dans la table `products`.
        4.  Un enregistrement est ajouté dans la table `inventoryLogs` pour chaque produit affecté, traçant l'augmentation du stock avec la raison `stock_intake`.

Ce processus robuste garantit que l'inventaire est toujours à jour et que chaque entrée de stock est traçable.

### C. Calcul des Coûts (`/costing`)

Cette page est un outil d'analyse financière qui prolonge la fonctionnalité de réception de stock. Elle permet de calculer le **coût de revient unitaire final** d'un produit en y répartissant des frais annexes, comme le transport.

-   **Sélection de la Réception :** L'utilisateur sélectionne une réception de stock existante.
-   **Saisie des Frais :** Il saisit ensuite le coût total du transport associé à cette réception.
-   **Calcul Automatique :**
    -   Le système calcule la **part des frais de transport** à allouer à chaque article, proportionnellement à sa valeur d'achat par rapport à la valeur totale de la réception.
        - `Part du transport pour l'article = (Coût total transport * Valeur de l'article) / Valeur totale de la réception`
    -   Il calcule ensuite le **coût final unitaire** pour chaque produit :
        - `Coût final unitaire = Prix d'achat unitaire + (Part du transport / Quantité)`
-   **Mise à Jour des Prix d'Achat :** L'utilisateur peut appliquer ces nouveaux coûts. Une fonction `applyNewPurchasePrices` met alors à jour le champ `purchasePrice` de chaque produit concerné dans la base de données. Cela garantit que les futurs calculs de bénéfices seront basés sur le coût réel d'acquisition.

### D. Sauvegarde et Restauration (`/profile`)

- **Sauvegarde :** La fonction `handleBackup` récupère toutes les données de toutes les tables Dexie, les transforme en une chaîne JSON et déclenche le téléchargement d'un fichier.
- **Restauration :** La fonction `handleRestore` lit un fichier JSON sélectionné par l'utilisateur, vide complètement toutes les tables de la base de données, puis insère en masse les données du fichier de sauvegarde. C'est une opération destructrice mais efficace pour la gestion des données locales.

Cette architecture offre une expérience robuste, rapide et entièrement hors ligne en traitant la base de données IndexedDB du navigateur comme la base de données principale.
