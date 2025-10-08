import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
// ✅ Import de Status pour la logique de statut
import { Reservation, Resource, Status, User } from '@prisma/client';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly dashboardUrl =
    'https://ng-resa-chap.vercel.app/reservations';

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
  // 1. Notification au Locateur : Nouvelle demande reçue
  // ----------------------------------------------------
  async sendNewRequestToLocateur(
    locateur: User,
    locataire: User,
    reservation: Reservation,
    resource: Resource,
  ) {
    const subject = `🔔 Nouvelle demande de réservation pour ${resource.name}`;
    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 40px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">
                      📬 Nouvelle Demande Reçue
                    </h1>
                    <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                      Une réservation attend votre validation
                    </p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                      Bonjour <strong>${locateur.firstName || locateur.email}</strong>,
                    </p>
                    
                    <p style="margin: 0 0 24px; color: #6b7280; font-size: 15px; line-height: 1.6;">
                      Un utilisateur a soumis une nouvelle demande de réservation pour votre ressource <strong style="color: #10b981;">${resource.name}</strong>. 
                      La demande est maintenant en attente de votre décision.
                    </p>

                    <!-- Info Card -->
                    <div style="background-color: #f9fafb; border-left: 4px solid #10b981; border-radius: 6px; padding: 24px; margin: 24px 0;">
                      <h2 style="margin: 0 0 16px; color: #111827; font-size: 16px; font-weight: 600;">
                        📋 Détails de la demande
                      </h2>
                      
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top; width: 140px;">
                            <strong>Ressource :</strong>
                          </td>
                          <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                            ${resource.name} <span style="color: #10b981; font-weight: 500;">(${resource.type})</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;">
                            <strong>Période :</strong>
                          </td>
                          <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                            Du ${reservation.dateDebut.toLocaleString('fr-FR')} <br>
                            au ${reservation.dateFin.toLocaleString('fr-FR')}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;">
                            <strong>Demandeur :</strong>
                          </td>
                          <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                            ${locataire.username || locataire.email}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;">
                            <strong>Statut :</strong>
                          </td>
                          <td style="padding: 8px 0;">
                            <span style="background-color: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                              En Attente
                            </span>
                          </td>
                        </tr>
                        ${
                          reservation.notes
                            ? `
                        <tr>
                          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;">
                            <strong>Notes :</strong>
                          </td>
                          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-style: italic;">
                            "${reservation.notes}"
                          </td>
                        </tr>
                        `
                            : ''
                        }
                      </table>
                    </div>

                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; margin: 32px 0;">
                      <tr>
                        <td style="text-align: center;">
                          <a href="${this.dashboardUrl}/received" 
                             style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); transition: all 0.2s;">
                            Gérer les Réservations →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 24px 0 0; color: #9ca3af; font-size: 13px; line-height: 1.6;">
                      💡 <em>Conseil : Répondez rapidement aux demandes pour offrir une meilleure expérience utilisateur.</em>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center; line-height: 1.6;">
                      Cet email a été envoyé par <strong style="color: #10b981;">ResaChap</strong><br>
                      Plateforme de gestion de réservations
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
    await this.sendMailTemplate(
      locateur.email,
      subject,
      html,
      'Locateur - Nouvelle demande',
    );
  }

  // ----------------------------------------------------
  // 2. Notification au Locataire : Demande prise en compte
  // ----------------------------------------------------
  async sendRequestConfirmationToLocataire(
    locataire: User,
    reservation: Reservation,
    resource: Resource,
  ) {
    const subject = `✅ Votre demande pour ${resource.name} est enregistrée`;
    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 40px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">
                      ✅ Demande Enregistrée
                    </h1>
                    <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                      Votre réservation est en cours de traitement
                    </p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                      Bonjour <strong>${locataire.firstName || locataire.email}</strong>,
                    </p>
                    
                    <p style="margin: 0 0 24px; color: #6b7280; font-size: 15px; line-height: 1.6;">
                      Votre demande de réservation pour <strong style="color: #10b981;">${resource.name}</strong> a bien été enregistrée ! 
                      Elle est maintenant en attente de validation par le propriétaire de la ressource.
                    </p>

                    <!-- Info Card -->
                    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 6px; padding: 24px; margin: 24px 0;">
                      <h2 style="margin: 0 0 16px; color: #065f46; font-size: 16px; font-weight: 600;">
                        📋 Récapitulatif de votre demande
                      </h2>
                      
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 8px 0; color: #047857; font-size: 14px; vertical-align: top; width: 120px;">
                            <strong>Ressource :</strong>
                          </td>
                          <td style="padding: 8px 0; color: #065f46; font-size: 14px;">
                            ${resource.name}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #047857; font-size: 14px; vertical-align: top;">
                            <strong>Période :</strong>
                          </td>
                          <td style="padding: 8px 0; color: #065f46; font-size: 14px;">
                            Du ${reservation.dateDebut.toLocaleString('fr-FR')} <br>
                            au ${reservation.dateFin.toLocaleString('fr-FR')}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #047857; font-size: 14px; vertical-align: top;">
                            <strong>Statut :</strong>
                          </td>
                          <td style="padding: 8px 0;">
                            <span style="background-color: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                              En Attente
                            </span>
                          </td>
                        </tr>
                      </table>
                    </div>

                    <!-- Next Steps -->
                    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 20px; margin: 24px 0;">
                      <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                        <strong>📬 Prochaines étapes :</strong><br>
                        Vous recevrez un email dès que le propriétaire aura traité votre demande (acceptation ou refus).
                      </p>
                    </div>

                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; margin: 32px 0;">
                      <tr>
                        <td style="text-align: center;">
                          <a href="${this.dashboardUrl}/made" 
                             style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                            Suivre Ma Réservation →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 24px 0 0; color: #9ca3af; font-size: 13px; line-height: 1.6; text-align: center;">
                      💡 <em>Vous pouvez consulter le statut de toutes vos réservations à tout moment depuis votre tableau de bord.</em>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center; line-height: 1.6;">
                      Cet email a été envoyé par <strong style="color: #10b981;">ResaChap</strong><br>
                      Plateforme de gestion de réservations
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
    await this.sendMailTemplate(
      locataire.email,
      subject,
      html,
      'Locataire - Confirmation de demande',
    );
  }

  // ----------------------------------------------------
  // 3. Notification au Locataire : Changement de statut (Accepté/Rejeté)
  // ----------------------------------------------------
  async sendStatusChangeToLocataire(
    locataire: User,
    reservation: Reservation,
    resource: Resource,
    newStatus: Status,
  ) {
    const isConfirmed = newStatus === Status.CONFIRMED;
    const color = isConfirmed ? '#10b981' : '#dc2626';
    const lightBg = isConfirmed ? '#f0fdf4' : '#fef2f2';
    const darkColor = isConfirmed ? '#065f46' : '#991b1b';
    const statusText = isConfirmed ? 'CONFIRMÉE' : 'REFUSÉE';
    const emoji = isConfirmed ? '✅' : '❌';
    const verb = isConfirmed ? 'acceptée' : 'refusée';
    const message = isConfirmed
      ? 'Bonne nouvelle ! Votre réservation a été acceptée par le propriétaire de la ressource.'
      : 'Malheureusement, votre demande de réservation a été refusée par le propriétaire.';

    const subject = `${emoji} Votre réservation a été ${verb} - ${resource.name}`;
    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); padding: 32px 40px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">
                      ${emoji} Réservation ${statusText}
                    </h1>
                    <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                      Mise à jour du statut de votre demande
                    </p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                      Bonjour <strong>${locataire.firstName || locataire.email}</strong>,
                    </p>
                    
                    <p style="margin: 0 0 24px; color: #6b7280; font-size: 15px; line-height: 1.6;">
                      ${message}
                    </p>

                    <!-- Info Card -->
                    <div style="background-color: ${lightBg}; border-left: 4px solid ${color}; border-radius: 6px; padding: 24px; margin: 24px 0;">
                      <h2 style="margin: 0 0 16px; color: ${darkColor}; font-size: 16px; font-weight: 600;">
                        📋 Détails de la réservation
                      </h2>
                      
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 8px 0; color: ${darkColor}; font-size: 14px; vertical-align: top; width: 120px;">
                            <strong>Ressource :</strong>
                          </td>
                          <td style="padding: 8px 0; color: ${darkColor}; font-size: 14px;">
                            ${resource.name}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: ${darkColor}; font-size: 14px; vertical-align: top;">
                            <strong>Période :</strong>
                          </td>
                          <td style="padding: 8px 0; color: ${darkColor}; font-size: 14px;">
                            Du ${reservation.dateDebut.toLocaleString('fr-FR')} <br>
                            au ${reservation.dateFin.toLocaleString('fr-FR')}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: ${darkColor}; font-size: 14px; vertical-align: top;">
                            <strong>Nouveau Statut :</strong>
                          </td>
                          <td style="padding: 8px 0;">
                            <span style="background-color: ${color}; color: #ffffff; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                              ${statusText}
                            </span>
                          </td>
                        </tr>
                      </table>
                    </div>

                    ${
                      isConfirmed
                        ? `
                    <!-- Success Message -->
                    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 20px; margin: 24px 0;">
                      <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                        <strong>🎉 Félicitations !</strong><br>
                        Vous pouvez maintenant utiliser cette ressource pour la période réservée. N'oubliez pas de respecter les règles d'utilisation.
                      </p>
                    </div>
                    `
                        : `
                    <!-- Rejected Message -->
                    <div style="background-color: #fff7ed; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 20px; margin: 24px 0;">
                      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                        <strong>💡 Suggestion :</strong><br>
                        Vous pouvez essayer de réserver une autre période ou explorer d'autres ressources disponibles dans notre catalogue.
                      </p>
                    </div>
                    `
                    }

                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; margin: 32px 0;">
                      <tr>
                        <td style="text-align: center;">
                          <a href="${this.dashboardUrl}/made" 
                             style="display: inline-block; background-color: ${color}; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px ${color}44;">
                            Voir Mes Réservations →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center; line-height: 1.6;">
                      Cet email a été envoyé par <strong style="color: #10b981;">ResaChap</strong><br>
                      Plateforme de gestion de réservations
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
    await this.sendMailTemplate(
      locataire.email,
      subject,
      html,
      'Locataire - Changement de statut',
    );
  }

  // ----------------------------------------------------
  // 4. Notification au Locateur : Annulation par le locataire
  // ----------------------------------------------------
  async sendCancellationToLocateur(
    locateur: User,
    locataire: User,
    reservation: Reservation,
    resource: Resource,
  ) {
    const subject = `❌ Annulation de réservation - ${resource.name}`;
    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 32px 40px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">
                      ❌ Réservation Annulée
                    </h1>
                    <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                      Une réservation a été annulée par l'utilisateur
                    </p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                      Bonjour <strong>${locateur.firstName || locateur.email}</strong>,
                    </p>
                    
                    <p style="margin: 0 0 24px; color: #6b7280; font-size: 15px; line-height: 1.6;">
                      L'utilisateur <strong style="color: #6b7280;">${locataire.username || locataire.email}</strong> a annulé sa réservation pour votre ressource <strong style="color: #6b7280;">${resource.name}</strong>.
                    </p>

                    <!-- Info Card -->
                    <div style="background-color: #f9fafb; border-left: 4px solid #6b7280; border-radius: 6px; padding: 24px; margin: 24px 0;">
                      <h2 style="margin: 0 0 16px; color: #111827; font-size: 16px; font-weight: 600;">
                        📋 Détails de la réservation annulée
                      </h2>
                      
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top; width: 140px;">
                            <strong>Ressource :</strong>
                          </td>
                          <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                            ${resource.name}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;">
                            <strong>Période libérée :</strong>
                          </td>
                          <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                            Du ${reservation.dateDebut.toLocaleString('fr-FR')} <br>
                            au ${reservation.dateFin.toLocaleString('fr-FR')}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;">
                            <strong>Annulé par :</strong>
                          </td>
                          <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                            ${locataire.username || locataire.email}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;">
                            <strong>Statut actuel :</strong>
                          </td>
                          <td style="padding: 8px 0;">
                            <span style="background-color: #f3f4f6; color: #4b5563; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                              Annulée
                            </span>
                          </td>
                        </tr>
                      </table>
                    </div>

                    <!-- Info Message -->
                    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 20px; margin: 24px 0;">
                      <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                        <strong>✅ Bonne nouvelle !</strong><br>
                        Cette période est désormais de nouveau disponible dans votre système. D'autres utilisateurs peuvent maintenant la réserver.
                      </p>
                    </div>

                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; margin: 32px 0;">
                      <tr>
                        <td style="text-align: center;">
                          <a href="${this.dashboardUrl}/received" 
                             style="display: inline-block; background-color: #6b7280; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);">
                            Voir Mes Réservations →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 24px 0 0; color: #9ca3af; font-size: 13px; line-height: 1.6; text-align: center;">
                      💡 <em>Cette annulation ne nécessite aucune action de votre part.</em>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center; line-height: 1.6;">
                      Cet email a été envoyé par <strong style="color: #10b981;">ResaChap</strong><br>
                      Plateforme de gestion de réservations
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
    await this.sendMailTemplate(
      locateur.email,
      subject,
      html,
      'Locateur - Annulation reçue',
    );
  }
}
