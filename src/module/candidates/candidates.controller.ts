import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Get candidate by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Candidate ID' })
  @ApiResponse({ status: 200, description: 'Candidate found' })
  @ApiResponse({ status: 404, description: 'Candidate not found' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.candidatesService.findOne(id);
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
