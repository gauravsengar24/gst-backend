import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: LoginDto, description: 'Login credentials' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post()
  @ApiOperation({ summary: 'Register new user' })
  @ApiBody({ type: CreateAuthDto, description: 'User registration data' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid user data' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  create(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.create(createAuthDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of all users (passwords excluded)' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.authService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'User ID (MongoDB ObjectId)' })
  @ApiResponse({ status: 200, description: 'User found (password excluded)' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.authService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'User ID (MongoDB ObjectId)' })
  @ApiBody({ type: UpdateAuthDto, description: 'User data to update' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
    return this.authService.update(id, updateAuthDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'User ID (MongoDB ObjectId)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.authService.remove(id);
  }
}
