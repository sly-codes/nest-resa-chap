import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { MailService } from 'src/mail/mail.service'; // Import du service mail
import { Reservation, Status } from '@prisma/client';

@Injectable()
export class ReservationService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService, // Injection du service mail
  ) {}

  /**
   * Vérifie le chevauchement d'horaire pour une ressource donnée.
   * @param resourceId ID de la ressource.
   * @param dateDebut Début de la période demandée.
   * @param dateFin Fin de la période demandée.
   * @returns La réservation en conflit ou null.
   */
  private async checkAvailability(
    resourceId: string,
    dateDebut: Date,
    dateFin: Date,
  ): Promise<Reservation | null> {
    // La date de début ne doit pas être après la date de fin
    if (dateDebut >= dateFin) {
      throw new BadRequestException(
        'La date de début doit précéder la date de fin.',
      );
    }

    // Requête pour trouver une réservation existante qui chevauche l'intervalle demandé
    const conflictReservation = await this.prisma.reservation.findFirst({
      where: {
        resourceId,
        status: {
          in: [Status.PENDING, Status.CONFIRMED], // Ne vérifie que les statuts actifs
        },
        OR: [
          // Chevauchement : Une réservation existante commence avant la fin de la nouvelle demande ET finit après le début de la nouvelle demande
          {
            dateDebut: { lt: dateFin },
            dateFin: { gt: dateDebut },
          },
        ],
      },
    });

    return conflictReservation;
  }

  /**
   * 1. Vérifie la disponibilité.
   * 2. Crée la réservation.
   * 3. Notifie le Locateur par email.
   * @param locataireId ID de l'utilisateur qui fait la demande.
   * @param dto Données de la réservation.
   */
  async createReservation(locataireId: string, dto: CreateReservationDto) {
    const resource = await this.prisma.resource.findUnique({
      where: { id: dto.resourceId },
      include: { owner: true }, // Inclure le Locateur pour l'email
    });

    if (!resource) {
      throw new NotFoundException(
        `Ressource avec ID ${dto.resourceId} introuvable.`,
      );
    }

    // Le locataire ne peut pas réserver sa propre ressource.
    if (resource.ownerId === locataireId) {
      throw new ForbiddenException(
        'Vous ne pouvez pas réserver votre propre ressource.',
      );
    }

    // 1. Détection de Conflit
    const conflict = await this.checkAvailability(
      dto.resourceId,
      dto.dateDebut,
      dto.dateFin,
    );
    if (conflict) {
      throw new BadRequestException(
        'Cette ressource est déjà réservée ou en attente de confirmation pour cette période.',
      );
    }

    // 2. Création de la Réservation
    const newReservation = await this.prisma.reservation.create({
      data: {
        ...dto,
        locataireId, // Ajout de l'ID du Locataire authentifié
        dateDebut: new Date(dto.dateDebut),
        dateFin: new Date(dto.dateFin),
      },
    });

    // 3. Notification par Email
    const locataire = await this.prisma.user.findUnique({
      where: { id: locataireId },
    });
    if (locataire) {
      await this.mailService.sendReservationNotification(
        resource.owner,
        locataire,
        newReservation,
        resource,
      );
    }

    return newReservation;
  }

  /**
   * Liste toutes les réservations faites par l'utilisateur connecté (Locataire).
   * @param locataireId ID de l'utilisateur Locataire.
   */
  async getReservationsMade(locataireId: string) {
    return this.prisma.reservation.findMany({
      where: { locataireId },
      orderBy: { createdAt: 'desc' },
      include: { resource: { include: { owner: true } } }, // Inclure la ressource et son propriétaire
    });
  }

  /**
   * Liste toutes les réservations reçues pour les ressources du Locateur connecté.
   * @param locateurId ID de l'utilisateur Locateur.
   */
  async getReservationsReceived(locateurId: string) {
    return this.prisma.reservation.findMany({
      where: {
        resource: {
          ownerId: locateurId, // Filtre par l'ID du Locateur propriétaire de la ressource
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        locataire: {
          select: { id: true, email: true, username: true, contactPhone: true },
        }, // Infos du Locataire
        resource: true,
      },
    });
  }

  /**
   * Annulation de la réservation par le Locataire.
   * @param reservationId ID de la réservation à annuler.
   * @param locataireId ID de l'utilisateur qui fait l'annulation.
   */
  async deleteReservation(reservationId: string, locataireId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      throw new NotFoundException(
        `Réservation avec ID ${reservationId} introuvable.`,
      );
    }

    // Vérifie si l'utilisateur est bien le créateur de la réservation
    if (reservation.locataireId !== locataireId) {
      throw new ForbiddenException(
        'Vous ne pouvez annuler que vos propres réservations.',
      );
    }

    // Seules les réservations en attente (PENDING) peuvent être annulées par le Locataire
    if (reservation.status !== Status.PENDING) {
      throw new BadRequestException(
        `Impossible d'annuler une réservation avec le statut ${reservation.status}.`,
      );
    }

    // Le plus simple est de mettre le statut à CANCELED au lieu de la supprimer de la DB
    return this.prisma.reservation.update({
      where: { id: reservationId },
      data: { status: Status.CANCELED },
    });
  }

  /**
   * Mise à jour du statut par le Locateur (Propriétaire de la Ressource).
   * @param reservationId ID de la réservation.
   * @param locateurId ID de l'utilisateur Locateur.
   * @param dto Nouveau statut.
   */
  async updateReservationStatus(
    reservationId: string,
    locateurId: string,
    dto: UpdateStatusDto,
  ) {
    // 1. Vérifier si la réservation existe et obtenir la ressource
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { resource: true }, // Inclure la ressource
    });

    if (!reservation) {
      throw new NotFoundException(
        `Réservation avec ID ${reservationId} introuvable.`,
      );
    }

    // 2. Vérifier si l'utilisateur est bien le propriétaire de la ressource
    if (reservation.resource.ownerId !== locateurId) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à modifier le statut de cette réservation.",
      );
    }

    // 3. Mise à jour du statut
    return this.prisma.reservation.update({
      where: { id: reservationId },
      data: { status: dto.status },
    });
  }
}
