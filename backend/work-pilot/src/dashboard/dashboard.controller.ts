import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import type { TimeRange } from './dashboard.service'; // ✅ import type
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard'; // ✅ vérifie le nom exact

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getDashboard(
    @Req() req: { user: { id: number } },
    @Query('range') range?: TimeRange,
  ) {
    return this.dashboardService.getDashboardData(req.user.id, range ?? '30d');
  }
}
