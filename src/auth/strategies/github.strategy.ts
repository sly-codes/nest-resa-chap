import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2'; // ✅ Utiliser 'passport-github2' (le plus récent et compatible)
import { AuthService } from '../auth.service';

// Le nom de la stratégie est 'github'
@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService, // ✅ Injection du ConfigService
  ) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GITHUB_CALLBACK_URL'),
      scope: ['user:email', 'read:user'], // Demande d'accès à l'email et au profil
      // 💡 GitHub ne gère pas "select_account" donc inutile ici
    });
  }

  /**
   * Méthode appelée après l'authentification GitHub.
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (err: any, user: any) => void,
  ): Promise<any> {
    const primaryEmail = profile.emails
      ? profile.emails.find((email) => email.primary)?.value
      : profile._json.email;
    const email = primaryEmail || `${profile.username}@github.com`;

    const user = await this.authService.validateSocialUser({
      // 🚨 Utiliser la méthode unifiée
      email: email,
      firstName: profile.displayName || profile.username,
      lastName: '',
      provider: 'GITHUB', // 🚨 Définir le fournisseur
      providerId: profile.id, // 🚨 L'ID GitHub est dans profile.id
    });

    done(null, user);
  }
}
