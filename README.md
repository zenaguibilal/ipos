# iPOS - Point de Vente 100% Hors Ligne

**iPOS** est un système de Point de Vente (POS) moderne, conçu pour une gestion agile et entièrement autonome des petits commerces. Cette version est une application **100% hors ligne** qui s'appuie exclusivement sur la base de données IndexedDB de votre navigateur pour la persistance des données.

Elle offre une expérience utilisateur rapide, réactive et fonctionnelle qui ne nécessite aucune connexion internet. L'application centralise les opérations critiques de vente, de gestion des stocks et de suivi des clients dans une interface intuitive unique.

**IMPORTANT : Ceci est une application locale et hors ligne. Toutes vos données sont stockées exclusivement dans votre navigateur sur cet appareil. Il n'y a pas de synchronisation cloud ni de compte utilisateur.**

## Caractéristiques Principales

- **Gestion des Ventes :** Interface de caisse rapide avec gestion multi-paniers, recherche de produits et finalisation des transactions.
- **Gestion de l'Inventaire :** Suivi en temps réel des quantités de produits, gestion des prix d'achat/vente et alertes de stock bas.
- **Suivi des Clients et des Dettes :** Base de données clients avec historique des achats et un système de gestion de crédit qui calcule automatiquement les soldes impayés.
- **Réception de Stock :** Module pour enregistrer les livraisons des fournisseurs, mettre à jour l'inventaire et les prix d'achat.
- **Tableau de Bord Analytique :** Fournit des indicateurs de performance clés (chiffre d'affaires, bénéfice net, valeur du stock) et des visualisations.
- **Sauvegarde et Restauration :** Vous pouvez télécharger une sauvegarde complète des données de votre application sous forme de fichier JSON et la restaurer ultérieurement.

## Technologies Utilisées

- **Framework :** Next.js (React)
- **Stockage de Données :** IndexedDB (via Dexie.js)
- **Styling :** Tailwind CSS & ShadCN UI
- **PWA :** Conçu pour une installation sur ordinateur et mobile et une utilisation hors ligne.
