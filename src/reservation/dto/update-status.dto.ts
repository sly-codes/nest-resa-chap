import { ApiProperty } from '@nestjs/swagger';
import { Status } from '@prisma/client';
import { IsNotEmpty, IsString, IsEnum } from 'class-validator';

export class UpdateStatusDto {
  @ApiProperty({
    description:
      'Nouveau statut de la réservation (PENDING, CANCELED, CONFIRMED ou REJECTED)', 
    enum: [Status.PENDING, Status.CANCELED, Status.CONFIRMED, Status.REJECTED],
  }) 
  @IsEnum(Status)
  @IsNotEmpty()
  status: Status;
}
