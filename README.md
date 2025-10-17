# ResaChap - API (NestJS)

[![NestJS](https://img.shields.io/badge/Framework-NestJS-red?logo=nestjs)](https://nestjs.com/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-336791?logo=postgresql)](https://www.postgresql.org/)
[![ORM](https://img.shields.io/badge/ORM-Prisma-0C344B?logo=prisma)](https://www.prisma.io/)
[![Serverless DB](https://img.shields.io/badge/CloudDB-Neon-5E35B1?logo=postgresql&logoColor=white)](https://neon.tech/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 💡 Description du Projet

Ce dépôt contient l'API RESTful de **ResaChap**, développée avec le framework **NestJS**. Elle sert de pont entre l'application Angular et la base de données PostgreSQL (hébergée sur Neon).

L'API gère toute la logique métier, de l'authentification à la gestion des ressources et des réservations.

## 🔑 Fonctionnalités et Modules Implémentés

- **Module Auth :** Gestion sécurisée de l'inscription, connexion, et authentification sociale (Google OAuth2).
- **Module Users :** Gestion des profils utilisateurs (rôles Locataire/Locateur).
- **API Sécurisée :** Utilisation des **Guards JWT** de NestJS pour protéger les endpoints nécessitant une authentification.
- **Gestion de Base de Données :** Utilisation de **Prisma** comme ORM pour interagir avec PostgreSQL, garantissant un typage strict et des requêtes optimisées.
- **Environnement Cloud :** Connexion à la base de données PostgreSQL via **Neon.tech**.

## 🛠️ Stack Technique Backend

| Catégorie            | Technologie           | Rôle                                                                 |
| :------------------- | :-------------------- | :------------------------------------------------------------------- |
| **Framework**        | **NestJS (Node.js)**  | Framework backend modulaire et évolutif.                             |
| **Base de Données**  | **PostgreSQL (Neon)** | Base de données relationnelle sécurisée et scalable.                 |
| **ORM**              | **Prisma**            | Couche d'abstraction pour le SGBD, offrant typage et migration.      |
| **Authentification** | **Passport.js & JWT** | Stratégies pour la gestion des tokens et l'authentification sociale. |
| **Langage**          | **TypeScript**        | Garantit la robustesse du code côté serveur.                         |

## 📦 Installation et Lancement

### Prérequis

- Node.js (v18+)
- Un compte et une base de données PostgreSQL sur **Neon.tech**.

### Étapes

1.  Clonez ce dépôt :
    ```bash
    git clone https://github.com/sly-codes/nest-resa-chap.git
    cd nest-resa-chap
    ```
2.  Installez les dépendances :
    ```bash
    npm install
    ```
3.  Configurez l'environnement :
    Créez un fichier `.env` à la racine et renseignez vos clés :

```.env

DATABASE_URL='postgresql://......................'

# brevo
BREVO_API_KEY=""

# GOOGLE
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/redirect

# GITHUB
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/redirect

CLIENT_URL=http://localhost:4200

JWT_AT_SECRET=""
JWT_RT_SECRET=""

PORT=3000

# CLOUDINARY
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

`4.  Mettez à jour la base de données via Prisma :
   `bash
npx prisma migrate dev --name init
`5.  Lancez le serveur en mode développement :
   `bash
npm run start:dev
```    L'API démarrera sur`http://localhost:3000/`. ````

## 📌 Modèle de Base de Données (Prisma Schema)

Le modèle de données initial inclut l'entité `User` et sera étendu pour inclure `Resource` et `Reservation`.
