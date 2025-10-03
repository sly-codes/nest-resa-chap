import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { MailService } from 'src/mail/mail.service';
import { Reservation, Status } from '@prisma/client';

@Injectable()
export class ReservationService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService, // ✅ Injection du service mail
  ) {}

  /**
   * Logique de détection de chevauchement d'horaire.
   * On cherche des réservations actives (PENDING ou CONFIRMED) qui se superposent.
   */
  private async checkAvailability(
    resourceId: string,
    dateDebut: Date,
    dateFin: Date,
  ): Promise<Reservation | null> {
    if (dateDebut >= dateFin) {
      throw new BadRequestException(
        'La date de début doit précéder la date de fin.',
      );
    }

    const conflictReservation = await this.prisma.reservation.findFirst({
      where: {
        resourceId,
        status: {
          in: [Status.PENDING, Status.CONFIRMED], // Seules ces réservations bloquent
        },
        OR: [
          // Logique de collision A: L'existante commence avant la fin de la nouvelle ET finit après le début de la nouvelle
          {
            dateDebut: { lt: dateFin },
            dateFin: { gt: dateDebut },
          },
        ],
      },
    });

    return conflictReservation;
  }

  // ----------------------------------------------------
  // LOGIQUE LOCATAIRE (CRUD de Réservation)
  // ----------------------------------------------------

  /**
   * Crée une demande de réservation et notifie le Locateur.
   * @param locataireId ID de l'utilisateur qui fait la demande.
   * @param dto Données de la réservation.
   */
  async createReservation(locataireId: string, dto: CreateReservationDto) {
    const startDate = new Date(dto.dateDebut);
    const endDate = new Date(dto.dateFin);

    // 1. Charger la ressource (incluant son propriétaire pour la sécurité et l'email)
    const resource = await this.prisma.resource.findUnique({
      where: { id: dto.resourceId },
      include: { owner: true },
    });

    if (!resource) {
      throw new NotFoundException(
        `Ressource avec ID ${dto.resourceId} introuvable.`,
      );
    }

    // Sécurité: Le locataire ne peut pas réserver sa propre ressource.
    if (resource.ownerId === locataireId) {
      throw new ForbiddenException(
        'Vous ne pouvez pas réserver votre propre ressource.',
      );
    }

    // 2. Détection de Conflit
    const conflict = await this.checkAvailability(
      dto.resourceId,
      startDate,
      endDate,
    );
    if (conflict) {
      throw new BadRequestException(
        'Cette ressource est déjà réservée ou en attente de confirmation pour cette période.',
      );
    }

    // 3. Création de la Réservation (Statut PENDING par défaut)
    const newReservation = await this.prisma.reservation.create({
      data: {
        ...dto,
        locataireId, // Ajout de l'ID du Locataire authentifié
        dateDebut: startDate,
        dateFin: endDate,
      },
      include: {
        // Inclure les données pour l'email
        resource: true,
        locataire: true,
      },
    });

    // 4. Notification par Email au Locateur
    await this.mailService.sendReservationNotification(
      resource.owner,
      newReservation.locataire, // Le locataire est inclus dans newReservation
      newReservation,
      resource,
    );

    return newReservation;
  }

  /**
   * Liste toutes les réservations faites par l'utilisateur connecté.
   */
  async getReservationsMade(locataireId: string) {
    return this.prisma.reservation.findMany({
      where: { locataireId },
      orderBy: { createdAt: 'desc' },
      include: {
        resource: {
          select: {
            name: true,
            type: true,
            owner: { select: { email: true } },
          },
        },
      },
    });
  }

  /**
   * Annulation de la réservation par le Locataire.
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

    // Autorisation: Seul le créateur peut annuler.
    if (reservation.locataireId !== locataireId) {
      throw new ForbiddenException(
        'Vous ne pouvez annuler que vos propres réservations.',
      );
    }

    // Condition: Seules les réservations en attente (PENDING) peuvent être annulées.
    if (reservation.status !== Status.PENDING) {
      throw new BadRequestException(
        `Impossible d'annuler une réservation avec le statut ${reservation.status}. Seules les demandes PENDING peuvent être annulées.`,
      );
    }

    // Passage du statut à CANCELED (pas de suppression physique)
    return this.prisma.reservation.update({
      where: { id: reservationId },
      data: { status: Status.CANCELED },
    });
  }

  // ----------------------------------------------------
  // LOGIQUE LOCATEUR (Gestion des Réservations Reçues)
  // ----------------------------------------------------

  /**
   * Liste toutes les réservations reçues pour les ressources du Locateur connecté.
   */
  async getReservationsReceived(locateurId: string) {
    return this.prisma.reservation.findMany({
      where: {
        resource: {
          ownerId: locateurId, // Filtrage par propriété de la ressource
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        locataire: {
          select: { id: true, email: true, username: true, contactPhone: true },
        },
        resource: { select: { name: true, type: true } },
      },
    });
  }

  /**
   * Mise à jour du statut par le Locateur (Propriétaire de la Ressource).
   */
  async updateReservationStatus(
    reservationId: string,
    locateurId: string,
    dto: UpdateStatusDto,
  ) {
    // 1. Vérifier si la réservation existe et qu'elle appartient à la ressource du Locateur.
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { resource: true },
    });

    if (!reservation) {
      throw new NotFoundException(
        `Réservation avec ID ${reservationId} introuvable.`,
      );
    }

    // 2. Vérification d'autorisation
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
