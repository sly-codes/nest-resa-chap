import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ROLES_KEY } from '../decorators';
import { JwtPayload, UserRole } from '../../auth/types'; // Importez vos types

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // 1. Récupérer les rôles requis par le décorateur @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    // 2. Récupérer l'utilisateur (le payload JWT) attaché par le AtGuard
    const request = context.switchToHttp().getRequest();
    // Le type est sécurisé car le AtGuard a déjà validé et injecté request.user
    const user = request.user as JwtPayload;

    // 3. Vérifier si le rôle de l'utilisateur (présent dans le JWT) est autorisé.
    return requiredRoles.some((role) => user.role === role);
  }
}
