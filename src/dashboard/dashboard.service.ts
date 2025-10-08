import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Status } from '@prisma/client';
import { DashboardSummaryDto, NextReservation, PendingApproval } from './dto';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  /**
   * Récupère toutes les données résumées nécessaires pour le Dashboard d'un utilisateur.
   * @param userId L'ID de l'utilisateur connecté.
   * @returns Un objet DTO complet.
   */
  async getSummary(userId: string): Promise<DashboardSummaryDto> {
    // --- 1. Statistiques de Ressources (Côté Locateur) ---
    const myResourceCount = await this.prisma.resource.count({
      where: { ownerId: userId },
    });

    // --- 2. Réservations en attente (Côté Locateur) ---
    const userResources = await this.prisma.resource.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });
    const userResourceIds = userResources.map((r) => r.id);

    const pendingApprovalCount = await this.prisma.reservation.count({
      where: {
        resourceId: { in: userResourceIds },
        status: Status.PENDING,
      },
    });

    const nextPendingApprovalRaw = await this.prisma.reservation.findFirst({
      where: {
        resourceId: { in: userResourceIds },
        status: Status.PENDING,
        // On cherche une réservation qui n'a pas encore commencée
        dateDebut: { gt: new Date() },
      },
      orderBy: { dateDebut: 'asc' },
      select: {
        id: true,
        dateDebut: true,
        resource: { select: { name: true } },
      },
    });

    let nextPendingApproval: PendingApproval | null = null;
    if (nextPendingApprovalRaw) {
      nextPendingApproval = {
        id: nextPendingApprovalRaw.id,
        resourceName: nextPendingApprovalRaw.resource.name,
        startDate: nextPendingApprovalRaw.dateDebut,
      };
    }

    // --- 3. Prochaine Réservation faite (Côté Locataire) ---
    const nextReservationMadeRaw = await this.prisma.reservation.findFirst({
      where: {
        locataireId: userId,
        // On cherche une réservation qui n'a pas encore commencée
        dateDebut: { gt: new Date() },
      },
      orderBy: { dateDebut: 'asc' },
      select: {
        id: true,
        dateDebut: true,
        status: true,
        resource: { select: { name: true } },
      },
    });

    let nextReservationMade: NextReservation | null = null;
    if (nextReservationMadeRaw) {
      nextReservationMade = {
        id: nextReservationMadeRaw.id,
        resourceName: nextReservationMadeRaw.resource.name,
        startDate: nextReservationMadeRaw.dateDebut,
        status: nextReservationMadeRaw.status,
      };
    }

    // --- 4. Comptage des Réservations Actives/Futures (Côté Locataire) ---
    const myReservationsCount = await this.prisma.reservation.count({
      where: {
        locataireId: userId,
        // On compte les réservations qui n'ont pas encore commencé
        dateDebut: { gt: new Date() },
        // Exclure les statuts terminaux qui ne sont plus "actifs" ou "futurs"
        status: { notIn: [Status.CANCELED, Status.REJECTED] },
      },
    });

    // --- 5. Assemblage du DTO ---
    return {
      myResourceCount,
      pendingApprovalCount,
      myReservationsCount, // ✨ AJOUTÉ
      nextReservationMade,
      nextPendingApproval,
    };
  }
}
