import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReservationDto, UpdateStatusDto } from './dto';
import { Reservation, Status } from '@prisma/client';

@Injectable()
export class ReservationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Logique CRUCIALE : Vérifie si une ressource est disponible sur une plage horaire donnée.
   * La ressource est indisponible s'il existe une réservation PENDING qui chevauche.
   * @param resourceId ID de la ressource
   * @param dateDebut Date de début demandée
   * @param dateFin Date de fin demandée
   * @returns Vrai si disponible, Faux sinon.
   */
  private async checkAvailability(
    resourceId: string,
    dateDebut: Date,
    dateFin: Date,
  ): Promise<boolean> {
    // 1. Vérification basique des dates (sécurité contre les requêtes illogiques)
    if (dateDebut >= dateFin) {
      throw new BadRequestException(
        'La date de début doit être strictement antérieure à la date de fin.',
      );
    }

    // 2. Requête Prisma pour détecter le chevauchement (Collision)
    // On cherche une réservation existante qui correspond aux critères de conflit.
    const existingReservation = await this.prisma.reservation.findFirst({
      where: {
        resourceId: resourceId,
        status: Status.PENDING, // Seules les réservations EN ATTENTE bloquent la ressource

        // Logique de CHEVAUCHEMENT (Collision)
        // La nouvelle période [dateDebut, dateFin] chevauche une existante si :
        // Le début de l'existante est AVANT la fin de la nouvelle ET
        // La fin de l'existante est APRÈS le début de la nouvelle.
        AND: [
          { dateDebut: { lt: dateFin } }, // Le début de l'existante est avant la fin de la nouvelle
          { dateFin: { gt: dateDebut } }, // La fin de l'existante est après le début de la nouvelle
        ],
      },
    });

    // S'il existe une réservation qui chevauche, elle n'est pas disponible (retourne false).
    return !existingReservation;
  }

  /**
   * Crée une demande de réservation (Locataire, route publique).
   * C'est le point d'entrée pour le locataire qui veut "louer chap".
   * @param dto Les données de la réservation
   * @returns La nouvelle réservation créée
   */
  async createReservation(dto: CreateReservationDto): Promise<Reservation> {
    // Convertir les chaînes de date en objets Date pour la manipulation et la DB
    const startDate = new Date(dto.dateDebut);
    const endDate = new Date(dto.dateFin);

    // 1. Vérifier si la ressource existe
    const resource = await this.prisma.resource.findUnique({
      where: { id: dto.resourceId },
    });

    if (!resource) {
      throw new NotFoundException(
        `Ressource avec ID ${dto.resourceId} introuvable.`,
      );
    }

    // 2. Vérifier la disponibilité (le point clé)
    const isAvailable = await this.checkAvailability(
      dto.resourceId,
      startDate,
      endDate,
    );

    if (!isAvailable) {
      throw new BadRequestException(
        'Cette ressource est déjà réservée pour la plage horaire demandée. Veuillez choisir une autre heure ou date.',
      );
    }

    // 3. Créer la réservation avec le statut PENDING
    return this.prisma.reservation.create({
      data: {
        ...dto,
        dateDebut: startDate,
        dateFin: endDate,
        status: Status.PENDING, // Toujours en attente de validation du Locateur
      },
    });
  }

  // ===================================================
  // Fonctions PROTÉGÉES (Pour le Locateur)
  // ===================================================

  /**
   * Liste toutes les réservations pour les ressources d'un Locateur donné.
   * @param ownerId L'ID du Locateur connecté
   * @returns Liste des réservations
   */
  async getReservationsForOwner(ownerId: string): Promise<any> {
    // Le type "any" est utilisé pour inclure la ressource jointe
    return this.prisma.reservation.findMany({
      where: {
        // Filtrer pour n'afficher que les réservations des ressources qui appartiennent à cet Locateur
        resource: {
          ownerId: ownerId,
        },
      },
      // Joindre le nom et le type de la ressource pour le dashboard
      include: {
        resource: {
          select: { name: true, type: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Met à jour le statut d'une réservation (CANCELED).
   * @param ownerId L'ID du Locateur
   * @param reservationId L'ID de la réservation à modifier
   * @param dto Le nouveau statut
   * @returns La réservation mise à jour
   */
  async updateReservationStatus(
    ownerId: string,
    reservationId: string,
    dto: UpdateStatusDto,
  ): Promise<Reservation> {
    // 1. Vérifier si la réservation existe ET si la ressource appartient bien au Locateur
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { resource: true }, // Joindre la ressource pour vérifier la propriété
    });

    if (!reservation) {
      throw new NotFoundException('Réservation introuvable.');
    }

    // Sécurité: Vérifier la propriété de la ressource
    if (reservation.resource.ownerId !== ownerId) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à gérer cette réservation.",
      );
    }

    // 2. Mettre à jour le statut
    return this.prisma.reservation.update({
      where: { id: reservationId },
      data: { status: dto.status },
    });
  }
}
