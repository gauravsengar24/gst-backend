import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCandidateDto } from '../../candidates/dto/create-candidate.dto';

export class CreateCertificateDto {
  @ApiProperty({ example: 'Participation Certificate' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiProperty({ example: 'CertifyMe' })
  @IsNotEmpty()
  @IsString()
  issuingAuthority!: string;

  @ApiProperty({ example: '2026-04-13T00:00:00Z', required: false, description: 'Issue date; auto-generated if omitted' })
  @IsOptional()
  @IsDateString()
  issuedAt?: string;

  @ApiProperty({ example: 'Awarded for participation in the annual hackathon', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [CreateCandidateDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCandidateDto)
  candidates?: CreateCandidateDto[];

  @ApiProperty({ example: '60d0fe4f5311236168a109ca', required: false })
  @IsOptional()
  @IsString()
  eventId?: string;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  bulkCount?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  generatePlaceholders?: boolean;
}
