import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn, MaxLength } from 'class-validator';
import { ResourceTypes } from './resource-types.dto'; // 💡 IMPORT

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
  @IsIn(ResourceTypes)
  type?: 'ROOM' | 'EQUIPMENT';

  // 💡 NOUVEAU: Filtre par Ville
  @ApiProperty({
    description: 'Filtre par ville.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  city?: string;
}
