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
  UseGuards,
} from '@nestjs/common';
import { ResourceService } from './resource.service';
import { CreateResourceDto, UpdateResourceDto } from './dto';
import { AtGuard } from 'src/common/guards';
import { CurrentUser } from 'src/common/decorators';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Ressources (Catalogue Public & Gestion Locateur)')
@Controller('resources')
export class ResourceController {
  constructor(private resourceService: ResourceService) {}

  // ===================================================
  // ROUTES PUBLIQUES (Catalogue des ressources)
  // ===================================================

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'PUBLIC : Lister toutes les ressources' })
  @ApiResponse({
    status: 200,
    description: 'Retourne la liste complète des ressources.',
  })
  getAll() {
    return this.resourceService.getAllResources();
  }

  // ===================================================
  // ROUTES PROTÉGÉES (CRUD Gestion Locateur, nécessite JWT)
  // ===================================================

  @UseGuards(AtGuard)
  @ApiBearerAuth()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'PROTÉGÉ : Créer une nouvelle ressource' })
  @ApiResponse({
    status: 201,
    description: 'Ressource créée avec succès et liée au Locateur.',
  })
  create(@CurrentUser('id') ownerId: string, @Body() dto: CreateResourceDto) {
    return this.resourceService.createResource(ownerId, dto);
  }

  @UseGuards(AtGuard)
  @ApiBearerAuth()
  @Get('my')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'PROTÉGÉ : Lister mes propres ressources' })
  @ApiResponse({
    status: 200,
    description: 'Retourne les ressources créées par le Locateur connecté.',
  })
  getMyResources(@CurrentUser('id') ownerId: string) {
    return this.resourceService.getMyResources(ownerId);
  }

  @UseGuards(AtGuard)
  @ApiBearerAuth()
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'PROTÉGÉ : Modifier une ressource par ID' })
  @ApiResponse({ status: 200, description: 'Ressource mise à jour.' })
  @ApiResponse({
    status: 403,
    description:
      "Tentative de modification d'une ressource qui ne vous appartient pas.",
  })
  edit(
    @CurrentUser('id') ownerId: string,
    @Param('id', ParseUUIDPipe) resourceId: string,
    @Body() dto: UpdateResourceDto,
  ) {
    return this.resourceService.editResourceById(ownerId, resourceId, dto);
  }

  @UseGuards(AtGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'PROTÉGÉ : Supprimer une ressource par ID' })
  @ApiResponse({ status: 204, description: 'Ressource supprimée.' })
  @ApiResponse({ status: 404, description: 'Ressource introuvable.' })
  delete(
    @CurrentUser('id') ownerId: string,
    @Param('id', ParseUUIDPipe) resourceId: string,
  ) {
    return this.resourceService.deleteResourceById(ownerId, resourceId);
  }
}
