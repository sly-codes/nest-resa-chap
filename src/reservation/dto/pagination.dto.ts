import { ApiProperty } from '@nestjs/swagger';
import { Status } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
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
  limit?: number = 10;

  @ApiProperty({
    description: 'Terme de recherche pour filtrer par nom de ressource',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Filtrer par statut de réservation (PENDING, CONFIRMED, etc.)',
    required: false,
    enum: Status,
  })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
