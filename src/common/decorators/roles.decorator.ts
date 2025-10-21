import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/auth/types'; // Importez le type de rôle

export const ROLES_KEY = 'roles';

/**
 * Décorateur pour spécifier les rôles autorisés pour une route donnée.
 * Exemple: @Roles('SUPER_ADMIN')
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
