import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
// ✅ Import de Status pour la logique de statut
import { Reservation, Resource, User, Status } from '@prisma/client';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  // ⚠️ Remplacez par l'URL réelle de votre dashboard Angular (à définir)
  private readonly dashboardUrl =
    'http://localhost:4200/reservations';

  constructor(private mailerService: MailerService) {}

  // Méthode générique d'envoi
  private async sendMailTemplate(
    to: string,
    subject: string,
    html: string,
    context: string,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        html,
      });
      this.logger.log(`Email '${subject}' envoyé à ${to} (${context})`);
    } catch (error) {
      this.logger.error(
        `Échec de l'envoi de l'email à ${to} (${context}):`,
        error.stack,
      );
    }
  }

  // ----------------------------------------------------
  // 1. Notification au Locateur : Nouvelle demande reçue (MÉTHODE EXISTANTE)
  // ----------------------------------------------------
  async sendNewRequestToLocateur(
    locateur: User,
    locataire: User,
    reservation: Reservation,
    resource: Resource,
  ) {
    const subject = `🔔 Nouvelle demande de réservation pour ${resource.name}`;
    const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
              <h1 style="color: #007bff;">Demande de Réservation Reçue !</h1>
              <p>Bonjour ${locateur.firstName || locateur.email},</p>
              <p>Un Locataire a soumis une nouvelle demande pour votre ressource : <b>${resource.name}</b>. Elle est en attente de votre décision.</p>
              
              <h2 style="border-bottom: 1px solid #eee; padding-bottom: 5px;">Détails :</h2>
              <ul style="list-style: none; padding: 0;">
                <li>**Ressource :** ${resource.name} (${resource.type})</li>
                <li>**Période :** Du ${reservation.dateDebut.toLocaleString()} au ${reservation.dateFin.toLocaleString()}</li>
                <li>**Demandeur :** ${locataire.username || locataire.email}</li>
                <li>**Statut actuel :** PENDING</li>
                <li>**Notes :** ${reservation.notes || 'Aucune note fournie.'}</li>
              </ul>
              
              <p style="margin-top: 20px;">Veuillez vous connecter à votre tableau de bord pour accepter ou annuler la demande :</p>
              <a href="${this.dashboardUrl}/received" style="display: inline-block; background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Gérer les Réservations</a>
            </div>
        `;
    await this.sendMailTemplate(
      locateur.email,
      subject,
      html,
      'Locateur - Nouvelle demande',
    );
  }

  // ----------------------------------------------------
  // 2. ✅ NOUVEAU: Notification au Locataire : Demande prise en compte
  // ----------------------------------------------------
  async sendRequestConfirmationToLocataire(
    locataire: User,
    reservation: Reservation,
    resource: Resource,
  ) {
    const subject = `✅ Demande enregistrée pour ${resource.name}`;
    const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
              <h1 style="color: #17a2b8;">Demande Reçue !</h1>
              <p>Bonjour ${locataire.firstName || locataire.email},</p>
              <p>Votre demande de réservation pour la ressource <b>${resource.name}</b> a bien été enregistrée et est maintenant en attente de traitement par le propriétaire.</p>
              
              <h2 style="border-bottom: 1px solid #eee; padding-bottom: 5px;">Détails :</h2>
              <ul style="list-style: none; padding: 0;">
                <li>**Ressource :** ${resource.name}</li>
                <li>**Période :** Du ${reservation.dateDebut.toLocaleString()} au ${reservation.dateFin.toLocaleString()}</li>
                <li>**Statut :** En Attente (PENDING)</li>
              </ul>

              <p style="margin-top: 20px;">Nous vous enverrons une nouvelle notification dès que le statut changera. Vous pouvez également suivre l'état ici :</p>
              <a href="${this.dashboardUrl}/made" style="display: inline-block; background-color: #17a2b8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Voir Mes Réservations</a>
            </div>
        `;
    await this.sendMailTemplate(
      locataire.email,
      subject,
      html,
      'Locataire - Confirmation de demande',
    );
  }

  // ----------------------------------------------------
  // 3. ✅ NOUVEAU: Notification au Locataire : Changement de statut (Accepté/Rejeté)
  // ----------------------------------------------------
  async sendStatusChangeToLocataire(
    locataire: User,
    reservation: Reservation,
    resource: Resource,
    newStatus: Status,
  ) {
    const isConfirmed = newStatus === Status.CONFIRMED;
    const color = isConfirmed ? '#28a745' : '#dc3545';
    const statusText = isConfirmed ? 'CONFIRMÉE' : 'REJETÉE';
    const verb = isConfirmed ? 'a été acceptée' : 'a été refusée';

    const subject = `🔔 Votre réservation ${verb} pour ${resource.name}`;
    const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
              <h1 style="color: ${color};">Réservation ${statusText} !</h1>
              <p>Bonjour ${locataire.firstName || locataire.email},</p>
              <p>Le statut de votre réservation pour la ressource <b>${resource.name}</b> vient de changer.</p>
              
              <h2 style="border-bottom: 1px solid #eee; padding-bottom: 5px;">Détails :</h2>
              <ul style="list-style: none; padding: 0;">
                <li>**Ressource :** ${resource.name}</li>
                <li>**Période :** Du ${reservation.dateDebut.toLocaleString()} au ${reservation.dateFin.toLocaleString()}</li>
                <li>**Nouveau Statut :** <strong style="color: ${color};">${statusText}</strong></li>
              </ul>

              <p style="margin-top: 20px;">Accédez à votre tableau de bord pour plus de détails :</p>
              <a href="${this.dashboardUrl}/made" style="display: inline-block; background-color: ${color}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Voir Mes Réservations</a>
            </div>
        `;
    await this.sendMailTemplate(
      locataire.email,
      subject,
      html,
      'Locataire - Changement de statut',
    );
  }

  // ----------------------------------------------------
  // 4. ✅ NOUVEAU: Notification au Locateur : Annulation par le locataire
  // ----------------------------------------------------
  async sendCancellationToLocateur(
    locateur: User,
    locataire: User,
    reservation: Reservation,
    resource: Resource,
  ) {
    const subject = `❌ Annulation reçue pour ${resource.name}`;
    const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
              <h1 style="color: #dc3545;">Réservation Annulée !</h1>
              <p>Bonjour ${locateur.firstName || locateur.email},</p>
              <p>Le Locataire <b>${locataire.username || locataire.email}</b> a annulé la réservation suivante pour votre ressource : <b>${resource.name}</b>.</p>
              
              <h2 style="border-bottom: 1px solid #eee; padding-bottom: 5px;">Détails :</h2>
              <ul style="list-style: none; padding: 0;">
                <li>**Ressource :** ${resource.name}</li>
                <li>**Période :** Du ${reservation.dateDebut.toLocaleString()} au ${reservation.dateFin.toLocaleString()}</li>
                <li>**Statut actuel :** CANCELED</li>
              </ul>
              <p style="margin-top: 20px;">La période est de nouveau disponible dans le système.</p>
            </div>
        `;
    await this.sendMailTemplate(
      locateur.email,
      subject,
      html,
      'Locateur - Annulation reçue',
    );
  }
}
