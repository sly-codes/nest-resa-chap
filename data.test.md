

---

## 1. Phase Préliminaire : Créer les Acteurs (Auth)

Nous avons besoin de deux utilisateurs : un Locateur (propriétaire de la ressource) et un Locataire (celui qui réserve).

### **Test 1.1 : Inscription du Locateur (Owner)**

| Méthode | URL | Body (JSON) | Attendu |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/local/signup` | `{"email": "locateur@test.com", "password": "password"}` | Réponse `201 Created` avec **`access_token`** et **`refresh_token`**. |

* **Action :** Récupérez et stockez le `access_token` du Locateur.

### **Test 1.2 : Inscription du Locataire (Renter)**

| Méthode | URL | Body (JSON) | Attendu |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/local/signup` | `{"email": "locataire@test.com", "password": "password"}` | Réponse `201 Created` avec **`access_token`** et **`refresh_token`**. |

* **Action :** Récupérez et stockez le `access_token` du Locataire.

---

## 2. Phase Ressource : Créer une Ressource (Locateur)

Le Locateur va créer une salle que le Locataire pourra réserver.

### **Test 2.1 : Création de la Ressource**

| Méthode | URL | Headers | Body (JSON) | Attendu |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/resources` | `Authorization: Bearer [Token du Locateur]` | `{"name": "Salle Alpha", "type": "ROOM", "description": "Grande salle de réunion"}` | Réponse `201 Created`. |

* **Action :** Récupérez et stockez l'`id` de la ressource créée (ex: `resourceId`).

---

## 3. Phase Réservation : Créer une Demande (Locataire)

Le Locataire utilise son token pour créer une demande sur la ressource du Locateur.

### **Test 3.1 : Création de la Réservation (Statut PENDING)**

Nous allons créer une réservation pour le 10/10/2025 de 14h00 à 16h00.

| Méthode | URL | Headers | Body (JSON) | Attendu |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/reservations` | `Authorization: Bearer [Token du Locataire]` | `{"resourceId": "[resourceId]", "dateDebut": "2025-10-10T14:00:00Z", "dateFin": "2025-10-10T16:00:00Z"}` | Réponse `201 Created`. Le Locateur devrait recevoir un email de notification. |

* **Action :** Récupérez et stockez l'`id` de la réservation créée (ex: `reservationId`).
* **Vérification :** **Vérifiez votre console** (ou votre boîte Ethereal) pour confirmer que le `MailService` a bien envoyé la notification à `locateur@test.com`.

### **Test 3.2 : Validation du Conflit d'Horaire (Optionnel)**

Le Locataire essaie de réserver la même ressource à la même heure.

| Méthode | URL | Headers | Body (JSON) | Attendu |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/reservations` | `Authorization: Bearer [Token du Locataire]` | `{"resourceId": "[resourceId]", "dateDebut": "2025-10-10T15:00:00Z", "dateFin": "2025-10-10T17:00:00Z"}` | Réponse **`400 Bad Request`** (Conflit horaire). |

---

## 4. Phase Gestion : Gérer les Réservations (Locateur)

Le Locateur va lister les demandes reçues, puis confirmer la réservation faite par le Locataire.

### **Test 4.1 : Lister les Réservations Reçues**

| Méthode | URL | Headers | Attendu |
| :--- | :--- | :--- | :--- |
| `GET` | `/reservations/received` | `Authorization: Bearer [Token du Locateur]` | Réponse `200 OK` contenant la réservation créée au Test 3.1, avec le statut `PENDING`. |

### **Test 4.2 : Confirmer la Réservation**

| Méthode | URL | Headers | Body (JSON) | Attendu |
| :--- | :--- | :--- | :--- | :--- |
| `PATCH` | `/reservations/[reservationId]/status` | `Authorization: Bearer [Token du Locateur]` | `{"status": "CONFIRMED"}` | Réponse `200 OK`. L'objet Réservation doit avoir le statut **`CONFIRMED`**. |

---

## 5. Phase Locataire : Vérifier le Statut

Le Locataire vérifie que sa réservation a bien été confirmée.

### **Test 5.1 : Lister Mes Réservations**

| Méthode | URL | Headers | Attendu |
| :--- | :--- | :--- | :--- |
| `GET` | `/reservations/made` | `Authorization: Bearer [Token du Locataire]` | Réponse `200 OK` contenant la réservation, avec le statut **`CONFIRMED`**. |

### **Test 5.2 : Annulation (Locataire) — Vérification de la Logique**

Comme la réservation est maintenant `CONFIRMED`, le Locataire ne devrait *pas* pouvoir l'annuler lui-même (seules les `PENDING` le peuvent dans notre logique).

| Méthode | URL | Headers | Attendu |
| :--- | :--- | :--- | :--- |
| `DELETE` | `/reservations/[reservationId]` | `Authorization: Bearer [Token du Locataire]` | Réponse **`400 Bad Request`** (Impossible d'annuler CONFIRMED). |


