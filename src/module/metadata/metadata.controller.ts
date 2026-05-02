import { Controller, Get, Post, Body, Query, Res, UseGuards } from '@nestjs/common';
import { MetadataService } from './metadata.service';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBody, ApiQuery, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UploadMetadataDto } from './dto/upload-metadata.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Metadata')
@Controller('metadata')
export class MetadataController {
  constructor(private readonly metadataService: MetadataService) {}

  @Get('test-overlay')
  @ApiOperation({ summary: 'Test certificate overlay with name' })
  @ApiQuery({ name: 'name', required: true, description: 'Candidate name to overlay on the certificate template' })
  @ApiResponse({ status: 200, description: 'JPEG image with name overlaid on the certificate template' })
  @ApiResponse({ status: 400, description: 'Name query parameter is required' })
  async testOverlay(@Query('name') name: string, @Res() res: Response) {
    if (!name) {
      return res.status(400).send('Name query parameter is required');
    }
    const buffer = await this.metadataService.generateCertificateImage(name);
    res.set({
      'Content-Type': 'image/jpeg',
      'Content-Disposition': 'inline; filename=test_certificate.jpg',
    });
    res.send(buffer);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Generate certificate image and upload metadata to IPFS via Pinata' })
  @ApiBody({ type: UploadMetadataDto })
  @ApiResponse({ status: 201, description: 'Certificate image and metadata uploaded to IPFS successfully' })
  @ApiResponse({ status: 400, description: 'Invalid metadata or IPFS upload failed' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  async uploadToIpfs(@Body() uploadMetadataDto: UploadMetadataDto) {
    const imageBuffer = await this.metadataService.generateCertificateImage(uploadMetadataDto.name);

    return this.metadataService.uploadToIpfs({
      ...uploadMetadataDto,
      imageBuffer,
    });
  }
}
