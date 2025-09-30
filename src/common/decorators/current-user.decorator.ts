import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload, JwtPayloadWithRt } from 'src/auth/types';

/**
 * Décorateur personnalisé pour injecter l'utilisateur actuellement authentifié.
 * L'objet utilisateur est attaché à `request.user` par le Guard JWT.
 */
export const CurrentUser = createParamDecorator(
  ( data: keyof JwtPayload | keyof JwtPayloadWithRt | undefined,
    ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    // Si aucune clé n'est passée (@CurrentUser()), on retourne l'objet complet
    if (data) {
      return request.user[data];
    }

    // Si une clé est passée (@CurrentUser('id')), on retourne la propriété
    return request.user;
  },
);
