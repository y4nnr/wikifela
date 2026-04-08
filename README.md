# WIKIFELA

Encyclopedie collaborative et interactive dediee a l'emission **Faites entrer l'accuse**.

## Fonctionnalites (v1.1)

### Recherche

Recherche instantanee parmi 313 episodes avec correspondance partielle et stemming francais. Interface style terminal avec acces aleatoire a un episode.

### Fiches episodes

Page dediee pour chaque episode : resume Wikipedia, mots-cles, portrait de l'accuse, lieux associes avec lien vers la carte.

### Carte interactive

Plus de 700 lieux geolocalises affiches sur une carte Leaflet. Marqueurs codes par couleur selon le type d'evenement (crime, arrestation, proces). Filtres par departement, affaire, type de crime et periode.

### Quiz

150 questions sur les affaires avec 3 niveaux de difficulte (facile, moyen, difficile). Deux modes de jeu :
- **Classique** : nombre de questions au choix (3, 5 ou 10)
- **Survie** : serie illimitee, la partie s'arrete a la premiere erreur

### Tapissage

Jeu d'identification : retrouver l'accuse parmi 4 suspects a partir de son portrait. Lineups generes avec des suspects du meme genre. Memes modes classique et survie que le quiz.

### Classement (Survie)

Top 5 des meilleurs scores en mode survie pour le quiz (par difficulte) et le tapissage. Les joueurs qui se qualifient peuvent enregistrer un pseudo.

### Liste des episodes

Navigation par saison avec filtres par type de crime, departement et periode.

### Themes

Mode sombre (par defaut) et mode clair avec basculement instantane.

## Stack technique

- **Frontend** : Next.js 16 (App Router), Tailwind CSS, TypeScript
- **Base de donnees** : PostgreSQL avec recherche full-text (`tsvector` / `tsquery`, dictionnaire francais)
- **ORM** : Prisma
- **Carte** : Leaflet / React-Leaflet
- **Donnees** : Scraper Wikipedia automatise

## Demarrage

```bash
pnpm install
cp .env.example .env.local  # configurer DATABASE_URL
pnpm prisma migrate deploy
pnpm dev
```

## Licence

Projet fan-made non affilie a France Television.
