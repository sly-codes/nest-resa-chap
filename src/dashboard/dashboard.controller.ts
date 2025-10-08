import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { AtGuard } from 'src/common/guards';
import { CurrentUser } from 'src/common/decorators';
import { DashboardSummaryDto } from './dto';

@ApiTags('Dashboard (Vue Résumé Utilisateur)')
@UseGuards(AtGuard)
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('summary') // -> /dashboard/summary
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "PROTÉGÉ : Récupérer toutes les données de résumé pour le tableau de bord de l'utilisateur.",
  })
  @ApiResponse({ status: 200, type: DashboardSummaryDto })
  getDashboardSummary(@CurrentUser('id') userId: string) {
    return this.dashboardService.getSummary(userId);
  }
}
