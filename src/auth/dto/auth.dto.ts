import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthDto {
  @ApiProperty({ description: "Adresse email de l'utilisateur", example: 'locateur@resachap.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Mot de passe (minimum 6 caractères)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

