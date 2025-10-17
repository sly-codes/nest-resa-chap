// src/resources/resource.controller.ts (CORRIGÉ COMPLET)

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
// 💡 SUPPRESSION DE diskStorage, extname, et path
import { memoryStorage } from 'multer'; // 💡 NOUVEL IMPORT: Stockage en mémoire
import { ResourceService } from './resource.service';
import { CreateResourceDto, GetResourcesDto, UpdateResourceDto } from './dto';
import { AtGuard } from 'src/common/guards';
import { CurrentUser } from 'src/common/decorators';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

// 💡 CONFIGURATION DE MULTER: STOCKAGE EN MÉMOIRE TEMPORAIRE
const memoryStorageConfig = memoryStorage();
// L'ancien const storage est supprimé.

@ApiTags('Ressources (Catalogue Public & Gestion Locateur)')
@Controller('resources')
export class ResourceController {
  constructor(private resourceService: ResourceService) {}

  // =======================================================
  // ROUTES PROTÉGÉES (CRUD Gestion Locateur, nécessite JWT)
  // =======================================================

  // 1. ROUTE SPÉCIFIQUE (MINE) - Garde l'ordre correct pour éviter le conflit avec :id
  @UseGuards(AtGuard)
  @ApiBearerAuth()
  @Get('mine') // -> /resources/mine
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'PROTÉGÉ : Lister mes propres ressources (avec filtres)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Terme de recherche dans le nom/description',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['ROOM', 'EQUIPMENT'],
    description: 'Filtre par type de ressource',
  })
  @ApiQuery({
    name: 'city',
    required: false,
    description: 'Filtre par ville',
  })
  getMyResources(
    @CurrentUser('id') ownerId: string,
    @Query() filters: GetResourcesDto,
  ) {
    return this.resourceService.getMyResources(ownerId, filters);
  }

  // 2. CREATE (POST) avec gestion d'upload (MODIFIÉ pour Cloudinary)
  @UseGuards(AtGuard)
  @ApiBearerAuth()
  @Post() // -> /resources (POST)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'PROTÉGÉ : Créer une nouvelle ressource (avec image Cloudinary)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        type: { type: 'string', enum: ['ROOM', 'EQUIPMENT'] },
        description: { type: 'string', nullable: true },
        price: { type: 'number' },
        priceUnit: { type: 'string', enum: ['HOUR', 'DAY', 'WEEK', 'MONTH'] },
        country: { type: 'string', nullable: true },
        city: { type: 'string', nullable: true },
        address: { type: 'string', nullable: true },
        mainImage: {
          type: 'string',
          format: 'binary',
          description: 'Image principale de la ressource',
        },
      },
      required: ['name', 'type', 'price', 'priceUnit', 'mainImage'],
    },
  })
  @UseInterceptors(
    FileInterceptor('mainImage', {
      // 💡 UTILISE memoryStorageConfig
      storage: memoryStorageConfig,
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
          return cb(
            new BadRequestException(
              'Seuls les fichiers JPG, JPEG et PNG sont autorisés.',
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  create(
    @CurrentUser('id') ownerId: string,
    @Body() dto: CreateResourceDto,
    @UploadedFile() file: Express.Multer.File, // Le fichier est maintenant un buffer en RAM
  ) {
    if (!file) {
      throw new BadRequestException('Le champ mainImage est requis.');
    }

    // 💡 Passage du fichier Multer au service
    return this.resourceService.createResource(ownerId, dto, file);
  }

  // 3. EDIT (PATCH :id) avec gestion d'upload (MODIFIÉ pour Cloudinary)
  @UseGuards(AtGuard)
  @ApiBearerAuth()
  @Patch(':id') // -> /resources/:id (PATCH)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'PROTÉGÉ : Modifier une ressource par ID (avec image Cloudinary optionnelle)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', nullable: true },
        // ... (autres champs optionnels)
        mainImage: {
          type: 'string',
          format: 'binary',
          description: 'Nouvelle image principale de la ressource (optionnel)',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('mainImage', {
      // 💡 UTILISE memoryStorageConfig
      storage: memoryStorageConfig,
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
          return cb(
            new BadRequestException(
              'Seuls les fichiers JPG, JPEG et PNG sont autorisés.',
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  edit(
    @CurrentUser('id') ownerId: string,
    @Param('id', ParseUUIDPipe) resourceId: string,
    @Body() dto: UpdateResourceDto,
    @UploadedFile() file: Express.Multer.File, // Le fichier est maintenant un buffer en RAM
  ) {
    // 💡 Passage du fichier Multer au service (undefined si non fourni)
    return this.resourceService.editResourceById(
      ownerId,
      resourceId,
      dto,
      file,
    );
  }

  // 4. DELETE (DELETE :id) (inchangée)
  @UseGuards(AtGuard)
  @ApiBearerAuth()
  @Delete(':id') // -> /resources/:id (DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'PROTÉGÉ : Supprimer une ressource par ID' })
  delete(
    @CurrentUser('id') ownerId: string,
    @Param('id', ParseUUIDPipe) resourceId: string,
  ) {
    // Le service gérera la suppression de l'image Cloudinary
    return this.resourceService.deleteResourceById(ownerId, resourceId);
  }

  // ===================================================
  // ROUTES PUBLIQUES (Catalogue des ressources)
  // ===================================================

  @Get() // -> /resources (inchangée)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'PUBLIC : Lister toutes les ressources avec filtres (recherche, type, ville)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Terme de recherche dans le nom/description',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['ROOM', 'EQUIPMENT'],
    description: 'Filtre par type de ressource',
  })
  @ApiQuery({
    name: 'city',
    required: false,
    description: 'Filtre par ville',
  })
  getAll(@Query() filters: GetResourcesDto) {
    return this.resourceService.getAllResources(filters);
  }

  // ROUTE DE DÉTAIL (En dernier pour l'ordre de priorité)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'PUBLIC : Récupérer une ressource par ID (Détails)',
  })
  getById(@Param('id', ParseUUIDPipe) resourceId: string) {
    return this.resourceService.getResourceById(resourceId);
  }
}
