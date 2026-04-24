import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('certificates/:walletAddress')
  @ApiOperation({ summary: 'Get certificates by wallet address' })
  async getCertificates(@Param('walletAddress') walletAddress: string) {
    return this.usersService.getCertificatesByWallet(walletAddress);
  }
}
