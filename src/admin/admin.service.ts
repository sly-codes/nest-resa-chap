import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Status, Provider } from '@prisma/client';

// --- NOUVEAU : Interface pour le résultat de Prisma.groupBy ---
// Ceci est crucial pour résoudre l'erreur de typage
interface ResourceTypeCount {
  type: string;
  _count: {
    id: number;
  } | null; // Bien que non null, on garde le typage strict pour la sécurité
}

// Structure pour le retour de l'API (Reste inchangée)
export interface DashboardMetrics {
  users: {
    total: number;
    verified: number;
    local: number;
    recent: {
      id: string;
      email: string;
      createdAt: Date;
      provider: Provider;
    }[];
  };
  resources: {
    total: number;
    recentLastWeek: number;
    typesCount: { type: string; count: number }[];
  };
  reservations: {
    total: number;
    pending: number;
    confirmed: number;
    recent: any[];
  };
  finance: {
    potentialRevenueFromConfirmedReservations: number;
  };
}

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  /**
   * Récupère toutes les métriques pour le tableau de bord Super Admin.
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // --- 1. Requêtes Agrégées (Utilisation de $transaction pour l'efficacité) ---
    const [
      totalUsers,
      verifiedUsers,
      localUsers,
      totalResources,
      recentResources,
      totalReservations,
      pendingReservations,
      confirmedReservations,
      resourcesByTypeRaw,
    ] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isVerified: true } }),
      this.prisma.user.count({ where: { provider: Provider.LOCAL } }),
      this.prisma.resource.count(),
      this.prisma.resource.count({ where: { createdAt: { gte: oneWeekAgo } } }),
      this.prisma.reservation.count(),
      this.prisma.reservation.count({ where: { status: Status.PENDING } }),
      this.prisma.reservation.count({ where: { status: Status.CONFIRMED } }),

      this.prisma.resource.groupBy({
        by: ['type'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
    ]);

    // 🚨 CORRECTION TS2339 / TS18048 : Forcer le type et mapper proprement.
    const resourcesByType = resourcesByTypeRaw as ResourceTypeCount[];

    // --- 2. Requêtes détaillées (5 dernières) ---
    const recentUsers = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, email: true, createdAt: true, provider: true },
    });

    const recentReservations = await this.prisma.reservation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        status: true,
        createdAt: true,
        locataire: { select: { email: true } },
        resource: { select: { name: true, price: true, priceUnit: true } },
      },
    });

    // --- 3. Calcul du Revenu Potentiel ---
    const confirmedReservationsWithPrice =
      await this.prisma.reservation.findMany({
        where: { status: Status.CONFIRMED },
        select: {
          resource: { select: { price: true } },
        },
      });

    const potentialRevenue = confirmedReservationsWithPrice.reduce(
      (sum, res) => sum + res.resource.price,
      0,
    );

    // 🚨 CORRECTION de la fonction de mapping (l'ancienne ligne 112 est ici)
    const typesCount = resourcesByType.map((rt) => {
      // Grâce au typage forcé, nous pouvons utiliser l'opérateur de chaînage optionnel en toute confiance.
      const count = rt._count?.id ?? 0;
      return {
        type: rt.type,
        count: count,
      };
    });

    return {
      users: {
        total: totalUsers,
        verified: verifiedUsers,
        local: localUsers,
        recent: recentUsers,
      },
      resources: {
        total: totalResources,
        recentLastWeek: recentResources,
        typesCount: typesCount,
      },
      reservations: {
        total: totalReservations,
        pending: pendingReservations,
        confirmed: confirmedReservations,
        recent: recentReservations.map((r) => ({
          id: r.id,
          status: r.status,
          createdAt: r.createdAt,
          locataireEmail: r.locataire.email,
          resourceName: r.resource.name,
          resourcePrice: r.resource.price,
          resourcePriceUnit: r.resource.priceUnit,
        })),
      },
      finance: {
        potentialRevenueFromConfirmedReservations: potentialRevenue,
      },
    };
  }
}
