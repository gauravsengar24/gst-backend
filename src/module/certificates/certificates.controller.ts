import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Res, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { CertificatesService } from './certificates.service';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { CreateCandidateDto } from '../candidates/dto/create-candidate.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Certificates')
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new certificate with optional candidates' })
  @ApiBody({ type: CreateCertificateDto, description: 'Certificate data to create' })
  @ApiResponse({ status: 201, description: 'Certificate created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid certificate data' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  create(@Body() createCertificateDto: CreateCertificateDto) {
    return this.certificatesService.create(createCertificateDto);
  }
  
  @Post('bulk-upload')
  @ApiOperation({ summary: 'Create a new certificate and upload candidates via CSV' })
  @UseInterceptors(FileInterceptor('file'))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'CSV file with candidate data' },
        title: { type: 'string' },
        issuer: { type: 'string' },
        description: { type: 'string' },
        eventId: { type: 'string' },
        issuedAt: { type: 'string' },
        bulkCount: { type: 'number', description: 'Total number of candidates in the CSV' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Certificate created and candidates added from CSV. Ensure CSV has "name" and "walletAddress" columns.' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  bulkUpload(
    @Body() createCertificateDto: CreateCertificateDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.certificatesService.createWithCsv(createCertificateDto, file);
  }

  @Post(':id/upload')
  @ApiOperation({ summary: 'Upload generated images to IPFS and mint NFTs' })
  @ApiParam({ name: 'id', type: 'string', description: 'Certificate ID' })
  @ApiResponse({ status: 200, description: 'Certificate successfully uploaded to IPFS and NFTs minted' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  upload(@Param('id') id: string) {
    return this.certificatesService.uploadToIpfs(id);
  }

  @Post(':id/issue')
  @ApiOperation({ summary: 'Issue certificate: Upload images to IPFS and mint NFTs for all candidates' })
  @ApiParam({ name: 'id', type: 'string', description: 'Certificate ID' })
  @ApiResponse({ status: 200, description: 'Certificate successfully issued (Uploaded to IPFS and NFT Minted)' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  issueCertificate(@Param('id') id: string) {
    return this.certificatesService.uploadToIpfs(id);
  }

  @Post(':id/candidates')
  @ApiOperation({ summary: 'Add candidates to an existing certificate' })
  @ApiParam({ name: 'id', type: 'string', description: 'Certificate ID' })
  @ApiBody({ type: [CreateCandidateDto], description: 'List of candidates to add' })
  @ApiResponse({ status: 200, description: 'Candidates added successfully' })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  addCandidates(@Param('id') id: string, @Body() candidates: CreateCandidateDto[]) {
    return this.certificatesService.addCandidates(id, candidates);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download certificate as PDF' })
  @ApiParam({ name: 'id', type: 'string', description: 'Certificate ID' })
  @ApiQuery({ name: 'name', required: false, description: 'Candidate name to appear on certificate' })
  async downloadCertificate(
    @Param('id') id: string,
    @Query('name') name: string,
    @Res() res: Response
  ) {
    const stream = await this.certificatesService.generatePdf(id, name);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=certificate_${name || 'recipient'}.pdf`,
    });
    stream.pipe(res);
  }

  @Get()
  @ApiOperation({ summary: 'Get all certificates with pagination and search' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: '1' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: '10' })
  @ApiQuery({ name: 'search', required: false, description: 'Search keyword' })
  @ApiResponse({ status: 200, description: 'List of certificates' })
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string
  ) {
    return this.certificatesService.findAll(parseInt(page), parseInt(limit), search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get certificate by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Certificate ID' })
  @ApiResponse({ status: 200, description: 'Certificate found' })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  findOne(@Param('id') id: string) {
    return this.certificatesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update certificate by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Certificate ID' })
  @ApiBody({ type: UpdateCertificateDto, description: 'Certificate data to update' })
  @ApiResponse({ status: 200, description: 'Certificate updated successfully' })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  update(@Param('id') id: string, @Body() updateCertificateDto: UpdateCertificateDto) {
    return this.certificatesService.update(id, updateCertificateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete certificate by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Certificate ID' })
  @ApiResponse({ status: 200, description: 'Certificate deleted successfully' })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  remove(@Param('id') id: string) {
    return this.certificatesService.remove(id);
  }
}
