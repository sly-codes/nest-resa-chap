// src/resources/dto/create-resource.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer'; // 💡 NOUVEAU IMPORT
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PriceUnits, ResourceTypes } from './resource-types.dto';

export class CreateResourceDto {
  @ApiProperty({
    description: 'Nom de la ressource',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Description détaillée', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ description: 'Type de ressource', enum: ResourceTypes })
  @IsNotEmpty()
  @IsString()
  @IsIn(ResourceTypes)
  type: string;

  // 💡 CORRECTION MAJEURE ICI : Assurer la conversion en nombre
  @ApiProperty({
    description: 'Prix de la ressource',
    type: 'number',
    minimum: 0,
  })
  @Type(() => Number) // 👈 CONVERSION EXPLICITE EN NOMBRE
  @IsNumber()
  @Min(0) // 👈 Le validateur Min(0) est correct
  @IsPositive({ message: 'price must be a positive number' }) // 👈 Optionnel : assure que le prix est > 0 (si c'est la règle)
  price: number;

  @ApiProperty({ description: 'Unité de tarification', enum: PriceUnits })
  @IsString()
  @IsNotEmpty()
  @IsIn(PriceUnits)
  priceUnit: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';

  // ... (Champs de Localisation inchangés) ...
  @ApiProperty({
    description: 'Pays où se situe la ressource',
    required: false,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  country?: string;

  @ApiProperty({
    description: 'Ville où se situe la ressource',
    required: false,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  city?: string;

  @ApiProperty({
    description: 'Adresse précise (peut être optionnelle si non publique)',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;
}
