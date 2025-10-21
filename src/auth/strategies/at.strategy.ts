import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../types'; // Importez le type mis à jour
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_AT_SECRET'),
    } as any);
  } // 💡 Le retour est désormais typé avec le rôle

  validate(payload: JwtPayload) {
    // Le payload complet (avec 'id', 'email', et 'role') est attaché à request.user
    return payload;
  }
}
