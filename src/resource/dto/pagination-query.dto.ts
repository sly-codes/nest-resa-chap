// Fichier: ./dto/pagination-query.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQueryDto {
  @ApiProperty({
    description: 'Numéro de page pour la pagination',
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number) // ✨ Nécessaire pour convertir le paramètre de requête en nombre
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: "Nombre d'éléments par page",
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 12;

  @ApiProperty({
    description: 'Terme de recherche pour filtrer par nom/description',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;
}

// J'assume que vous avez également une interface pour le retour paginé
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
