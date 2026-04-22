import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiQuery({ name: 'eventId', required: false, description: 'Optional Event ID to filter statistics' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for recent activity', example: '1' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit for recent activity', example: '5' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  getDashboardStats(
    @Query('eventId') eventId?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '5'
  ) {
    return this.dashboardService.getDashboardStats(eventId, parseInt(page), parseInt(limit));
  }
}
