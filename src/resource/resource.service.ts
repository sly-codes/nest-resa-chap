// src/resources/resource.service.ts (CORRIGÉ COMPLET)

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
// 💡 NOUVEL IMPORT
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
// import * as path from 'path'; // 💡 PLUS NÉCESSAIRE

@Injectable()
export class ResourceService {
  // 💡 INJECTION DE CLOUDINARY SERVICE
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService, // 💡 AJOUT
  ) {}

  /**
   * Crée une nouvelle ressource et la lie au Locateur (ownerId)
   * @param ownerId L'ID du Locateur connecté (via JWT)
   * @param dto Les données de la ressource à créer
   * @param file Le fichier image à uploader
   * @returns La ressource créée
   */
  async createResource(
    ownerId: string,
    dto: CreateResourceDto,
    file: Express.Multer.File, // 💡 Prend le fichier Multer (buffer)
  ): Promise<Resource> {
    // 1. UPLOAD VERS CLOUDINARY
    const cloudinaryResponse = await this.cloudinaryService.uploadFile(file);

    // 2. CRÉATION DANS LA BASE DE DONNÉES avec l'URL Cloudinary
    return this.prisma.resource.create({
      data: {
        ...dto,
        ownerId,
        // 💡 STOCKAGE DE L'URL CLOUDINARY
        mainImage: cloudinaryResponse.secure_url,
      },
    });
  }

  // ---------------------------------------------------
  // ROUTES DE LECTURE (GET) - Les sélections de champs restent inchangées
  // ---------------------------------------------------

  async getResourceById(resourceId: string): Promise<Resource> {
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
      include: { owner: { select: { email: true, firstName: true } } },
    });

    if (!resource) {
      throw new NotFoundException(
        `Ressource avec ID ${resourceId} introuvable.`,
      );
    }

    return resource;
  }

  async getAllResources(filters: GetResourcesDto): Promise<any[]> {
    const { search, type, city } = filters;
    const where: any = {};

    // ... (Logique de filtres inchangée) ...

    if (type && ResourceTypes.includes(type)) {
      where.type = type;
    }
    if (city) {
      where.city = {
        contains: city,
        mode: 'insensitive',
      };
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Les résultats contiennent maintenant l'URL Cloudinary
    return this.prisma.resource.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        mainImage: true,
        price: true,
        priceUnit: true,
        country: true,
        city: true,
        // address: false, // Inutile d'exclure ici, si non listé il est ignoré
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

  async getMyResources(
    ownerId: string,
    filters: GetResourcesDto,
  ): Promise<Resource[]> {
    const { search, type, city } = filters;
    const where: any = { ownerId };

    // ... (Logique de filtres inchangée) ...

    if (type && ResourceTypes.includes(type)) {
      where.type = type;
    }
    if (city) {
      where.city = {
        contains: city,
        mode: 'insensitive',
      };
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.resource.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Met à jour une ressource spécifique
   * @param file Le nouveau fichier image (optionnel)
   */
  async editResourceById(
    ownerId: string,
    resourceId: string,
    dto: UpdateResourceDto,
    file?: Express.Multer.File, // 💡 Prend le fichier Multer (buffer)
  ): Promise<Resource> {
    // 1. Vérifier l'existence et la propriété
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
    });

    if (!resource || resource.ownerId !== ownerId) {
      // On utilise ForbiddenException si la ressource est trouvée mais n'appartient pas à l'utilisateur
      // Sinon, NotFoundException si elle n'existe pas du tout.
      if (!resource) {
        throw new NotFoundException(
          `Ressource avec ID ${resourceId} introuvable.`,
        );
      } else {
        throw new ForbiddenException(
          "Vous n'êtes pas autorisé à modifier cette ressource.",
        );
      }
    }

    // 2. Préparer les données et gérer l'image
    const updateData: any = { ...dto };

    if (file) {
      // a. Supprimer l'ancienne image de Cloudinary (si elle existe)
      if (resource.mainImage) {
        await this.cloudinaryService.deleteFileByUrl(resource.mainImage);
      }

      // b. Uploader la nouvelle image
      const cloudinaryResponse = await this.cloudinaryService.uploadFile(file);

      // c. Mettre à jour le chemin dans la DB
      updateData.mainImage = cloudinaryResponse.secure_url;
    }

    // 3. Mettre à jour la ressource
    return this.prisma.resource.update({
      where: { id: resourceId },
      data: updateData,
    });
  }

  /**
   * Supprime une ressource par ID et son image de Cloudinary.
   */
  async deleteResourceById(ownerId: string, resourceId: string): Promise<void> {
    // 1. Vérifier l'existence et la propriété
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
    });

    if (!resource || resource.ownerId !== ownerId) {
      if (!resource) {
        throw new NotFoundException(
          `Ressource avec ID ${resourceId} introuvable.`,
        );
      } else {
        throw new ForbiddenException(
          "Vous n'êtes pas autorisé à supprimer cette ressource.",
        );
      }
    }

    // 💡 GÉRER LA SUPPRESSION DE L'IMAGE CLOUDINARY
    if (resource.mainImage) {
      await this.cloudinaryService.deleteFileByUrl(resource.mainImage);
    }

    // 2. Supprimer la ressource
    await this.prisma.resource.delete({
      where: { id: resourceId },
    });
  }
}
