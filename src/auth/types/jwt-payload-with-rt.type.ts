import { JwtPayload } from './jwt-payload.type';

// Le payload du Refresh Token (contient le token brut en plus)
export type JwtPayloadWithRt = JwtPayload & {
  refreshToken: string;
};
