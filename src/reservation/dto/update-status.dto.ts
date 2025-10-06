import { ApiProperty } from '@nestjs/swagger';
// ✅ Import de Status
import { Status } from '@prisma/client';
// ✅ Import de IsEnum
import { IsNotEmpty, IsString, IsEnum } from 'class-validator';

export class UpdateStatusDto {
  @ApiProperty({
    description:
      'Nouveau statut de la réservation (PENDING, CANCELED, CONFIRMED ou REJECTED)', // ✅ Assurez-vous d'inclure REJECTED ici
    enum: [Status.PENDING, Status.CANCELED, Status.CONFIRMED, Status.REJECTED],
  }) // ⚠️ Remplacer @IsString() par @IsEnum(Status)
  @IsEnum(Status)
  @IsNotEmpty() // ⚠️ Le type doit être Status, pas String
  status: Status;
}
