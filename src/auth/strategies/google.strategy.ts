import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service'; // Nécessaire pour la logique métier


// Le nom de la stratégie est 'google'
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    // Configuration de la stratégie Google OAuth
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
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
