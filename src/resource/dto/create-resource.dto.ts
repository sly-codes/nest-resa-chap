
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


export class CreateResourceDto {
  @ApiProperty({ 
    description: 'Nom de la ressource (ex: Salle de conférence)',
    minLength: 3,
    maxLength: 100 
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty({ 
    description: 'Description détaillée de la ressource',
    required: false
  })
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ 
    description: 'Type de ressource (ROOM ou MATERIAL)',
  })
  @IsNotEmpty()
  @IsString()
  type: string;
}

