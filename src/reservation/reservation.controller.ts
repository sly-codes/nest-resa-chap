import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AtGuard } from 'src/common/guards';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Reservations (Locataire & Locateur)')
@Controller('reservations')
@UseGuards(AtGuard) // Protection globale du module
@ApiBearerAuth()
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  // ----------------------------------------------------
  // CRUD LOCATAIRE (Réservations faites par l'utilisateur connecté)
  // ----------------------------------------------------

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une nouvelle demande de réservation' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Réservation créée (PENDING) et Locateur notifié.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Conflit horaire ou dates invalides.',
  })
  create(
    @CurrentUser('id') locataireId: string, // Récupération de l'ID du Locataire via le token
    @Body() createReservationDto: CreateReservationDto,
  ) {
    return this.reservationService.createReservation(
      locataireId,
      createReservationDto,
    );
  }

  @Get('made')
  @ApiOperation({
    summary:
      "Lister toutes les réservations faites par l'utilisateur (Locataire)",
  })
  getReservationsMade(@CurrentUser('id') locataireId: string) {
    return this.reservationService.getReservationsMade(locataireId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Annuler une de MES réservations (Locataire)' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Réservation annulée (statut CANCELED).',
  })
  deleteReservation(
    @Param('id', ParseUUIDPipe) reservationId: string,
    @CurrentUser('id') locataireId: string,
  ) {
    // Le service vérifie que l'utilisateur est bien le locataire et que le statut est PENDING
    return this.reservationService.deleteReservation(
      reservationId,
      locataireId,
    );
  }

  // ----------------------------------------------------
  // CRUD LOCATEUR (Réservations reçues pour ses ressources)
  // ----------------------------------------------------

  @Get('received')
  @ApiOperation({
    summary:
      'Lister toutes les demandes de réservation reçues pour MES ressources (Locateur)',
  })
  getReservationsReceived(@CurrentUser('id') locateurId: string) {
    return this.reservationService.getReservationsReceived(locateurId);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: "Mettre à jour le statut d'une réservation reçue (Locateur)",
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Statut mis à jour.' })
  updateStatus(
    @Param('id', ParseUUIDPipe) reservationId: string,
    @CurrentUser('id') locateurId: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    // Le service vérifie que l'utilisateur est bien le propriétaire de la ressource
    return this.reservationService.updateReservationStatus(
      reservationId,
      locateurId,
      updateStatusDto,
    );
  }
}
