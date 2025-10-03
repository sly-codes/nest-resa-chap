import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { Reservation, Resource, User } from '@prisma/client';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private mailerService: MailerService) {}

  /**
   * Envoie une notification au Locateur lorsqu'une nouvelle demande arrive.
   * @param locateur Le propriétaire de la ressource.
   * @param locataire Le demandeur de la réservation.
   * @param reservation L'objet de la réservation.
   * @param resource L'objet de la ressource.
   */
  async sendReservationNotification(
    locateur: User,
    locataire: User,
    reservation: Reservation,
    resource: Resource,
  ) {
    // ⚠️ Remplacez par l'URL réelle de votre dashboard Angular (à définir)
    const dashboardUrl = 'http://localhost:4200/dashboard/reservations';

    try {
      await this.mailerService.sendMail({
        to: locateur.email, // Email du Locateur
        subject: `🔔 Nouvelle demande de réservation pour ${resource.name}`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
              <h1 style="color: #007bff;">Demande de Réservation Reçue !</h1>
              <p>Bonjour ${locateur.firstName || locateur.email},</p>
              <p>Un Locataire a soumis une nouvelle demande pour votre ressource : <b>${resource.name}</b>.</p>
              
              <h2 style="border-bottom: 1px solid #eee; padding-bottom: 5px;">Détails :</h2>
              <ul style="list-style: none; padding: 0;">
                <li>**Ressource :** ${resource.name} (${resource.type})</li>
                <li>**Période :** Du ${reservation.dateDebut.toLocaleString()} au ${reservation.dateFin.toLocaleString()}</li>
                <li>**Demandeur :** ${locataire.email} (ID: ${locataire.id})</li>
                <li>**Statut actuel :** PENDING</li>
                <li>**Notes :** ${reservation.notes || 'Aucune note fournie.'}</li>
              </ul>
              
              <p style="margin-top: 20px;">Veuillez vous connecter à votre tableau de bord pour accepter ou annuler la demande :</p>
              <a href="${dashboardUrl}" style="display: inline-block; background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Gérer les Réservations</a>
            </div>
          `,
      });
      this.logger.log(`Notification envoyée à ${locateur.email}`);
    } catch (error) {
      this.logger.error(
        `Échec de l'envoi de l'email à ${locateur.email}:`,
        error.stack,
      );
      // Ne pas throw l'erreur pour ne pas bloquer la création de la réservation
    }
  }
}
