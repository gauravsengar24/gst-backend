import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth, ApiExcludeEndpoint, ApiQuery } from '@nestjs/swagger';
import { CandidatesService } from './candidates.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Candidates')
@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @ApiExcludeEndpoint()
  @Post()
  @ApiOperation({ summary: 'Create a new candidate' })
  @ApiBody({ type: CreateCandidateDto, description: 'Candidate data to create' })
  @ApiResponse({ status: 201, description: 'Candidate created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid candidate data' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  create(@Body() createCandidateDto: CreateCandidateDto) {
    return this.candidatesService.create(createCandidateDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all candidates' })
  @ApiResponse({ status: 200, description: 'List of all candidates' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.candidatesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get candidates by certificate ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Certificate ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: '1' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: '10' })
  @ApiQuery({ name: 'search', required: false, description: 'Search keyword' })
  @ApiResponse({ status: 200, description: 'List of candidates' })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string
  ) {
    return this.candidatesService.findOne(id, parseInt(page), parseInt(limit), search);
  }

  @ApiExcludeEndpoint()
  @Patch(':id')
  @ApiOperation({ summary: 'Update candidate by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Candidate ID' })
  @ApiBody({ type: UpdateCandidateDto, description: 'Candidate data to update' })
  @ApiResponse({ status: 200, description: 'Candidate updated successfully' })
  @ApiResponse({ status: 404, description: 'Candidate not found' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateCandidateDto: UpdateCandidateDto) {
    return this.candidatesService.update(id, updateCandidateDto);
  }

  @ApiExcludeEndpoint()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete candidate by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Candidate ID' })
  @ApiResponse({ status: 200, description: 'Candidate deleted successfully' })
  @ApiResponse({ status: 404, description: 'Candidate not found' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.candidatesService.remove(id);
  }
}
