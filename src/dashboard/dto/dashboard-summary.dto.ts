import { ApiProperty } from '@nestjs/swagger';

export class PendingApproval {
  @ApiProperty({ description: 'ID de la réservation en attente.' })
  id: string;

  @ApiProperty({ description: 'Nom de la ressource concernée.' })
  resourceName: string;

  @ApiProperty({ description: 'Date/heure de début de la réservation.' })
  startDate: Date;
}

export class NextReservation {
  @ApiProperty({ description: 'ID de la réservation à venir.' })
  id: string;

  @ApiProperty({ description: 'Nom de la ressource réservée.' })
  resourceName: string;

  @ApiProperty({ description: 'Date/heure de début de la réservation.' })
  startDate: Date;

  @ApiProperty({
    description:
      'Statut de la réservation (PENDING, APPROVED, REJECTED, CANCELED).',
  })
  status: string;
}

export class DashboardSummaryDto {
  @ApiProperty({
    description: "Nombre total de ressources publiées par l'utilisateur.",
  })
  myResourceCount: number;

  @ApiProperty({
    description:
      "Nombre total de demandes de réservation en attente d'approbation.",
  })
  pendingApprovalCount: number;

  @ApiProperty({
    description:
      "Nombre total de réservations (futures ou en cours) faites par l'utilisateur.",
  })
  myReservationsCount: number; // ✨ NOUVEAU CHAMP

  @ApiProperty({
    description:
      "La prochaine réservation (statut Approved) faite par l'utilisateur.",
    type: NextReservation,
    nullable: true,
  })
  nextReservationMade: NextReservation | null;

  @ApiProperty({
    description:
      'La prochaine demande de réservation reçue nécessitant une approbation.',
    type: PendingApproval,
    nullable: true,
  })
  nextPendingApproval: PendingApproval | null;
}
