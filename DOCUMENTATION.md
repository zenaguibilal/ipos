# iPOS - Intelligent Point of Sale

**iPOS** est une application de point de vente (POS) SaaS (Software as a Service) complète, conçue pour la vente au détail. Elle utilise Supabase comme backend, garantissant que vos données sont sécurisées, persistantes et accessibles de n'importe où. L'application est également une Progressive Web App (PWA), ce qui signifie qu'elle est installable, rapide et peut fonctionner hors ligne.

## 🚀 Pile Technique

*   **Framework :** Next.js avec App Router
*   **Bibliothèque UI :** React
*   **Composants :** ShadCN UI
*   **Style :** Tailwind CSS
*   **Backend & Base de Données :** Supabase (PostgreSQL, Auth, Storage)
*   **Gestion d'état :** Zustand
*   **Langage :** TypeScript
*   **PWA :** Service Worker pour la mise en cache et le support hors ligne.

## ✨ Fonctionnalités

L'application iPOS est dotée d'un ensemble riche de fonctionnalités pour répondre aux besoins de la plupart des commerces de détail.

### Gestion des Ventes (Caisse)
- Interface de vente rapide et intuitive, utilisable avec des raccourcis clavier (F1, F2, F9).
- Recherche de produits par nom ou code-barres.
- Ajout de produits personnalisés (non inventoriés) à la volée.
- Association des ventes à des clients existants ou à un "client de passage".
- Application de remises (fixes ou en pourcentage).
- Gestion des paiements (espèces, carte, crédit, mixte).

### Gestion des Produits
- CRUD complet pour les produits, sécurisé par rôle.
- Suivi des quantités en stock, prix d'achat et de vente.
- Définition de niveaux de stock minimum avec alertes visuelles.
- Gestion des codes-barres multiples.
- Organisation par catégories et par fournisseurs.
- Impression d'étiquettes avec codes-barres.
- Importation en masse de produits via un fichier CSV.

### Gestion des Clients
- CRUD complet pour les clients, sécurisé par rôle.
- Suivi détaillé des dettes et de l'historique des paiements.
- Définition de limites de crédit et de délais de paiement.
- Alertes visuelles pour les retards de paiement et les dépassements de limite.
- Consultation de l'historique complet d'activité d'un client (ventes, paiements, retours).
- Impression de relevés de compte détaillés.
- Importation en masse de clients via un fichier CSV.

### Gestion des Stocks
- Enregistrement des réceptions de stock (entrées de marchandises).
- Association des réceptions à des fournisseurs (existants ou nouveaux).
- Mise à jour automatique des quantités en stock.

### Retours et Annulations
- Enregistrement des retours de produits basés sur une vente existante.
- Option de réintégration des articles retournés au stock.
- Annulation complète des ventes avec restauration automatique du stock et des soldes clients.

### Finances et Rapports
- **Gestion des Dépenses :** Suivi et catégorisation de toutes les charges de l'entreprise.

### Commandes Spécifiques
- **Gestion du Pain :** Module dédié à la gestion des commandes de pain récurrentes (quotidiennes ou par jours spécifiques) ou manuelles, avec conversion facile en ventes.

### Administration et Données
- **Profil de l'Entreprise :** Personnalisation des informations de l'entreprise pour les reçus et documents.
- **Gestion des Rôles (RBAC) :** Différents niveaux d'accès (Admin, Manager, Caissier) pour sécuriser les fonctionnalités sensibles.
- **Sauvegarde et Restauration Cloud :** Exportation de l'intégralité de la base de données vers Supabase Storage et restauration à partir d'un fichier de sauvegarde en un clic.
