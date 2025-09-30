import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { CreateReservationDto, UpdateStatusDto } from './dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AtGuard } from 'src/common/guards';
import { CurrentUser } from 'src/common/decorators';

@ApiTags('Réservations (Public & Gestion Locateur)')
@Controller('reservations')
export class ReservationController {
  constructor(private reservationService: ReservationService) {}

  // ===================================================
  // ROUTE PUBLIQUE (Création de demande par le Locataire)
  // ===================================================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'PUBLIC : Créer une demande de réservation',
    description:
      "Vérifie d'abord la disponibilité et crée la demande avec le statut PENDING.",
  })
  @ApiResponse({
    status: 201,
    description: 'Demande de réservation créée avec succès.',
  })
  @ApiResponse({
    status: 400,
    description: 'Conflit horaire ou dates invalides.',
  })
  createReservation(@Body() dto: CreateReservationDto) {
    // Cette route est publique et appelle la logique de conflit du service
    return this.reservationService.createReservation(dto);
  }

  // ===================================================
  // ROUTES PROTÉGÉES (Gestion par le Locateur)
  // ===================================================

  @UseGuards(AtGuard) // Protection par Access Token
  @ApiBearerAuth()
  @Get('my')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'PROTÉGÉ : Lister toutes les demandes de réservation pour MES ressources',
  })
  @ApiResponse({
    status: 200,
    description:
      'Retourne toutes les réservations liées aux ressources du Locateur.',
  })
  getReservationsForOwner(@CurrentUser('id') ownerId: string) {
    // Liste les réservations des ressources qui appartiennent à l'utilisateur connecté
    return this.reservationService.getReservationsForOwner(ownerId);
  }

  @UseGuards(AtGuard) // Protection par Access Token
  @ApiBearerAuth()
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "PROTÉGÉ : Mettre à jour le statut d'une réservation (ex: annuler)",
  })
  @ApiResponse({ status: 200, description: 'Statut mis à jour.' })
  @ApiResponse({
    status: 403,
    description:
      "Tentative de modification d'une réservation qui ne vous appartient pas.",
  })
  updateStatus(
    @CurrentUser('id') ownerId: string,
    @Param('id', ParseUUIDPipe) reservationId: string, // ID de la réservation à modifier
    @Body() dto: UpdateStatusDto,
  ) {
    // Le service s'assure que seul le propriétaire de la ressource peut modifier le statut
    return this.reservationService.updateReservationStatus(
      ownerId,
      reservationId,
      dto,
    );
  }
}
