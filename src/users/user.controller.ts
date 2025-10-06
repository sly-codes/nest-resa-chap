import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AtGuard } from 'src/common/guards';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateUserDto } from './dto';

@ApiTags('Users / Profil')
@Controller('users')
@UseGuards(AtGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({
    summary: "Obtenir les données du profil de l'utilisateur connecté",
  })
  getMe(@CurrentUser('id') userId: string) {
    return this.userService.findMe(userId);
  }

  @Patch('me')
  @ApiOperation({
    summary: "Mettre à jour les informations du profil de l'utilisateur",
  })
  updateMe(
    @CurrentUser('id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    // Vérifiez que le DTO n'est pas vide pour éviter une requête inutile à la BDD
    if (Object.keys(updateUserDto).length === 0) {
      return this.userService.findMe(userId);
    }
    return this.userService.updateProfile(userId, updateUserDto);
  }
}
