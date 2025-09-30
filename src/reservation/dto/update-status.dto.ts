import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { Status } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

// Liste des statuts possibles pour la mise à jour par le locateur
const availableStatuses: Status[] = ['PENDING', 'CANCELED'];

export class UpdateStatusDto {
  @ApiProperty({
    description: 'Nouveau statut de la réservation (PENDING ou CANCELED)',
    enum: availableStatuses,
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(availableStatuses, {
    message: `Le statut doit être l'un des suivants: ${availableStatuses.join(', ')}`,
  })
  status: Status;
}
