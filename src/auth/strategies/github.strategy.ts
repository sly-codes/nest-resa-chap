// src/auth/strategies/github.strategy.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github';
import { AuthService } from '../auth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    // Cast l'objet d'options à 'any' pour contourner la validation stricte de TS
    // qui ne comprend pas la gestion de 'passReqToCallback: false' par défaut.
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GITHUB_CALLBACK_URL'),
      scope: ['user:email', 'read:user'],
    } as any); // <-- AJOUT CRUCIAL ICI
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
      email: email,
      firstName: profile.displayName || profile.username,
      lastName: '',
      provider: 'GITHUB',
      providerId: profile.id,
    });

    done(null, user);
  }
}
