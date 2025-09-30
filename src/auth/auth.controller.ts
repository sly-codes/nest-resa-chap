import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';
import { Tokens } from './types';
import { AtGuard, RtGuard } from 'src/common/guards'; // Les Guards 
import { CurrentUser } from 'src/common/decorators';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Authentification (Locateur)')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('local/signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Inscription du Locateur' })
  @ApiResponse({ status: 201, description: 'Compte créé et tokens générés.' })
  signupLocal(@Body() dto: AuthDto): Promise<Tokens> {
    return this.authService.signupLocal(dto);
  }

  @Post('local/signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion du Locateur' })
  @ApiResponse({ status: 200, description: 'Tokens AT et RT générés.' })
  signinLocal(@Body() dto: AuthDto): Promise<Tokens> {
    return this.authService.signinLocal(dto);
  }

  // Protégé par l'Access Token
  @UseGuards(AtGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Déconnexion (Invalide le Refresh Token)' })
  logout(@CurrentUser('id') userId: string) {
    return this.authService.logout(userId);
  }

  // Protégé par le Refresh Token
  @UseGuards(RtGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Rafraîchissement des tokens (Utilise le Refresh Token)',
  })
  refreshToken(@CurrentUser() user: any): Promise<Tokens> {
    return this.authService.refreshTokens(user.id, user.refreshToken);
  }
}
