
# Architecture de l'Application iPOS

Ce document fournit une vue d'ensemble détaillée de l'architecture de l'application iPOS. Il est conçu pour aider à comprendre la structure du projet, le flux de données, et les décisions techniques clés.

## 1. Vue d'ensemble des Technologies

iPOS est construit sur une pile technologique moderne, choisie pour sa performance, sa fiabilité et son expérience de développement.

- **Framework Principal :** [Next.js (App Router)](https://nextjs.org/) - Un framework React qui permet le rendu côté serveur (SSR) et la génération de sites statiques (SSG). L'App Router est utilisé pour une organisation basée sur les fichiers et des fonctionnalités avancées comme les Server Components.
- **Base de Données & Authentification :** [Firebase](https://firebase.google.com/) - Une plateforme de développement d'applications de Google.
  - **Firestore :** Une base de données NoSQL, flexible et scalable, utilisée pour stocker toutes les données de l'application (produits, ventes, etc.). Sa capacité temps réel est essentielle pour la synchronisation des données.
  - **Firebase Authentication :** Gère l'inscription et la connexion des utilisateurs via e-mail/mot de passe et des fournisseurs tiers comme Google.
- **Interface Utilisateur (UI) :**
  - **[ShadCN UI](https://ui.shadcn.com/) :** Une collection de composants d'interface réutilisables, construits sur Radix UI et Tailwind CSS. Ils sont personnalisables et accessibles.
  - **[Tailwind CSS](https://tailwindcss.com/) :** Un framework CSS "utility-first" pour construire rapidement des designs personnalisés.
- **Gestion de l'État Côté Client :** Hooks React (`useState`, `useMemo`, `useCallback`) - Pour l'état local des composants. Des hooks personnalisés (ex: `useCarts`) sont utilisés pour une logique plus complexe et partagée côté client.
- **Déploiement & PWA :** Conçu pour être déployé sur des plateformes comme Vercel et configuré comme une Progressive Web App (PWA) pour une installation sur bureau/mobile et une utilisation hors ligne.

---

## 2. Structure du Projet (Étape 1 : Mise en Place)

La structure des fichiers est organisée pour séparer clairement les préoccupations.

```
/
├── public/               # Fichiers statiques (icônes, manifest.json)
├── src/
│   ├── app/              # Routes de l'application (Next.js App Router)
│   │   ├── (app)/        # Routes protégées nécessitant une connexion
│   │   │   ├── dashboard/
│   │   │   ├── products/
│   │   │   └── ... (autres routes)
│   │   ├── login/        # Page de connexion
│   │   ├── signup/       # Page d'inscription
│   │   ├── layout.tsx    # Layout racine de l'application
│   │   └── page.tsx      # Page d'accueil (landing page)
│   │
│   ├── components/       # Composants React réutilisables
│   │   ├── ui/           # Composants de base (Button, Card, etc. - ShadCN)
│   │   ├── auth/         # Formulaires de connexion, inscription
│   │   ├── layout/       # Composants de mise en page (Header, Sidebar)
│   │   └── products/     # Composants spécifiques aux produits (ProductCard, ProductDialog)
│   │
│   ├── firebase/         # Configuration et hooks Firebase
│   │   ├── config.ts     # Fichier de configuration Firebase
│   │   ├── provider.tsx  # Fournisseur de contexte Firebase (gère l'état d'authentification)
│   │   ├── index.ts      # Exporte les fonctions et hooks Firebase principaux
│   │   └── ...
│   │
│   ├── hooks/            # Hooks React personnalisés
│   │   ├── useCarts.ts   # Logique de gestion des paniers multiples
│   │   └── ...
│   │
│   └── lib/              # Fonctions utilitaires, types, etc.
│       ├── types.ts      # Définitions TypeScript pour les structures de données (Product, Sale, etc.)
│       └── utils.ts      # Fonctions d'aide (ex: formatage de devise)
│
└── ... (fichiers de configuration)
```

---

## 3. Authentification & Données Utilisateur (Étape 2 : Le Cœur)

C'est la base de la sécurité et de la personnalisation de l'application.

1.  **Mise en place de Firebase :**
    - Un projet Firebase est créé.
    - L'authentification par e-mail/mot de passe et Google est activée.
    - Firestore est initialisé avec des règles de sécurité.

2.  **Règles de Sécurité (`firestore.rules`) :**
    - La règle la plus importante est que **chaque utilisateur ne peut accéder qu'à ses propres données**.
    - Toutes les données d'un utilisateur sont stockées dans un chemin qui inclut son `userId` (ex: `/users/{userId}/products/{productId}`).
    - Les règles vérifient que l'`request.auth.uid` correspond au `userId` dans le chemin du document.

3.  **Flux de Connexion :**
    - L'utilisateur arrive sur `/login` ou `/signup`.
    - Le `FirebaseClientProvider` (`src/firebase/client-provider.tsx`) initialise Firebase de manière asynchrone et gère la persistance (connexion automatique).
    - Le `FirebaseProvider` (`src/firebase/provider.tsx`) écoute les changements d'état d'authentification (`onAuthStateChanged`).
    - Le hook `useUser()` (`src/firebase/provider.tsx`) fournit l'état de l'utilisateur (`user`, `isUserLoading`) à travers l'application.
    - Les layouts et les pages utilisent ce hook pour rediriger les utilisateurs non connectés ou afficher un état de chargement.

---

## 4. Gestion des Données (Firestore) (Étape 3 : La Logique Métier)

Comment l'application interagit-elle avec Firestore ?

1.  **Définition des Types :** Dans `src/lib/types.ts`, toutes les structures de données (interfaces `Product`, `Customer`, `Sale`, etc.) sont définies en TypeScript. Cela garantit la cohérence des données dans toute l'application.

2.  **Hooks de Données Temps Réel :**
    - `useCollection` et `useDoc` (`src/firebase/firestore/`) sont des hooks React personnalisés qui s'abonnent aux collections ou aux documents Firestore en temps réel en utilisant `onSnapshot`.
    - Ils gèrent automatiquement l'état de chargement, les erreurs et la mise à jour des données lorsque quelque chose change dans la base de données.
    - **Optimisation Cruciale :** Le hook `useMemoFirebase` est utilisé pour "stabiliser" les requêtes Firestore. Sans cela, les composants se re-renderisent en boucle, créant des coûts élevés et des bugs.

3.  **Exemple de flux de données (Page Produits) :**
    - La page `src/app/(app)/products/page.tsx` utilise `useUser()` pour obtenir l'ID de l'utilisateur.
    - Elle construit une requête Firestore pour récupérer les produits de cet utilisateur : `collection(firestore, 'users', user.uid, 'products')`.
    - Cette requête est passée au hook `useCollection`.
    - `useCollection` renvoie la liste des produits (`products`), un indicateur de chargement (`isLoadingProducts`).
    - La page utilise `products` pour afficher les `ProductCard`. Si un produit est modifié dans la base de données (par exemple, depuis un autre appareil), la liste se met à jour automatiquement.

4.  **Écriture des Données :**
    - Pour ajouter ou modifier des données, l'application utilise des fonctions "non bloquantes" (`setDocumentNonBlocking`, `addDocumentNonBlocking`) définies dans `src/firebase/non-blocking-updates.tsx`.
    - Ces fonctions utilisent les méthodes `setDoc` ou `addDoc` de Firebase sans `await`. Cela rend l'interface utilisateur instantanément réactive.
    - Elles incluent une gestion des erreurs qui propage les erreurs de permission via un `errorEmitter`, permettant un débogage plus facile.

---

## 5. Construction des Fonctionnalités Clés (Étape 4 : L'Interface)

### A. La Caisse (`/sell`)

C'est la partie la plus interactive de l'application.

- **État Côté Client :** La gestion des paniers multiples n'est PAS stockée dans Firestore, mais dans le `localStorage` du navigateur via le hook personnalisé `useCarts`. C'est un choix de conception délibéré pour la vitesse et pour éviter des écritures inutiles dans la base de données pour un état temporaire.
- **Composants :**
  - La page est divisée en une grille de produits (`SellProductCard`) et un panneau de panier.
  - Cliquer sur un `SellProductCard` appelle la fonction `handleAddToCart` qui met à jour l'état du panier via `useCarts`.
  - Le panneau du panier affiche les `CartItemCard` et le total.
  - Le dialogue de paiement (`PaymentDialog`) gère la saisie des montants payés.
- **Finalisation de la Vente :**
  - La fonction `handleFinalizeSale` exécute une **transaction Firestore**.
  - Une transaction garantit que toutes les opérations (mise à jour du stock des produits ET création du document de vente) réussissent ou échouent ensemble, ce qui empêche les incohérences de données (par exemple, vendre un produit sans décrémenter le stock).

### B. Pages de Gestion (Produits, Clients)

Ces pages suivent un modèle similaire :

1.  **Affichage des Données :** Utilisation de `useCollection` pour récupérer et afficher une liste de cartes (`ProductCard`, `CustomerCard`).
2.  **Filtrage et Recherche :** L'état (`useState`) est utilisé pour stocker la requête de recherche et les options de filtre. Le `localStorage` est utilisé pour mémoriser ces choix entre les visites.
3.  **Création/Modification :** Un dialogue (`ProductDialog`, `CustomerDialog`) est utilisé pour ajouter ou modifier des éléments. Ce dialogue appelle les fonctions d'écriture non bloquantes pour mettre à jour Firestore.
4.  **Suppression :** Un dialogue de confirmation (`DeleteProductDialog`) appelle la fonction `deleteDocumentNonBlocking`.

### C. Tableau de Bord (`/dashboard`)

- **Récupération de Données :** La page récupère plusieurs collections (ventes, retours, produits).
- **Calcul des Métriques :** Le hook `useMemo` est utilisé de manière intensive pour calculer les métriques (revenu net, produits les plus vendus, etc.) uniquement lorsque les données brutes changent. Cela évite des recalculs coûteux à chaque rendu.
- **Graphiques :** La bibliothèque `recharts` est utilisée pour visualiser les données calculées.
- **Sélecteur de Plage de Dates :** Le composant `DateRangePicker` contrôle l'état de la plage de dates, qui est ensuite utilisé pour filtrer les données dans le `useMemo`.

---

Ce guide architectural devrait vous donner une base solide pour comprendre comment iPOS est construit et comment vous pouvez l'étendre avec de nouvelles fonctionnalités.
