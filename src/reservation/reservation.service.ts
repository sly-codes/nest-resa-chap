import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Reservation, Status } from '@prisma/client';
import { MailService } from 'src/mail/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationQueryDto } from './dto';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Injectable()
export class ReservationService {
  private readonly logger = new Logger(ReservationService.name);
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

    try {
      // 4. Notifications
      // a) Notification au Locateur : Nouvelle demande reçue
      await this.mailService.sendNewRequestToLocateur(
        resource.owner,
        newReservation.locataire,
        newReservation,
        resource,
      );
      // b) ✅ NOUVEAU: Notification au Locataire : Confirmation de l'enregistrement de la demande
      await this.mailService.sendRequestConfirmationToLocataire(
        newReservation.locataire,
        newReservation,
        resource,
      );
    } catch (error) {
      this.logger.error(
        "Échec de la notification par email. Poursuite de l'opération.",
        error.stack,
      );
    }

    return newReservation;
  }

  /**
   * Liste toutes les réservations faites par l'utilisateur connecté avec filtres.
   */
  async getReservationsMade(
    locataireId: string,
    query: PaginationQueryDto, // ✨ Accepter le DTO de requête
  ) {
    const { page = 1, limit = 10, search, status } = query;
    const skip = (page - 1) * limit;

    // Construction dynamique des filtres
    const where: any = {
      locataireId,
      ...(status && { status }), // Ajoute { status: Status.XXX } si status est présent
      ...(search && {
        resource: {
          name: {
            contains: search, // Recherche par nom de ressource
            mode: 'insensitive', // Optionnel, mais recommandé pour MySQL/Postgres
          },
        },
      }),
    };

    const [reservations, total] = await this.prisma.$transaction([
      // 1. Récupération des données paginées et filtrées
      this.prisma.reservation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          resource: {
            select: {
              name: true,
              type: true,
              owner: { select: { email: true } },
            },
          },
        },
      }),
      // 2. Comptage total pour la pagination
      this.prisma.reservation.count({ where }),
    ]);

    return {
      data: reservations,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  /**
   * Annulation de la réservation par le Locataire.
   */
  async deleteReservation(reservationId: string, locataireId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        resource: { include: { owner: true } }, // ✅ Inclure Locateur et Ressource
        locataire: true, // ✅ Inclure Locataire
      },
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
    const canceledReservation = await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { status: Status.CANCELED },
    });

    // 5. ✅ NOUVEAU: Notification au Locateur de l'annulation
    await this.mailService.sendCancellationToLocateur(
      reservation.resource.owner,
      reservation.locataire,
      canceledReservation,
      reservation.resource,
    );

    return canceledReservation;
  }

  // ----------------------------------------------------
  // LOGIQUE LOCATEUR (Gestion des Réservations Reçues)
  // ----------------------------------------------------

  /**
   * Liste toutes les réservations reçues pour les ressources du Locateur connecté avec filtres.
   */
  async getReservationsReceived(
    locateurId: string,
    query: PaginationQueryDto, // ✨ Accepter le DTO de requête
  ) {
    const { page = 1, limit = 10, search, status } = query;
    const skip = (page - 1) * limit;

    // Construction dynamique des filtres
    const where: any = {
      resource: {
        ownerId: locateurId, // Filtrage par propriété de la ressource
        ...(search && {
          name: {
            contains: search, // Recherche par nom de ressource
            mode: 'insensitive',
          },
        }),
      },
      ...(status && { status }), // Ajoute le filtre de statut si présent
    };

    const [reservations, total] = await this.prisma.$transaction([
      // 1. Récupération des données paginées et filtrées
      this.prisma.reservation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          locataire: {
            select: {
              id: true,
              email: true,
              username: true,
              contactPhone: true,
            },
          },
          resource: { select: { name: true, type: true } },
        },
      }),
      // 2. Comptage total pour la pagination
      this.prisma.reservation.count({ where }),
    ]);

    return {
      data: reservations,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async updateReservationStatus(
    reservationId: string,
    locateurId: string,
    dto: UpdateStatusDto,
  ) {
    // 1. Vérifier si la réservation existe et qu'elle appartient à la ressource du Locateur.
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      // ✅ Inclure le locataire et la ressource pour la notification email
      include: { resource: { include: { owner: true } }, locataire: true },
    });

    if (!reservation) {
      throw new NotFoundException(
        `Réservation avec ID ${reservationId} introuvable.`,
      );
    } // 2. Vérification d'autorisation

    if (reservation.resource.ownerId !== locateurId) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à modifier le statut de cette réservation.",
      );
    }

    if (dto.status === Status.CONFIRMED) {
      // ... (LOGIQUE DE CONFLIT DÉTAILLÉE CI-DESSUS) ...
      const conflict = await this.prisma.reservation.findFirst({
        where: {
          id: { not: reservationId }, // Exclure la réservation que nous traitons
          resourceId: reservation.resourceId,
          status: { in: [Status.PENDING, Status.CONFIRMED] },
          OR: [
            {
              dateDebut: { lt: reservation.dateFin },
              dateFin: { gt: reservation.dateDebut },
            },
          ],
        },
      });
      if (conflict) {
        throw new BadRequestException(
          'Une autre réservation bloque déjà cette période. Impossible de confirmer.',
        );
      }
    }

    // 4. Mise à jour du statut
    const updatedReservation = await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { status: dto.status },
    });

    // 5. ✅ NOUVEAU: Notification au Locataire du changement de statut
    if (dto.status === Status.CONFIRMED || dto.status === Status.REJECTED) {
      await this.mailService.sendStatusChangeToLocataire(
        reservation.locataire,
        updatedReservation,
        reservation.resource,
        dto.status,
      );
    }

    return updatedReservation;
  }

  // ----------------------------------------------------
  // DÉTAILS DE RÉSERVATION (Pour affichage complet)
  // ----------------------------------------------------

  /**
   * Récupère les détails complets d'une réservation par ID
   * avec toutes les informations de la ressource et des utilisateurs
   */
  async getReservationById(reservationId: string, userId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        resource: {
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                contactPhone: true,
                profilePictureUrl: true,
              },
            },
          },
        },
        locataire: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            contactPhone: true,
            profilePictureUrl: true,
          },
        },
      },
    });

    if (!reservation) {
      throw new NotFoundException(
        `Réservation avec ID ${reservationId} introuvable.`,
      );
    }

    // Vérification des autorisations : seul le locataire ou le propriétaire de la ressource peut voir les détails
    if (
      reservation.locataireId !== userId &&
      reservation.resource.ownerId !== userId
    ) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à voir les détails de cette réservation.",
      );
    }

    return reservation;
  }
}
