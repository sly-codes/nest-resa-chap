import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateReservationDto {
  @ApiProperty({ description: 'ID de la ressource à réserver', format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  resourceId: string;

  @ApiProperty({
    description: 'Nom du locataire',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  locataireNom: string;

  @ApiProperty({ description: 'Contact email du locataire' })
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  locataireEmail: string;

  @ApiProperty({ description: 'Contact numéro du locataire' })
  @IsString()
  @IsNotEmpty()
  locataireContact: string;

  @ApiProperty({
    description: 'Date et heure de début de la réservation (format ISO 8601)',
    example: '2025-10-30T10:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  dateDebut: Date;

  @ApiProperty({
    description: 'Date et heure de fin de la réservation (format ISO 8601)',
    example: '2025-10-30T12:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  dateFin: Date;

  @ApiProperty({ description: 'Notes ou demandes spéciales', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
