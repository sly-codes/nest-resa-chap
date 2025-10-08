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
} from '@nestjs/common';
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
} from '@nestjs/swagger';

@ApiTags('Ressources (Catalogue Public & Gestion Locateur)')
@Controller('resources')
export class ResourceController {
  constructor(private resourceService: ResourceService) {}

  // ===================================================
  // ROUTES PUBLIQUES (Catalogue des ressources)
  // ===================================================

  @Get() // -> /resources
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'PUBLIC : Lister toutes les ressources avec filtres',
  })
  // ✅ Documentez les paramètres de requête pour Swagger
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
  getAll(@Query() filters: GetResourcesDto) {
    // ✅ Utilisez @Query() pour capturer les filtres
    return this.resourceService.getAllResources(filters);
  }

  // =======================================================
  // ROUTES PROTÉGÉES (CRUD Gestion Locateur, nécessite JWT)
  // =======================================================

  // 1. ROUTE SPÉCIFIQUE (MINE) - Doit être placée AVANT :id
  @UseGuards(AtGuard)
  @ApiBearerAuth()
  @Get('mine') // -> /resources/mine
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'PROTÉGÉ : Lister mes propres ressources' })
  getMyResources(@CurrentUser('id') ownerId: string) {
    return this.resourceService.getMyResources(ownerId);
  }

  // 2. ROUTE DYNAMIQUE (GET BY ID) - Devient /resources/:id
  @UseGuards(AtGuard)
  @ApiBearerAuth()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'PROTÉGÉ : Récupérer une ressource par ID' })
  getById(@Param('id', ParseUUIDPipe) resourceId: string) {
    return this.resourceService.getResourceById(resourceId);
  }

  // 3. CREATE (POST)
  @UseGuards(AtGuard)
  @ApiBearerAuth()
  @Post() // -> /resources (POST)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'PROTÉGÉ : Créer une nouvelle ressource' })
  create(@CurrentUser('id') ownerId: string, @Body() dto: CreateResourceDto) {
    return this.resourceService.createResource(ownerId, dto);
  }

  // 4. EDIT (PATCH :id)
  @UseGuards(AtGuard)
  @ApiBearerAuth()
  @Patch(':id') // -> /resources/:id (PATCH)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'PROTÉGÉ : Modifier une ressource par ID' })
  edit(
    @CurrentUser('id') ownerId: string,
    @Param('id', ParseUUIDPipe) resourceId: string,
    @Body() dto: UpdateResourceDto,
  ) {
    return this.resourceService.editResourceById(ownerId, resourceId, dto);
  }

  // 5. DELETE (DELETE :id)
  @UseGuards(AtGuard)
  @ApiBearerAuth()
  @Delete(':id') // -> /resources/:id (DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'PROTÉGÉ : Supprimer une ressource par ID' })
  delete(
    @CurrentUser('id') ownerId: string,
    @Param('id', ParseUUIDPipe) resourceId: string,
  ) {
    return this.resourceService.deleteResourceById(ownerId, resourceId);
  }
}
