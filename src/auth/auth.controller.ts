import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators';
import { AtGuard, RtGuard } from 'src/common/guards';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';
import { Tokens } from './types';
// 🚨 CORRECTION TS1272 : On utilise 'import type' car Response est un type dans un décorateur
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

@ApiTags('Authentification (Locateur)')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

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

  // ----------------------------------------------------
  // NOUVEAUX ENDPOINTS GOOGLE
  // ----------------------------------------------------

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Déclenche la connexion via Google OAuth' })
  googleAuth(): void {
    // La redirection vers Google est gérée par NestJS/Passport
  }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(
    @Req() req,
    // La redirection fonctionne si passthrough est utilisé ou si l'on omet le type de retour
    // Pour la propreté, on garde l'usage de @Res
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const tokens = req.user; // Les tokens JWT

    // L'URL de votre route Angular pour gérer le callback
    const frontendCallbackUrl = `${this.configService.get<string>('CLIENT_URL')}/auth/callback`;

    // res.redirect est la méthode Express correcte
    res.redirect(
      `${frontendCallbackUrl}?at=${tokens.access_token}&rt=${tokens.refresh_token}`,
    );
  }

  // ----------------------------------------------------
  // NOUVEAUX ENDPOINTS GITHUB
  // ----------------------------------------------------

  @Get('github')
  @UseGuards(AuthGuard('github')) // Utilise le Guard GitHub pour la redirection
  @ApiOperation({ summary: 'Déclenche la connexion via GitHub OAuth' })
  githubAuth(): void {
    // NestJS/Passport gère la redirection vers GitHub
  }

  @Get('github/redirect')
  @UseGuards(AuthGuard('github'))
  async githubAuthRedirect(
    @Req() req,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const tokens = req.user; // Les tokens JWT générés par votre service

    // 🚨 IMPORTANT : Le path Angular doit correspondre au nouveau callback 🚨
    const frontendCallbackUrl = `${this.configService.get<string>('CLIENT_URL')}/auth/callback`;

    // Redirection vers le frontend
    res.redirect(
      `${frontendCallbackUrl}?at=${tokens.access_token}&rt=${tokens.refresh_token}`,
    );
  }
}
