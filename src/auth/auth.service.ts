import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon from 'argon2';
import { MailService } from 'src/mail/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import { SocialUserDto, Tokens } from './types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  // ----------------------------------------------------------------------
  // LOGIQUE DE CONNEXION SOCIALE
  // ----------------------------------------------------------------------

  /**
   * Valide/Crée l'utilisateur social et génère des tokens.
   */
  async validateSocialUser(userDto: SocialUserDto): Promise<Tokens> {
    // 1. Chercher l'utilisateur par providerId ET provider
    let user = await this.prisma.user.findUnique({
      where: {
        provider_providerId: {
          provider: userDto.provider,
          providerId: userDto.providerId,
        },
      },
    });

    const isNewUser = !user; // Flag pour l'email de bienvenue

    // 2. Création si l'utilisateur n'existe pas
    if (isNewUser) {
      user = await this.prisma.user.create({
        data: {
          email: userDto.email,
          firstName: userDto.firstName,
          lastName: userDto.lastName,
          provider: userDto.provider,
          providerId: userDto.providerId,
          isVerified: true,
        },
      });

      // Envoi de l'e-mail de bienvenue après la création
      try {
        await this.mailService.sendWelcomeMail(user);
      } catch (error) {
        this.logger.error(
          `Échec de l'envoi de l'email de bienvenue (Social) pour ${user.email}`,
          error.stack,
        );
      }
    }

    // 🚨 CORRECTION TS18047: L'utilisateur ne peut plus être null ici.
    // Si la recherche initiale (l. 49) a réussi, 'user' est non-null.
    // Si la recherche a échoué (l. 57), 'user' a été créé et est non-null.
    // Néanmoins, pour la rigueur et si le findUnique peut retourner null, on s'assure qu'il est défini.
    if (!user) {
      this.logger.error(
        'Erreur critique: Utilisateur social introuvable et non créé.',
      );
      throw new ForbiddenException(
        "Erreur d'authentification. Veuillez réessayer.",
      );
    }

    // 3. Générer les tokens AT et RT pour l'utilisateur
    // L'erreur disparaît car TS sait que 'user' est défini ici.
    const tokens = await this.getTokens(user.id, user.email);

    // 4. Mettre à jour le hash du RT
    await this.updateRtHash(user.id, tokens.refresh_token);

    return tokens;
  }

  // ----------------------------------------------------------------------
  // FONCTIONS UTILITAIRES DE SÉCURITÉ
  // ----------------------------------------------------------------------

  hashData(data: string) {
    return argon.hash(data);
  }

  async getTokens(userId: string, email: string): Promise<Tokens> {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        { id: userId, email },
        {
          secret: this.configService.get<string>('JWT_AT_SECRET'),
          expiresIn: 60 * 60 * 24 * 1, // 1 jour
        },
      ),
      this.jwtService.signAsync(
        { id: userId, email },
        {
          secret: this.configService.get<string>('JWT_RT_SECRET'),
          expiresIn: 60 * 60 * 24 * 7, // 7 jours
        },
      ),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }

  async updateRtHash(userId: string, rt: string): Promise<void> {
    const hash = await this.hashData(rt);
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRt: hash },
    });
  }

  // ----------------------------------------------------
  // LOGIQUE AUTHENTIFICATION LOCALE
  // ----------------------------------------------------

  async signupLocal(dto: AuthDto): Promise<Tokens> {
    const hashedPassword = await this.hashData(dto.password);

    try {
      const newUser = await this.prisma.user.create({
        data: {
          email: dto.email,
          hashedPassword,
        },
      });

      const tokens = await this.getTokens(newUser.id, newUser.email);
      await this.updateRtHash(newUser.id, tokens.refresh_token);

      // Envoi de l'e-mail de bienvenue après la création
      try {
        await this.mailService.sendWelcomeMail(newUser);
        console.log('email envoyé avec success', newUser);
      } catch (error) {
        this.logger.error(
          `Échec de l'envoi de l'email de bienvenue (Local) pour ${newUser.email}`,
          error.stack,
        );
      }

      return tokens;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ForbiddenException("L'email est déjà utilisé.");
      }
      throw error;
    }
  }

  async signinLocal(dto: AuthDto): Promise<Tokens> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new ForbiddenException('Identifiants incorrects.');
    }

    if (!user.hashedPassword) {
      throw new ForbiddenException('Veuillez utiliser la connexion sociale.');
    }

    const passwordMatches = await argon.verify(
      user.hashedPassword,
      dto.password,
    );

    if (!passwordMatches) {
      throw new ForbiddenException('Identifiants incorrects.');
    }

    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRtHash(user.id, tokens.refresh_token);

    return tokens;
  }

  async logout(userId: string): Promise<boolean> {
    await this.prisma.user.updateMany({
      where: {
        id: userId,
        hashedRt: { not: null },
      },
      data: { hashedRt: null },
    });
    return true;
  }

  async refreshTokens(userId: string, rt: string): Promise<Tokens> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.hashedRt)
      throw new ForbiddenException('Accès refusé. Session non valide.');

    const rtMatches = await argon.verify(user.hashedRt, rt);
    if (!rtMatches)
      throw new ForbiddenException(
        'Accès refusé. Token de rafraîchissement invalide.',
      );

    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRtHash(user.id, tokens.refresh_token);

    return tokens;
  }
}
