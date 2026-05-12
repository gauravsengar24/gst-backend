import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('certificates/:walletAddress')
  @ApiOperation({ summary: 'Get certificates by wallet address' })
  @ApiParam({ name: 'walletAddress', type: 'string', description: 'Blockchain wallet address of the user' })
  @ApiResponse({ status: 200, description: 'List of certificates belonging to the wallet address' })
  @ApiResponse({ status: 404, description: 'No certificates found for this wallet address' })
  async getCertificates(@Param('walletAddress') walletAddress: string) {
    return this.usersService.getCertificatesByWallet(walletAddress);
  }

  @Get('certificate-by-tx')
  @ApiOperation({ summary: 'Get certificate details by transaction URL or hash' })
  @ApiQuery({ name: 'url', type: 'string', description: 'Transaction URL or hash' })
  @ApiResponse({ status: 200, description: 'Certificate details' })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  async getCertificateByTx(@Query('url') url: string) {
    const result = await this.usersService.getCertificateByTx(url);
    if (!result) {
      return { message: 'Certificate not found for this transaction', success: false };
    }
    return result;
  }
}
