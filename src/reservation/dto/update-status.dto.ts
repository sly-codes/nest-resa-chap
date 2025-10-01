import { ApiProperty } from '@nestjs/swagger';
import { Status } from '@prisma/client';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateStatusDto {
  @ApiProperty({
    description:
      'Nouveau statut de la réservation (PENDING, CANCELED ou CONFIRMED)',
  })
  @IsString()
  @IsNotEmpty()
  status: Status;
}
