import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Admin')
@Controller('admin')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Patch('change-password')
  @ApiOperation({ summary: 'Change user password' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Current password does not match' })
  @ApiResponse({ status: 404, description: 'User not found' })
  changePassword(@Req() req: any, @Body() changePasswordDto: ChangePasswordDto) {
    return this.adminService.changePassword(req.user.email, changePasswordDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all admins (users) (sorted by latest first)' })
  @ApiResponse({ status: 200, description: 'List of all users' })
  findAll() {
    return this.adminService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.adminService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(@Param('id') id: string) {
    return this.adminService.remove(id);
  }
}
