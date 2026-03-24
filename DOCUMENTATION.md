# iPOS - Application de Point de Vente Complète

**iPOS** est une application de point de vente (POS) complète, fonctionnelle et conçue pour fonctionner entièrement hors ligne. Elle utilise la base de données IndexedDB de votre navigateur, via la bibliothèque Dexie.js, pour stocker toutes les données de manière sécurisée et rapide, garantissant un fonctionnement ininterrompu même sans connexion internet.

## 🚀 Pile Technique

*   **Framework :** Next.js avec App Router
*   **Bibliothèque UI :** React
*   **Composants :** ShadCN UI
*   **Style :** Tailwind CSS
*   **Base de Données Locale :** Dexie.js (wrapper pour IndexedDB)
*   **Langage :** TypeScript

## ✨ Fonctionnalités

L'application iPOS est dotée d'un ensemble riche de fonctionnalités pour répondre aux besoins de la plupart des commerces de détail.

### Gestion des Ventes (Caisse)
- Interface de vente rapide et intuitive.
- Gestion de plusieurs paniers simultanément.
- Recherche de produits par nom ou code-barres.
- Ajout de produits personnalisés (non inventoriés) à la volée.
- Association des ventes à des clients existants ou à un "client de passage".
- Application de remises (fixes ou en pourcentage).
- Gestion des paiements (espèces, carte, crédit, mixte).
- Sauvegarde et chargement de paniers sous forme de brouillons.
- Impression de reçus (format A4 ou thermique 80mm).

### Gestion des Produits
- CRUD complet pour les produits.
- Suivi des quantités en stock, prix d'achat et de vente.
- Définition de niveaux de stock minimum avec alertes visuelles.
- Gestion des codes-barres multiples.
- Organisation par catégories et par fournisseurs.
- Importation et exportation de la liste des produits via des fichiers CSV.
- Impression d'étiquettes avec codes-barres.

### Gestion des Clients
- CRUD complet pour les clients.
- Suivi détaillé des dettes et de l'historique des paiements.
- Définition de limites de crédit et de délais de paiement.
- Alertes visuelles pour les retards de paiement et les dépassements de limite.
- Consultation de l'historique complet d'activité d'un client.
- Impression de relevés de compte détaillés.
- Importation d'une liste de clients depuis un fichier CSV.

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
- **Calcul des Coûts :** Calcul du coût de revient final des produits en incluant les frais de transport par réception.
- **Calculateur de Zakat :** Outil d'aide au calcul de la Zakat commerciale basé sur la valeur du stock et les créances.

### Commandes Spécifiques
- **Gestion du Pain :** Module dédié à la gestion des commandes de pain récurrentes (quotidiennes ou par jours spécifiques) ou manuelles, avec conversion facile en ventes.

### Administration et Données
- **Profil de l'Entreprise :** Personnalisation des informations de l'entreprise pour les reçus et documents.
- **Sauvegarde et Restauration :** Exportation de l'intégralité de la base de données dans un fichier JSON et restauration à partir de celui-ci.
- **Réinitialisation des Données :** Option de suppression complète de toutes les données pour repartir de zéro.
