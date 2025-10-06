import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsPhoneNumber,
  MaxLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ required: false, description: "Nom d'utilisateur public" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  username?: string;

  @ApiProperty({ required: false, description: "Prénom de l'utilisateur" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @ApiProperty({
    required: false,
    description: "Nom de famille de l'utilisateur",
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @ApiProperty({
    required: false,
    description: 'Numéro de téléphone de contact',
  })
  @IsOptional()
  @IsString() // ou @IsPhoneNumber si vous utilisez 'class-validator' avec une locale spécifique
  contactPhone?: string;
}
