import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
// Importez uniquement les types nécessaires
import { Reservation, Resource, Status, User } from '@prisma/client';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  // Déclarer la clé comme string stricte
  private readonly apiKey: string;
  // Adresse expéditrice unique vérifiée dans Brevo
  private readonly mailFromEmail: string = 'ik3576898@gmail.com';
  private readonly mailFromName: string = 'ResaChap';

  constructor(private readonly configService: ConfigService) {
    // ⬇️ CORRECTION TS :
    // Utiliser le ! pour affirmer à TypeScript que la valeur sera définie
    // ou fournir une valeur par défaut.

    // Pour une variable critique, il est préférable de vérifier et d'arrêter.
    const key = this.configService.get<string>('BREVO_API_KEY');

    if (!key) {
      this.logger.error(
        "La variable BREVO_API_KEY est manquante ou indéfinie. L'envoi de mail ne fonctionnera pas.",
      );
      // Vous pouvez choisir d'arrêter l'application ici si vous le jugez critique :
      // throw new Error('Configuration Mail critique manquante');
      this.apiKey = ''; // Assignation d'une chaîne vide pour éviter le TS2322 si vous ne voulez pas planter l'app.
    } else {
      this.apiKey = key; // Maintenant, TypeScript sait que c'est une string
    }

    // Log pour vérification rapide
    this.logger.log(`Brevo API Key Present: ${!!this.apiKey}`);
    this.logger.log(`Mail From: ${this.mailFromEmail}`);
  } // Méthode générique d'envoi

  private async sendMailTemplate(
    to: string,
    subject: string,
    html: string,
    context: string,
  ): Promise<void> {
   
    if (!this.apiKey) {
      this.logger.error(
        `Tentative d'envoi d'email à ${to} sans clé API Brevo configurée.`,
      );
      return;
    }

    try {
      // Corps de la requête API Brevo V3
      const payload = {
        sender: {
          email: this.mailFromEmail,
          name: this.mailFromName,
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html,
      };

      const response = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        payload,
        {
          headers: {
            'api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.status === 201 || response.status === 200) {
        this.logger.log(`Email (API) '${subject}' envoyé à ${to} (${context})`);
      } else {
        this.logger.error(
          `API Brevo a répondu avec statut ${response.status} pour ${to}:`,
          response.data,
        );
      }
    } catch (error) {
      this.logger.error(
        `Échec de l'envoi de l'email à ${to} (${context}):`,
        error.response?.data?.message || error.message || error.stack,
      );
    }
  }

  // ----------------------------------------------------
  // 2. Notification au nouvel Utilisateur : Bienvenue
  // ----------------------------------------------------

  /**
   * Envoie un e-mail de bienvenue après une nouvelle inscription.
   * @param user L'objet User qui vient d'être créé.
   */
  async sendWelcomeMail(user: User) {
    const firstName = user.firstName || user.email.split('@')[0];
    const subject = `🎉 Bienvenue chez ResaChap, ${firstName} !`;
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
                <td style="background: linear-gradient(135deg, #00add8 0%, #0099bf 100%); padding: 40px; text-align: center;">
                  <div style="width: 64px; height: 64px; background: rgba(255, 255, 255, 0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                    <span style="font-size: 32px;">🎉</span>
                  </div>
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                    Bienvenue sur ResaChap !
                  </h1>
                  <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                    Votre compte a été créé avec succès
                  </p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                    Bonjour <strong style="color: #00add8;">${firstName}</strong>,
                  </p>
                  
                  <p style="margin: 0 0 24px; color: #6b7280; font-size: 15px; line-height: 1.6;">
                    Nous sommes ravis de vous accueillir dans la communauté <strong>ResaChap</strong>. 
                    Votre plateforme de gestion de réservations est maintenant prête à être utilisée !
                  </p>

                  <!-- Feature Cards -->
                  <div style="background: #f0fdfa; border-left: 4px solid #00add8; border-radius: 6px; padding: 20px; margin: 24px 0;">
                    <h3 style="margin: 0 0 16px; color: #00add8; font-size: 16px; font-weight: 600;">
                      🚀 Que pouvez-vous faire maintenant ?
                    </h3>
                    <ul style="color: #047857; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                      <li style="margin-bottom: 8px;"><strong>Explorer le catalogue</strong> : Découvrez toutes les ressources disponibles (salles, équipements, véhicules)</li>
                      <li style="margin-bottom: 8px;"><strong>Réserver facilement</strong> : Soumettez vos demandes de réservation en quelques clics</li>
                      <li style="margin-bottom: 8px;"><strong>Partager vos ressources</strong> : Mettez vos propres espaces et équipements à disposition</li>
                      <li style="margin-bottom: 0;"><strong>Gérer en temps réel</strong> : Suivez toutes vos réservations depuis votre tableau de bord</li>
                    </ul>
                  </div>

                  <!-- Quick Start Steps -->
                  <div style="margin: 32px 0;">
                    <h3 style="margin: 0 0 20px; color: #111827; font-size: 18px; font-weight: 600;">
                      🎯 Pour bien démarrer :
                    </h3>
                    
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 16px; background: #f9fafb; border-radius: 8px; margin-bottom: 12px;">
                          <div style="display: flex; align-items: start; gap: 12px;">
                            <span style="display: inline-block; width: 32px; height: 32px; background: #00add8; color: white; border-radius: 50%; text-align: center; line-height: 32px; font-weight: 700; font-size: 14px; flex-shrink: 0;">1</span>
                            <div>
                              <strong style="display: block; color: #111827; font-size: 14px; margin-bottom: 4px;">Complétez votre profil</strong>
                              <span style="color: #6b7280; font-size: 13px;">Ajoutez vos informations personnelles pour faciliter les échanges</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr><td style="height: 12px;"></td></tr>
                      <tr>
                        <td style="padding: 16px; background: #f9fafb; border-radius: 8px; margin-bottom: 12px;">
                          <div style="display: flex; align-items: start; gap: 12px;">
                            <span style="display: inline-block; width: 32px; height: 32px; background: #00add8; color: white; border-radius: 50%; text-align: center; line-height: 32px; font-weight: 700; font-size: 14px; flex-shrink: 0;">2</span>
                            <div>
                              <strong style="display: block; color: #111827; font-size: 14px; margin-bottom: 4px;">Parcourez le catalogue</strong>
                              <span style="color: #6b7280; font-size: 13px;">Découvrez les ressources disponibles et leurs disponibilités</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr><td style="height: 12px;"></td></tr>
                      <tr>
                        <td style="padding: 16px; background: #f9fafb; border-radius: 8px;">
                          <div style="display: flex; align-items: start; gap: 12px;">
                            <span style="display: inline-block; width: 32px; height: 32px; background: #00add8; color: white; border-radius: 50%; text-align: center; line-height: 32px; font-weight: 700; font-size: 14px; flex-shrink: 0;">3</span>
                            <div>
                              <strong style="display: block; color: #111827; font-size: 14px; margin-bottom: 4px;">Faites votre première réservation</strong>
                              <span style="color: #6b7280; font-size: 13px;">Sélectionnez une ressource et soumettez votre demande</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- CTA Button -->
                  <table role="presentation" style="width: 100%; margin: 32px 0;">
                    <tr>
                      <td style="text-align: center;">
                        <a href="${this.configService.get<string>('CLIENT_URL')}/dashboard" 
                          style="display: inline-block; background-color: #00add8; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(0, 173, 216, 0.3);">
                          Accéder à mon Tableau de Bord →
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Help Section -->
                  <div style="background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 20px; margin: 32px 0 0;">
                    <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                      <strong>💡 Besoin d'aide ?</strong><br>
                      Notre équipe est là pour vous accompagner. N'hésitez pas à nous contacter si vous avez la moindre question.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 32px 40px; border-top: 1px solid #e5e7eb;">
                  <table role="presentation" style="width: 100%; margin-bottom: 16px;">
                    <tr>
                      <td style="text-align: center;">
                        <div style="display: inline-flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                          <span style="font-size: 24px;">📅</span>
                          <strong style="color: #00add8; font-size: 18px;">ResaChap</strong>
                        </div>
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 0 0 12px; color: #6b7280; font-size: 12px; text-align: center; line-height: 1.6;">
                    Gestion intelligente de ressources partagées
                  </p>
                  <p style="margin: 0; color: #9ca3af; font-size: 11px; text-align: center;">
                    Vous recevez cet email car vous venez de créer un compte sur ResaChap.
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
      user.email,
      subject,
      html,
      'Utilisateur - Bienvenue',
    );
  }

  // ----------------------------------------------------
  // 1. Notification au Locateur : Nouvelle demande reçue
  // ----------------------------------------------------

  // Template 1: Nouvelle demande au locateur
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
                <td style="background: linear-gradient(135deg, #00add8 0%, #0099bf 100%); padding: 32px 40px; text-align: center;">
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
                    Un utilisateur a soumis une nouvelle demande de réservation pour votre ressource <strong style="color: #00add8;">${resource.name}</strong>. 
                    La demande est maintenant en attente de votre décision.
                  </p>

                  <!-- Info Card -->
                  <div style="background-color: #f9fafb; border-left: 4px solid #00add8; border-radius: 6px; padding: 24px; margin: 24px 0;">
                    <h2 style="margin: 0 0 16px; color: #111827; font-size: 16px; font-weight: 600;">
                      📋 Détails de la demande
                    </h2>
                    
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top; width: 140px;">
                          <strong>Ressource :</strong>
                        </td>
                        <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                          ${resource.name} <span style="color: #00add8; font-weight: 500;">(${resource.type})</span>
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
                        <a href="${this.configService.get<string>('CLIENT_URL')}/reservations/received" 
                           style="display: inline-block; background-color: #00add8; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(0, 173, 216, 0.3); transition: all 0.2s;">
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
                    Cet email a été envoyé par <strong style="color: #00add8;">ResaChap</strong><br>
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

  // Template 2: Confirmation au locataire
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
                <td style="background: linear-gradient(135deg, #00add8 0%, #0099bf 100%); padding: 32px 40px; text-align: center;">
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
                    Votre demande de réservation pour <strong style="color: #00add8;">${resource.name}</strong> a bien été enregistrée ! 
                    Elle est maintenant en attente de validation par le propriétaire de la ressource.
                  </p>

                  <!-- Info Card -->
                  <div style="background-color: #e6f7fc; border-left: 4px solid #00add8; border-radius: 6px; padding: 24px; margin: 24px 0;">
                    <h2 style="margin: 0 0 16px; color: #005f7a; font-size: 16px; font-weight: 600;">
                      📋 Récapitulatif de votre demande
                    </h2>
                    
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #0088ad; font-size: 14px; vertical-align: top; width: 120px;">
                          <strong>Ressource :</strong>
                        </td>
                        <td style="padding: 8px 0; color: #005f7a; font-size: 14px;">
                          ${resource.name}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #0088ad; font-size: 14px; vertical-align: top;">
                          <strong>Période :</strong>
                        </td>
                        <td style="padding: 8px 0; color: #005f7a; font-size: 14px;">
                          Du ${reservation.dateDebut.toLocaleString('fr-FR')} <br>
                          au ${reservation.dateFin.toLocaleString('fr-FR')}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #0088ad; font-size: 14px; vertical-align: top;">
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
                        <a href="${this.configService.get<string>('CLIENT_URL')}/reservations/made" 
                           style="display: inline-block; background-color: #00add8; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(0, 173, 216, 0.3);">
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
                    Cet email a été envoyé par <strong style="color: #00add8;">ResaChap</strong><br>
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

  // Template 3: Changement de statut
  async sendStatusChangeToLocataire(
    locataire: User,
    reservation: Reservation,
    resource: Resource,
    newStatus: Status,
  ) {
    const isConfirmed = newStatus === Status.CONFIRMED;
    const color = isConfirmed ? '#00add8' : '#dc2626';
    const lightBg = isConfirmed ? '#e6f7fc' : '#fef2f2';
    const darkColor = isConfirmed ? '#005f7a' : '#991b1b';
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
                        <a href="${this.configService.get<string>('CLIENT_URL')}/reservations/made" 
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
                    Cet email a été envoyé par <strong style="color: #00add8;">ResaChap</strong><br>
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

  // Template 4: Annulation au locateur
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
                        <a href="${this.configService.get<string>('CLIENT_URL')}/reservations/received" 
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
                    Cet email a été envoyé par <strong style="color: #00add8;">ResaChap</strong><br>
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
