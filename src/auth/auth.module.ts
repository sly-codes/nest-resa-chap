import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { AtStrategy, RtStrategy } from './strategies';

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
  ],
})
export class AuthModule {}
