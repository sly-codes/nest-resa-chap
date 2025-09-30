import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import { Tokens } from './types';
import * as argon from 'argon2';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  // Injecte les services Prisma et JwtService
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Hache une chaîne de caractères (principalement les mots de passe et les Refresh Tokens).
   * @param data - La chaîne à hacher.
   */
  hashData(data: string) {
    return argon.hash(data);
  }

  /**
   * Génère l'Access Token (AT) et le Refresh Token (RT) pour un utilisateur.
   * @param userId - L'ID de l'utilisateur.
   * @param email - L'email de l'utilisateur.
   */
  async getTokens(userId: string, email: string): Promise<Tokens> {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        { id: userId, email },
        {
          secret: 'AT_SECRET', // Remplacer par une variable d'environnement
          expiresIn: 60 * 15, // 15 minutes
        },
      ),
      this.jwtService.signAsync(
        { id: userId, email },
        {
          secret: 'RT_SECRET', // Remplacer par une variable d'environnement
          expiresIn: 60 * 60 * 24 * 7, // 7 jours
        },
      ),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }

  /**
   * Met à jour le Refresh Token haché dans la DB.
   * @param userId - L'ID de l'utilisateur.
   * @param rt - Le Refresh Token (brut) à hacher et stocker.
   */
  async updateRtHash(userId: string, rt: string): Promise<void> {
    const hash = await this.hashData(rt);
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRt: hash },
    });
  }

  // ----------------------------------------------------
  // LOGIQUE AUTHENTIFICATION
  // ----------------------------------------------------

  async signupLocal(dto: AuthDto): Promise<Tokens> {
    const hashedPassword = await this.hashData(dto.password);

    try {
      // 1. Créer l'utilisateur (le Locateur)
      const newUser = await this.prisma.user.create({
        data: {
          email: dto.email,
          hashedPassword,
        },
      });

      // 2. Générer les tokens AT et RT
      const tokens = await this.getTokens(newUser.id, newUser.email);

      // 3. Stocker le RT haché
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

    if (!user) throw new ForbiddenException('Identifiants incorrects.');

    // 1. Vérifier le mot de passe
    const passwordMatches = await argon.verify(
      user.hashedPassword,
      dto.password,
    );
    if (!passwordMatches)
      throw new ForbiddenException('Identifiants incorrects.');

    // 2. Générer les nouveaux tokens
    const tokens = await this.getTokens(user.id, user.email);

    // 3. Stocker le nouveau RT haché
    await this.updateRtHash(user.id, tokens.refresh_token);

    return tokens;
  }

  async logout(userId: string): Promise<boolean> {
    // Invalider le Refresh Token en mettant son champ à NULL
    await this.prisma.user.updateMany({
      where: {
        id: userId,
        // S'assurer que le RT haché existe (pour éviter de toucher des sessions déjà déconnectées)
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
