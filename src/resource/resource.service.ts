import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Resource } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateResourceDto, UpdateResourceDto } from './dto';

@Injectable()
export class ResourceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crée une nouvelle ressource et la lie au Locateur (ownerId)
   * @param ownerId L'ID du Locateur connecté (via JWT)
   * @param dto Les données de la ressource à créer
   * @returns La ressource créée
   */
  async createResource(
    ownerId: string,
    dto: CreateResourceDto,
  ): Promise<Resource> {
    return this.prisma.resource.create({
      data: {
        ...dto,
        ownerId, // Lien de propriété crucial
      },
    });
  }

  /**
   * Récupère une ressource spécifique par son ID.
   * Utilisé principalement pour l'édition côté Locateur.
   * @param resourceId L'ID de la ressource à récupérer.
   * @returns La ressource trouvée.
   */
  async getResourceById(resourceId: string): Promise<Resource> {
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      throw new NotFoundException(
        `Ressource avec ID ${resourceId} introuvable.`,
      );
    }

    return resource;
  }

  /**
   * Liste toutes les ressources disponibles (Catalogue public)
   * @returns Liste des ressources
   */
  async getAllResources(): Promise<any[]> {
    return this.prisma.resource.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        createdAt: true,
        // Inclure l'ownerId si le Locataire veut voir qui est le propriétaire
        ownerId: true,
      },
    });
  }

  /**
   * Obtient les ressources du Locateur connecté
   * @param ownerId L'ID du Locateur connecté
   * @returns Liste des ressources appartenant à ce Locateur
   */
  async getMyResources(ownerId: string): Promise<Resource[]> {
    return this.prisma.resource.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Met à jour une ressource spécifique
   * @param ownerId L'ID du Locateur
   * @param resourceId L'ID de la ressource à modifier
   * @param dto Les données de modification
   * @returns La ressource mise à jour
   */
  async editResourceById(
    ownerId: string,
    resourceId: string,
    dto: UpdateResourceDto,
  ): Promise<Resource> {
    // 1. Vérifier l'existence et la propriété de la ressource
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      throw new NotFoundException(
        `Ressource avec ID ${resourceId} introuvable.`,
      );
    }

    // Sécurité: S'assurer que seul le propriétaire peut modifier sa ressource
    if (resource.ownerId !== ownerId) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à modifier cette ressource.",
      );
    }

    // 2. Mettre à jour la ressource
    return this.prisma.resource.update({
      where: { id: resourceId },
      data: dto,
    });
  }

  /**
   * Supprime une ressource spécifique
   * @param ownerId L'ID du Locateur
   * @param resourceId L'ID de la ressource à supprimer
   */
  async deleteResourceById(ownerId: string, resourceId: string): Promise<void> {
    // 1. Vérifier l'existence et la propriété de la ressource
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      throw new NotFoundException(
        `Ressource avec ID ${resourceId} introuvable.`,
      );
    }

    // Sécurité: S'assurer que seul le propriétaire peut supprimer sa ressource
    if (resource.ownerId !== ownerId) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à supprimer cette ressource.",
      );
    }

    // 2. Supprimer la ressource
    await this.prisma.resource.delete({
      where: { id: resourceId },
    });
  }
}
