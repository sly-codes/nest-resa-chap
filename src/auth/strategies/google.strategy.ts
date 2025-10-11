import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service'; // Nécessaire pour la logique métier

// Importez les variables d'environnement (ou utilisez un service Config)
// Pour la démo, nous allons utiliser directement les chaînes (à remplacer par ConfigService)
const GOOGLE_CLIENT_ID =
  '154490028037-6o0m9bepmccqdrov35ao1drtnc6545ut.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';
const GOOGLE_CALLBACK_URL = 'http://localhost:3000/auth/google/redirect';

// Le nom de la stratégie est 'google'
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly authService: AuthService) {
    // Configuration de la stratégie Google OAuth
    super({
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'], // Les informations que l'on demande à Google
      prompt: 'select_account consent',
    } as any);
  }

  /**
   * La méthode `validate` est appelée après que Google a authentifié l'utilisateur.
   * Elle reçoit les infos de Google et doit retourner un objet utilisateur.
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, id } = profile; // 🚨 Récupérer l'ID Google
    const email = emails[0].value;

    const user = await this.authService.validateSocialUser({
      // 🚨 Utiliser la méthode unifiée
      email: email,
      firstName: name.givenName,
      lastName: name.familyName,
      provider: 'GOOGLE', // 🚨 Définir le fournisseur
      providerId: id, // 🚨 Définir l'ID du fournisseur
    });

    done(null, user);
  }
}
