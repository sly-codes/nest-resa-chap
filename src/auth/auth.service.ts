import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client'; // Importez l'objet User de Prisma
import * as argon from 'argon2';
import { MailService } from 'src/mail/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import { JwtPayload, SocialUserDto, Tokens, UserRole } from './types'; // Importez le type UserRole

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name); // L'opérateur '!' indique que cette propriété sera initialisée,
  // nous la chargeons dans le constructeur en forçant la valeur.
  private readonly superAdminId: string;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {
    // 🚨 CORRECTION TS2322 : Utilisation d'un cast strict ou d'une vérification
    // Pour les variables d'environnement critiques, on suppose qu'elle est présente
    // ou que l'application plantera au démarrage si elle ne l'est pas.
    const adminId = this.configService.get<string>('SUPER_ADMIN_ID');
    if (!adminId) {
      throw new Error(
        "La variable d'environnement 'SUPER_ADMIN_ID' est manquante. Le système de rôles ne peut pas fonctionner.",
      );
    }
    this.superAdminId = adminId;
  } // ----------------------------------------------------------------------
  // 💡 FONCTION CRUCIALE : DÉTERMINATION DU RÔLE
  // ----------------------------------------------------------------------
  /**
   * Détermine le rôle de l'utilisateur basé sur son ID et ses données (si nécessaire).
   * @param user L'objet utilisateur (au moins l'ID est requis).
   * @returns Le rôle ('SUPER_ADMIN', 'LOCATEUR', ou 'LOCATAIRE').
   */

  private determineUserRole(user: Pick<User, 'id'>): UserRole {
    // 1. Vérification du rôle SUPER_ADMIN (Liste blanche/ID connu)
    if (user.id === this.superAdminId) {
      return 'SUPER_ADMIN';
    } // 🚨 LOGIQUE ACTUELLE : Tout le monde est LOCATAIRE sauf le SUPER_ADMIN.
    // Cette logique est simple et sécurisée pour le lancement.

    return 'LOCATAIRE';
  } // ----------------------------------------------------------------------
  // FONCTIONS UTILITAIRES DE SÉCURITÉ
  // ----------------------------------------------------------------------

  hashData(data: string) {
    return argon.hash(data);
  } /**
   * Génère les tokens AT et RT, en incluant le rôle dans le payload.
   */

  async getTokens(userId: string, email: string): Promise<Tokens> {
    const user = { id: userId }; // Minimum requis pour determineUserRole
    const role = this.determineUserRole(user); // 💡 Détermination du rôle

    const payload: JwtPayload = {
      // 💡 Le payload est typé avec 'role'
      id: userId,
      email,
      role, // 💡 INJECTION DU RÔLE DANS LE PAYLOAD
    };

    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        payload, // Utilisation du payload enrichi
        {
          secret: this.configService.get<string>('JWT_AT_SECRET'),
          expiresIn: 60 * 60 * 24 * 1, // 1 jour
        },
      ),
      this.jwtService.signAsync(
        payload, // Utilisation du payload enrichi
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
  } // ----------------------------------------------------------------------
  // LOGIQUE DE CONNEXION SOCIALE
  // ----------------------------------------------------------------------

  async validateSocialUser(userDto: SocialUserDto): Promise<Tokens> {
    let user = await this.prisma.user.findUnique({
      where: {
        provider_providerId: {
          provider: userDto.provider,
          providerId: userDto.providerId,
        },
      },
    });

    const isNewUser = !user;

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

      try {
        await this.mailService.sendWelcomeMail(user);
      } catch (error) {
        this.logger.error(
          `Échec de l'envoi de l'email de bienvenue (Social) pour ${user.email}`,
          error.stack,
        );
      }
    }

    if (!user) {
      this.logger.error(
        'Erreur critique: Utilisateur social introuvable et non créé.',
      );
      throw new ForbiddenException(
        "Erreur d'authentification. Veuillez réessayer.",
      );
    }

    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRtHash(user.id, tokens.refresh_token);

    return tokens;
  } // ----------------------------------------------------
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
