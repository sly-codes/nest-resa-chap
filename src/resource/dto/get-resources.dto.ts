import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn, MaxLength } from 'class-validator';

// Définissez les types de ressource disponibles
export const ResourceTypes = ['ROOM', 'EQUIPMENT'];

export class GetResourcesDto {
  @ApiProperty({
    description:
      'Terme de recherche pour le nom ou la description de la ressource.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiProperty({
    description: 'Filtre par type de ressource.',
    required: false,
    enum: ResourceTypes,
  })
  @IsOptional()
  @IsString()
  // Valide que la valeur est bien un des types autorisés
  @IsIn(ResourceTypes)
  type?: 'ROOM' | 'EQUIPMENT';
}
