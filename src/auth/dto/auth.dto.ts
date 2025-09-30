import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO utilisé pour l'inscription (signup) et la connexion (signin) du Locateur.
 */
export class AuthDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Adresse email unique du Locateur',
    example: 'locateur@resachap.com',
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères.',
  })
  @ApiProperty({
    description: 'Mot de passe sécurisé (min 8 caractères)',
    example: 'MotDePasse123!',
  })
  password: string;
}
