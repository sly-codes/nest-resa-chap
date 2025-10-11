import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AtStrategy, RtStrategy } from './strategies';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';

// Vous devrez implémenter les classes AtStrategy et RtStrategy dans src/auth/strategies
// et les AtGuard/RtGuard dans src/common/guards.

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({}), // Enregistre le module JWT (configuration dans le service)
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AtStrategy, // À décommenter une fois implémenté
    RtStrategy, // À décommenter une fois implémenté
    GoogleStrategy,
    GithubStrategy
  ],
})
export class AuthModule {}
