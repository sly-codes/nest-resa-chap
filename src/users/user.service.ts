import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserDto } from './dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  /**
   * Récupère les données publiques de l'utilisateur.
   * On exclut les champs sensibles (hashedPassword, hashedRt).
   */
  async findMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        contactPhone: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true,
        // Exclure les relations si elles ne sont pas nécessaires
      },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec ID ${userId} introuvable.`);
    }
    return user;
  }

  /**
   * Met à jour les informations non sensibles du profil.
   */
  async updateProfile(userId: string, dto: UpdateUserDto) {
    // Le DTO contient déjà les vérifications de validité (@IsOptional, @IsString, etc.)
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      // On retourne les données mises à jour (similaire à findMe)
      select: {
        id: true,
        email: true,
        username: true,
        contactPhone: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
