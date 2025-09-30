import {
  IsNotEmpty,
  IsString,
  IsIn,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateResourceDto {
  @ApiProperty({
    description: 'Nom de la ressource (ex: Salle 101, Vidéoprojecteur Alpha)',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Description détaillée de la ressource',
    required: false,
  })
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Type de ressource (salle, materiel, etc)',
  })
  @IsNotEmpty()
  @IsString()
  type: string;
}
