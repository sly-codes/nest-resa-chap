import {
  Controller,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminService, DashboardMetrics } from './admin.service';
import { AtGuard } from 'src/common/guards';
import { RolesGuard } from '../common/guards/roles.guard'; 
import { Roles } from 'src/common/decorators';

@UseGuards(AtGuard, RolesGuard) // 1. Vérification JWT, 2. Vérification Rôle
@Roles('SUPER_ADMIN') // Seuls les Super Admins peuvent accéder à toutes les routes de ce contrôleur
@Controller('admin/dashboard')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('metrics')
  @HttpCode(HttpStatus.OK)
  // Assure le typage du retour
  async getMetrics(): Promise<DashboardMetrics> {
    return this.adminService.getDashboardMetrics();
  }
}
