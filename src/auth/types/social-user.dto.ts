// ... autres types

import { Provider } from '@prisma/client';

// export interface SocialUserDto {
//   email: string;
//   firstName: string;
//   lastName?: string;
//   provider: 'GOOGLE' | 'GITHUB';
//   providerId: string;
// }

// ... autres types existants
export interface SocialUserDto {
  email: string;
  firstName: string;
  lastName?: string;
  provider: Provider; // Utilisons l'enum Prisma pour plus de rigueur
  providerId: string;
}
