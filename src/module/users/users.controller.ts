import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiExcludeEndpoint()
  @Get('certificates/:walletAddress')
  @ApiOperation({ summary: 'Get certificates by wallet address' })
  @ApiParam({ name: 'walletAddress', type: 'string', description: 'Blockchain wallet address of the user' })
  @ApiResponse({ status: 200, description: 'List of certificates belonging to the wallet address' })
  @ApiResponse({ status: 404, description: 'No certificates found for this wallet address' })
  async getCertificates(@Param('walletAddress') walletAddress: string) {
    return this.usersService.getCertificatesByWallet(walletAddress);
  }
}
