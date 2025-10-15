import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Resource } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateResourceDto,
  GetResourcesDto,
  ResourceTypes,
  UpdateResourceDto,
} from './dto';

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
      // Assurez-vous d'inclure les champs nécessaires, potentiellement l'owner
    });

    if (!resource) {
      throw new NotFoundException(
        `Ressource avec ID ${resourceId} introuvable.`,
      );
    }

    return resource;
  }

  /**
   * Liste toutes les ressources disponibles (Catalogue public) avec filtres.
   * @param filters Les filtres de recherche et de type
   * @returns Liste des ressources
   */
  async getAllResources(filters: GetResourcesDto): Promise<any[]> {
    const { search, type } = filters;

    // Construction de la clause WHERE de Prisma
    const where: any = {};

    // 1. Filtrage par Type
    if (type && ResourceTypes.includes(type)) {
      where.type = type;
    }

    // 2. Filtrage par Recherche (recherche sur le nom OU la description)
    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive', // Optionnel, si votre base de données le supporte
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    return this.prisma.resource.findMany({
      where, // ✅ Applique la clause WHERE construite
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        createdAt: true,
        ownerId: true,
        owner: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            contactPhone: true,
          },
        },
      },
    });
  }

  /**
   * 🚨 CORRECTION/AJOUT : Obtient les ressources du Locateur connecté AVEC FILTRES
   * @param ownerId L'ID du Locateur connecté
   * @param filters Les filtres de recherche et de type
   * @returns Liste des ressources appartenant à ce Locateur
   */
  async getMyResources(
    ownerId: string,
    filters: GetResourcesDto,
  ): Promise<Resource[]> {
    const { search, type } = filters;

    // Construction de la clause WHERE de Prisma
    const where: any = {
      ownerId, // 🚨 FILTRE ESSENTIEL : Limité au propriétaire connecté
    };

    // 1. Filtrage par Type
    if (type && ResourceTypes.includes(type)) {
      where.type = type;
    }

    // 2. Filtrage par Recherche (recherche sur le nom OU la description)
    if (search) {
      // Note: L'opérateur AND implicite (ownerId AND (OR: [...])) est appliqué
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    return this.prisma.resource.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      // Pour une liste simple, les champs par défaut suffisent, ou ajoutez un `select`
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
