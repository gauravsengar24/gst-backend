import { Controller, Get, Post, Body, Query, Res } from '@nestjs/common';
import { MetadataService } from './metadata.service';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { UploadMetadataDto } from './dto/upload-metadata.dto';

@ApiTags('Metadata')
@Controller('metadata')
export class MetadataController {
  constructor(private readonly metadataService: MetadataService) {}

  @Get('test-overlay')
  @ApiOperation({ summary: 'Test certificate overlay with name' })
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
  async uploadToIpfs(@Body() uploadMetadataDto: UploadMetadataDto) {
    const imageBuffer = await this.metadataService.generateCertificateImage(uploadMetadataDto.name);
    
    return this.metadataService.uploadToIpfs({
      ...uploadMetadataDto,
      imageBuffer,
    });
  }
}
