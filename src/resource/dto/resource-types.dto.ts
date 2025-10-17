import { PriceUnit } from '@prisma/client'; // Importer l'énum de Prisma

// Types de ressource
export const ResourceTypes = ['ROOM', 'EQUIPMENT'];

// Unités de prix pour les validateurs
export const PriceUnits = Object.values(PriceUnit);
