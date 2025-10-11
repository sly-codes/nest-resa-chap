import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github'; // Correct import for GitHub
import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';

// 🚨 REMPLACER AVEC VOS VRAIES CLÉS 🚨
const GITHUB_CLIENT_ID = 'Ov23liND0cgq1zFu2JTu';
const GITHUB_CLIENT_SECRET = 'b3fa84b92a5f324d63883b14c203c96b22388c99';
const GITHUB_CALLBACK_URL = 'http://localhost:3000/auth/github/redirect'; // Assurez-vous que le port est correct

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      callbackURL: GITHUB_CALLBACK_URL,
      scope: ['user:email', 'read:user'], // Demande d'accès à l'email et au profil
      // 💡 Astuce : 'prompt: "select_account"' n'est pas nécessaire pour GitHub,
      // car GitHub ne gère pas la sélection de plusieurs comptes comme Google.
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
