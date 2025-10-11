// ... autres types

export interface SocialUserDto {
  email: string;
  firstName: string;
  lastName?: string;
  provider: 'GOOGLE' | 'GITHUB';
  providerId: string;
}

