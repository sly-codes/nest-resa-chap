// google.strategy.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // ⬅️ NOUVEL IMPORT
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  // Ajout de ConfigService dans le constructeur
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService, // Injection
  ) {
    // Configuration de la stratégie Google OAuth
    super({
      // 💡 Utilisation du ConfigService pour récupérer les secrets
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
      prompt: 'select_account consent',
    } as any);
  }

  /**
   * La méthode `validate` est laissée telle quelle (elle est correcte).
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, id } = profile;
    const email = emails[0].value;

    const user = await this.authService.validateSocialUser({
      email: email,
      firstName: name.givenName,
      lastName: name.familyName,
      provider: 'GOOGLE',
      providerId: id,
    });

    done(null, user);
  }
}
