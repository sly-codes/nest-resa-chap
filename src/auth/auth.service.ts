import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import { SocialUserDto, Tokens } from './types'; // Assurez-vous que SocialUserDto est mis à jour

@Injectable()
export class AuthService {
  // Injecte les services Prisma et JwtService
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ----------------------------------------------------------------------
  // LOGIQUE DE CONNEXION SOCIALE
  // ----------------------------------------------------------------------

  /**
   * Valide/Crée l'utilisateur social et génère des tokens.
   */
  async validateSocialUser(userDto: SocialUserDto): Promise<Tokens> {
    // 1. Chercher l'utilisateur par providerId ET provider
    // Ceci fonctionne après l'application du schéma Prisma (unique composite key)
    let user = await this.prisma.user.findUnique({
      where: {
        provider_providerId: {
          provider: userDto.provider,
          providerId: userDto.providerId,
        },
      },
    });

    // 2. Création si l'utilisateur n'existe pas
    if (!user) {
      // 💡 Optionnel : Logique de lien par email ici si besoin

      user = await this.prisma.user.create({
        data: {
          email: userDto.email,
          firstName: userDto.firstName,
          lastName: userDto.lastName,
          provider: userDto.provider,
          providerId: userDto.providerId,
          // IMPORTANT : Pas de hashedPassword ici
          isVerified: true,
        },
      });
    }

    // 3. Générer les tokens AT et RT pour l'utilisateur
    // Nous avons retiré le troisième argument 'user.provider' car il n'est pas nécessaire dans le JWT payload
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
          secret: this.configService.get<string>('JWT_AT_SECRET'), // Remplacer par une variable d'environnement
          expiresIn: 60 * 60 * 24 * 2, // 15 minutes
        },
      ),
      this.jwtService.signAsync(
        { id: userId, email },
        {
          secret: this.configService.get<string>('JWT_RT_SECRET'), // Remplacer par une variable d'environnement
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
  // LOGIQUE AUTHENTIFICATION LOCALE (mise à jour)
  // ----------------------------------------------------

  async signupLocal(dto: AuthDto): Promise<Tokens> {
    const hashedPassword = await this.hashData(dto.password);

    try {
      const newUser = await this.prisma.user.create({
        data: {
          email: dto.email,
          hashedPassword,
          // Le provider est 'LOCAL' par défaut dans le schéma
        },
      });

      const tokens = await this.getTokens(newUser.id, newUser.email);
      await this.updateRtHash(newUser.id, tokens.refresh_token);

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

    // 🚨 CORRECTION TS2345 : Vérifier si l'utilisateur a un mot de passe (c'est-à-dire un compte LOCAL)
    if (!user.hashedPassword) {
      throw new ForbiddenException('Veuillez utiliser la connexion sociale.');
    }

    // 1. Vérifier le mot de passe
    const passwordMatches = await argon.verify(
      user.hashedPassword, // hashedPassword est garanti non-null ici
      dto.password,
    );

    if (!passwordMatches) {
      throw new ForbiddenException('Identifiants incorrects.');
    }

    // 2. Générer les nouveaux tokens
    const tokens = await this.getTokens(user.id, user.email);

    // 3. Stocker le nouveau RT haché
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

    // 1. Vérifier si le RT fourni par le client correspond au RT haché en DB
    const rtMatches = await argon.verify(user.hashedRt, rt);
    if (!rtMatches)
      throw new ForbiddenException(
        'Accès refusé. Token de rafraîchissement invalide.',
      );

    // 2. Générer les nouveaux tokens
    const tokens = await this.getTokens(user.id, user.email);

    // 3. Mettre à jour le nouveau RT haché
    await this.updateRtHash(user.id, tokens.refresh_token);

    return tokens;
  }
}
